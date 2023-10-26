const { expect } = require("chai");
const hre = require("hardhat");
const ethers = require("ethers");

require("dotenv").config();

describe("My DAO", function () {
  let DAOContract;
  let jkTokenContract;
  let jkToken;
  let signerList;
  let signerAddresses = [];

  before(async function () {
    const initialValue = 60000;
    const signers = await hre.ethers.getSigners();
    // Access the first five signer accounts
    signerList = [...signers.slice(1, 10)];

    for (let i = 0; i < signerList.length; i++) {
      const address = await signerList[i].getAddress();
      signerAddresses.push(address);
    }

    const JKToken = await hre.ethers.getContractFactory("JKToken");
    jkToken = await JKToken.deploy(initialValue);

    await jkToken.waitForDeployment();
    jkTokenContract = jkToken.target;

    const Dao = await hre.ethers.getContractFactory("DAOV1");

    const dao = await Dao.deploy();
    await dao.waitForDeployment();

    const DaoProxy = await hre.ethers.getContractFactory("DAOProxy");
    const daoProxy = await DaoProxy.deploy(dao.target);

    await daoProxy.waitForDeployment();
    DAOContract = Dao.attach(daoProxy.target);
  });

  describe("Test contracts deployment", async () => {
    it("should deploy the JKToken contract", async function () {
      expect(jkTokenContract).to.not.undefined;
      expect(jkTokenContract).to.not.equal(
        "0x0000000000000000000000000000000000000000"
      );
    });

    it("should deploy the proxy contract", async function () {
      expect(await DAOContract.target).to.not.undefined;
      expect(await DAOContract.target).to.not.equal(
        "0x0000000000000000000000000000000000000000"
      );
    });

    it("should failed if DAO has not initialized", async function () {
      try {
        await DAOContract.vote(1, 1, 20);
        expect.fail("Expected a revert");
      } catch (error) {
        expect(error.message).to.contain("DAO hasn't been initialized");
      }
    });

    it("should initialize DAO contract", async function () {
      const initializeDAO = await DAOContract.initialize(jkTokenContract);

      expect(initializeDAO.hash).to.not.undefined;
      expect(initializeDAO.hash).to.be.a("string");
    });

    it("should prevent initializing DAO contract twice", async function () {
      try {
        await DAOContract.initialize(jkTokenContract);
        expect.fail("Expected a revert");
      } catch (error) {
        expect(error.message).to.contain("InvalidInitialization");
      }
    });
  });

  describe("JK Token transfer", async () => {
    it("should transfer jk tokens to accounts", async function () {
      for (let i = 0; i < 8; i++) {
        const transferAmount = 1000;
        const transfer = await jkToken.transfer(
          signerAddresses[i],
          transferAmount
        );

        expect(transfer.hash).to.not.undefined;
        expect(transfer.hash).to.be.a("string");
      }
    });

    it("Should not allow transfers from an account with insufficient balance", async function () {
      const [signer] = await hre.ethers.getSigners();
      const senderAddress = await signer.getAddress();
      const recipient = "0x9DC98ab73BC99DC2e9fd31766e452524A76196AE";

      const transferAmount = 300;
      try {
        await jkToken.transferFrom(senderAddress, recipient, transferAmount);
        expect.fail("Expected a revert");
      } catch (error) {
        expect(error.message).to.contain("ERC20: insufficient allowance");
      }
    });
  });

  describe("Add members with respective roles to DAO", async () => {
    it("should add members to DAO", async function () {
      for (let i = 0; i < 5; i++) {
        const newMember = await DAOContract.addMember(signerAddresses[i], 0);

        expect(newMember.hash).to.not.undefined;
        expect(newMember.hash).to.be.a("string");
      }
    });
    it("should add an admin to DAO", async function () {
      const newMember = await DAOContract.addMember(signerAddresses[5], 1);

      expect(newMember.hash).to.not.undefined;
      expect(newMember.hash).to.be.a("string");
    });

    it("should add a treasurer to DAO", async function () {
      const newMember = await DAOContract.addMember(signerAddresses[6], 2);

      expect(newMember.hash).to.not.undefined;
      expect(newMember.hash).to.be.a("string");
    });

    it("should prevent adding members twice", async function () {
      try {
        await DAOContract.addMember(signerAddresses[0], 0);
        expect.fail("Expected a revert");
      } catch (error) {
        expect(error.message).to.contain("Member already exist");
      }
    });

    it("should prevent non admins from adding member", async function () {
      try {
        await DAOContract.connect(signerList[3]).addMember(
          signerAddresses[3],
          0
        );
        expect.fail("Expected a revert");
      } catch (error) {
        expect(error.message).to.contain("Only the admin can make this call");
      }
    });
  });

  describe("Fund DAO", async () => {
    it("should fund the DAO", async function () {
      let counter = 0;

      for (let i = 0; i < 8; i++) {
        counter++;

        const tx = await DAOContract.connect(signerList[i]).fundDAO(
          100 * counter
        );

        await tx.wait();

        expect(await tx.hash).to.not.undefined;
        expect(tx.hash).to.be.a("string");
      }
    });

    it("should prevent funding 0 amount", async function () {
      try {
        await DAOContract.connect(signerList[0]).fundDAO(0);
        expect.fail("Expected a revert");
      } catch (error) {
        expect(error.message).to.contain("Amount must be greater than zero");
      }
    });

    it("should prevent funding less that DAO minimum amount", async function () {
      try {
        await DAOContract.connect(signerList[0]).fundDAO(1);
        expect.fail("Expected a revert");
      } catch (error) {
        expect(error.message).to.contain("Amount too small");
      }
    });

    it("should prevent funding more than sender balance", async function () {
      try {
        await DAOContract.connect(signerList[0]).fundDAO(100000);
        expect.fail("Expected a revert");
      } catch (error) {
        expect(error.message).to.contain(
          "Can't fund DAO with more than available balance"
        );
      }
    });
  });

  describe("Create decisional proposal", async () => {
    it("should prevent non participant from creating proposals", async function () {
      //hex data for fee update
      const data =
        "0xf08c7a710000000000000000000000000000000000000000000000000000000000000085";

      try {
        await DAOContract.connect(signerList[8]).createDecisionProposal(
          signerAddresses[8],
          data
        );
        expect.fail("Expected a revert");
      } catch (error) {
        expect(error.message).to.contain(
          "Only participants can make this call"
        );
      }
    });

    it("should create proposals successfully", async function () {
      //data for fee update
      const interface = new ethers.Interface([
        "function updateVotingFee(uint256) external",
      ]);
      const data = interface.encodeFunctionData("updateVotingFee", [7]);

      const decisionProposal = await DAOContract.connect(
        signerList[3]
      ).createDecisionProposal(DAOContract, data);
      expect(await decisionProposal.hash).to.not.undefined;
    });
  });

  describe("Create withdrawal proposal", async () => {
    it("should prevent non participant from creating proposals", async function () {
      try {
        await DAOContract.connect(signerList[8]).createWithdrawalProposal(
          signerAddresses[8],
          43
        );
        expect.fail("Expected a revert");
      } catch (error) {
        expect(error.message).to.contain(
          "Only participants can make this call"
        );
      }
    });

    it("should prevent creating proposals requesting for more than contract balance", async function () {
      try {
        await DAOContract.connect(signerList[2]).createWithdrawalProposal(
          signerAddresses[2],
          4300000000000
        );
        expect.fail("Expected a revert");
      } catch (error) {
        expect(error.message).to.contain(
          "Proposal amount must be greater than 0 but less that contract balance"
        );
      }
    });

    it("should prevent creating proposals requesting for more than staked amount", async function () {
      try {
        await DAOContract.connect(signerList[2]).createWithdrawalProposal(
          signerAddresses[2],
          430
        );
        expect.fail("Expected a revert");
      } catch (error) {
        expect(error.message).to.contain(
          "Can't request more than what address funded"
        );
      }
    });

    it("should create withdrawal proposals successfully", async function () {
      const withdrawalProposal = await DAOContract.connect(
        signerList[2]
      ).createWithdrawalProposal(signerAddresses[2], 100);
      expect(await withdrawalProposal.hash).to.not.undefined;
      expect(withdrawalProposal.hash).to.be.a("string");
    });
  });

  describe("Vote proposal", async () => {
    it("should prevent voting non existing proposal", async function () {
      try {
        await DAOContract.connect(signerList[3]).vote(5, 1, 10);
        expect.fail("Expected a revert");
      } catch (error) {
        expect(error.message).to.contain("Proposal doesn't exist");
      }
    });

    it("should prevent member with no voting power from voting", async function () {
      try {
        await DAOContract.connect(signerList[8]).vote(1, 1, 10);
        expect.fail("Expected a revert");
      } catch (error) {
        expect(error.message).to.contain("You have no voting rights");
      }
    });

    it("should prevent voting on proposals with less than specified fee", async function () {
      try {
        await DAOContract.connect(signerList[3]).vote(1, 0, 3);
        expect.fail("Expected a revert");
      } catch (error) {
        expect(error.message).to.contain("Must pay the required fee");
      }
    });

    it("should vote on proposal successfully", async function () {
      const tx = await DAOContract.connect(signerList[5]).vote(1, 1, 10);
      expect(await tx.hash).to.not.undefined;
      expect(tx.hash).to.be.a("string");
    });

    it("should prevent voting twice", async function () {
      try {
        await DAOContract.connect(signerList[5]).vote(1, 1, 10);
        expect.fail("Expected a revert");
      } catch (error) {
        expect(error.message).to.contain("Has already voted");
      }
    });

    it("should execute decisional proposals if requirements are met", async function () {
      const tx = await DAOContract.connect(signerList[6]).vote(1, 1, 10);
      const proposalExecuted = await DAOContract.proposals(1);
      expect(await tx.hash).to.not.undefined;
      expect(proposalExecuted[3]).to.be.equal(true);
    });

    it("should prevent vote on already executed proposal", async function () {
      try {
        await DAOContract.connect(signerList[6]).vote(1, 1, 10);
        expect.fail("Expected a revert");
      } catch (error) {
        expect(error.message).to.contain("Proposal has already been executed");
      }
    });

    it("should execute withdrawal proposals if requirements are met", async function () {
      await DAOContract.connect(signerList[6]).vote(2, 1, 10);
      await DAOContract.connect(signerList[2]).vote(2, 1, 10);
      await DAOContract.connect(signerList[3]).vote(2, 0, 10);
      await DAOContract.connect(signerList[4]).vote(2, 0, 10);
      await DAOContract.connect(signerList[5]).vote(2, 0, 10);

      const tx = await DAOContract.connect(signerList[7]).vote(2, 1, 10);

      const proposalExecuted = await DAOContract.proposals(2);
      expect(await tx.hash).to.not.undefined;
      expect(proposalExecuted[3]).to.be.equal(true);
    });
  });

  describe("Remove participants", () => {
    it("should prevent participants with role member from removing an other member", async function () {
      try {
        await DAOContract.connect(signerList[2]).removeMember(
          signerAddresses[3]
        );
        expect.fail("Expected a revert");
      } catch (error) {
        expect(error.message).to.contain("Only the admin can make this call");
      }
    });
    it("should revert if participants tries to remove a non participant", async function () {
      try {
        await DAOContract.connect(signerList[5]).removeMember(
          signerAddresses[8]
        );
        expect.fail("Expected a revert");
      } catch (error) {
        // console.log("error: ", error);
        expect(error.message).to.contain("Not a participant");
      }
    });

    it("should remove participants with role members", async function () {
      const removeMember = await DAOContract.removeMember(signerAddresses[2]);
      expect(removeMember.hash).to.not.be.undefined;
      expect(removeMember.hash).to.be.a("string");
    });

    it("should prevent admin from removing an other admin", async function () {
      try {
        await DAOContract.removeMember(signerAddresses[5]);
        expect.fail("Expected a revert");
      } catch (error) {
        expect(error.message).to.contain(
          "Don't have the rights to remove an admin"
        );
      }
    });

    it("should permit owner to remove admin", async function () {
      const removeAdmin = await DAOContract.removeAdmin(signerAddresses[5]);
      expect(removeAdmin.hash).to.not.be.undefined;
      expect(removeAdmin.hash).to.be.a("string");
    });
  });

  describe("Update DAO rules", () => {
    it("should prevent non admins from making this changes", async function () {
      try {
        await DAOContract.connect(signerList[3]).updateVotingFee(15);
        expect.fail("Expected a revert");
      } catch (error) {
        expect(error.message).to.contain("Only the admin can make this call");
      }
    });
    it("should permit admins to update voting fee", async function () {
      const feeUpdate = await DAOContract.updateVotingFee(15);
      expect(feeUpdate.hash).to.not.be.undefined;
      expect(feeUpdate.hash).to.be.a("string");
    });

    it("should permit admins to update voting threshold", async function () {
      const updateThreshold = await DAOContract.updateVotingThreshold(18);
      expect(updateThreshold.hash).to.not.be.undefined;
      expect(updateThreshold.hash).to.be.a("string");
    });

    it("should permit admins to update voting duration", async function () {
      const newVotingDuration = 30 * 60;
      const updateDuration = await DAOContract.updateVotingDuration(
        newVotingDuration
      );
      expect(updateDuration.hash).to.not.be.undefined;
      expect(updateDuration.hash).to.be.a("string");
    });
  });

  describe("Update failed proposals status", () => {
    it("should update expired proposals status", async function () {
      await DAOContract.createWithdrawalProposal(signerAddresses[6], 43);
      const newVotingDuration = 1;
      await DAOContract.updateVotingDuration(newVotingDuration);
      const updateProposal = await DAOContract.updateExpiredProposals();

      expect(updateProposal.hash).to.not.be.undefined;
      expect(updateProposal.hash).to.be.a("string");
    });
  });
});
