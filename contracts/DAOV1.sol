// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./JKToken.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

interface DAOImplementation {
    enum Role {
        Member,
        Admin,
        Guest
    }

    function updateVotingFee(uint _fee) external;

    function updateVotingDuration(uint _period) external;

    function updateVotingThreshold(uint _threshold) external;

    function fundDAO(uint _amount) external;

    function updateExpiredProposals() external;

    function addMember(address _memberAddr, Role _role) external;

    function removeMember(address _member) external;

    function removeAdmin(address _member) external;

    function createWithdrawalProposal(address _address, uint _amount) external;

    function createDecisionProposal(
        address _address,
        bytes memory _data
    ) external;

    function vote(uint _proposalId, bool _agree, uint _fee) external;

    function memberRole(address _addr) external view returns (Role);
}

contract DAOV1 is DAOImplementation, Initializable {
    JKToken public jkToken;
    address public owner;
    uint public countProposal;
    uint public votingThreshold;
    uint public votingFee;
    uint public votingDuration;
    uint public mininumFundingAmount;
    bool initialized;

    struct Proposal {
        address target;
        uint amount;
        bytes data;
        bool executed;
        uint yesCount;
        uint noCount;
        Status status;
        uint createdAt;
        mapping(address => VoteStates) voteStates;
    }
    enum Status {
        PENDING,
        ACCEPTED,
        REJECTED
    }

    enum VoteStates {
        Yes,
        No
    }
    // We have 02 voting systems, vote for money withdrawal and vote for decision making
    mapping(uint => Proposal) public proposals;
    mapping(address => Role) public members;
    mapping(address => bool) public memberExist;
    mapping(uint => bool) public proposalExist;
    mapping(address => mapping(uint => bool)) public hasVoted;
    mapping(address => uint) public funding;

    event newMember(address, Role);
    event newProposalEvent(uint, address, bytes);
    event newWithdrawalProposalEvent(uint, address);
    event voteEvent(address, uint, VoteStates);
    event transferFundsEvent(address, uint);
    event removeParticipant(address);

    //Initialize the DAO parameters
    function initialize(address _erc20ContractAddress) public initializer {
        owner = msg.sender;
        members[owner] = Role.Admin;
        memberExist[owner] = true;
        votingThreshold = 12;
        jkToken = JKToken(_erc20ContractAddress);
        votingFee = 7;
        votingDuration = 1 weeks;
        mininumFundingAmount = 100;
        initialized = true;
    }

    //Verify if owner
    modifier onlyOwner() {
        require(
            members[msg.sender] == Role.Admin,
            "Only the owner can make this call"
        );
        _;
    }

    //Verify if admin
    modifier onlyAdmin() {
        require(
            (members[msg.sender] == Role.Admin || msg.sender == address(this)),
            "Only the admin can make this call"
        );
        _;
    }

    function updateVotingFee(uint _fee) external override onlyAdmin {
        votingFee = _fee;
    }

    function updateVotingDuration(uint _period) external override onlyAdmin {
        votingDuration = _period;
    }

    function updateVotingThreshold(
        uint _threshold
    ) external override onlyAdmin {
        votingThreshold = _threshold;
    }

    // Participants have to fund the DAO to have voting rights
    function fundDAO(uint _amount) external override {
        require(_amount > 0, "Amount must be greater than zero");
        require(_amount >= mininumFundingAmount, "Amount too small");
        require(
            _amount < jkToken.balanceOf(msg.sender),
            "Can't fund DAO with more than available balance"
        );
        require(
            jkToken.transferToken(msg.sender, address(this), _amount),
            "Transfer failed, try again later"
        );

        funding[msg.sender] += _amount;
    }

    function proposalExpired(uint _proposalId) public view returns (bool) {
        return
            proposals[_proposalId].createdAt + votingDuration <=
            block.timestamp;
    }

    //Check all proposals and update their status accordingly
    function updateExpiredProposals() external override onlyAdmin {
        require(initialized, "DAO hasn't been initialized");
        require(countProposal > 0, "No available proposals");

        for (uint i = 1; i <= countProposal; i++) {
            Proposal storage proposal = proposals[i];
            if (proposalExpired(i) && proposal.status == Status.PENDING) {
                if (
                    (proposal.yesCount > proposal.noCount) &&
                    (proposal.yesCount > votingThreshold)
                ) {
                    //if decisional proposal
                    if (proposal.amount == 0) {
                        (bool s, ) = (proposal.target).call(proposal.data);
                        require(s);
                    } else {
                        transferFunds(proposal.target, proposal.amount);
                        proposal.executed = true;
                    }
                    proposal.executed = true;
                    proposal.status = Status.ACCEPTED;
                } else {
                    proposal.status = Status.REJECTED;
                }
            }
        }
    }

    function transferFunds(address _recipient, uint _amount) internal {
        require(_recipient != address(0), "The recipient address is invalid");
        require(_amount > 0, "Amount must be greater than zero");
        require(
            _amount < jkToken.balanceOf(address(this)),
            "Can't fund DAO with more than available balance"
        );
        require(
            jkToken.transferToken(address(this), _recipient, _amount),
            "Transfer failed, try again later"
        );
        emit transferFundsEvent(_recipient, _amount);
    }

    //Add participants to the DAO with their respective role
    function addMember(
        address _memberAddr,
        Role _role
    ) external override onlyAdmin {
        require(!memberExist[_memberAddr], "Member already exist");
        members[_memberAddr] = _role;

        memberExist[_memberAddr] = true;

        emit newMember(_memberAddr, _role);
    }

    //Remove participants with role MEMBER from the DAO
    function removeMember(address _member) external override onlyAdmin {
        require(memberExist[_member], "Not a participant");
        require(
            members[_member] != Role.Admin,
            "Don't have the rights to remove an admin"
        );
        members[_member] = Role.Guest;
        memberExist[_member] = false;
        emit removeParticipant(_member);
    }

    // only owner can remove an admin
    function removeAdmin(address _member) external override onlyOwner {
        require(memberExist[_member], "Not a participant");
        members[_member] = Role.Guest;
        memberExist[_member] = false;
        emit removeParticipant(_member);
    }

    // Create a proposal for fund withdrawal
    function createWithdrawalProposal(
        address _address,
        uint _amount
    ) external override {
        require(
            memberExist[msg.sender] == true,
            "Only participants can make this call"
        );
        require(
            _amount > 0 && _amount < jkToken.balanceOf(address(this)),
            "Proposal amount must be greater than 0 but less that contract balance"
        );
        require(
            funding[_address] >= _amount,
            "Can't request more than what address funded"
        );
        countProposal++;
        Proposal storage newProposal = proposals[countProposal];
        newProposal.target = _address;
        newProposal.amount = _amount;
        newProposal.executed = false;
        newProposal.status = Status.PENDING;
        newProposal.createdAt = block.timestamp;

        proposalExist[countProposal] = true;
        emit newWithdrawalProposalEvent(countProposal, msg.sender);
    }

    // Create proposal for Decision making
    function createDecisionProposal(
        address _address,
        bytes memory _data
    ) external override {
        require(
            memberExist[msg.sender] == true,
            "Only participants can make this call"
        );
        require(funding[msg.sender] > 0, "You have no fund");

        countProposal++;
        Proposal storage newProposal = proposals[countProposal];
        newProposal.target = _address;
        newProposal.data = _data;
        newProposal.executed = false;
        newProposal.status = Status.PENDING;
        newProposal.createdAt = block.timestamp;

        proposalExist[countProposal] = true;
        emit newProposalEvent(countProposal, msg.sender, _data);
    }

    //Vote on available proposals by paying requested voting fee
    function vote(uint _proposalId, bool _agree, uint _fee) external override {
        require(initialized, "DAO hasn't been initialized");
        require(proposalExist[_proposalId] == true, "Proposal doesn't exist");
        Proposal storage proposal = proposals[_proposalId];
        require(
            proposal.executed == false,
            "Proposal has already been executed"
        );
        require(funding[msg.sender] > 0, "You have no voting rights");
        require(_fee >= votingFee, "Must pay the required fee");
        require(!hasVoted[msg.sender][_proposalId], "Has already voted");
        require(!proposalExpired(_proposalId), "Voting period has expired");

        require(
            jkToken.transferToken(msg.sender, address(this), _fee),
            "Transaction failed, try again later"
        );

        if (_agree) {
            proposal.yesCount += votingPower(msg.sender);
        } else {
            proposal.noCount += votingPower(msg.sender);
        }

        proposal.voteStates[msg.sender] = _agree
            ? VoteStates.Yes
            : VoteStates.No;
        if (
            (proposal.yesCount > proposal.noCount) &&
            (proposal.yesCount >= votingThreshold)
        ) {
            //if proposal is not about withdrawal
            if (proposal.amount == 0) {
                (bool s, ) = (proposal.target).call(proposal.data);
                require(s);
            } else {
                transferFunds(proposal.target, proposal.amount);
                proposal.executed = true;
                funding[proposal.target] =
                    funding[proposal.target] -
                    proposal.amount;
            }
            proposal.executed = true;
            proposal.status = Status.ACCEPTED;
        }
        hasVoted[msg.sender][_proposalId] = true;

        emit voteEvent(
            msg.sender,
            _proposalId,
            proposal.voteStates[msg.sender]
        );
    }

    // voting power depends on amount member funded the DAO
    function votingPower(address _addr) internal view returns (uint) {
        require(funding[_addr] > 0, "No voting power");
        return funding[_addr] / mininumFundingAmount;
    }

    function memberRole(address _addr) external view override returns (Role) {
        require(memberExist[_addr] == true, "Not a  member");
        return members[_addr];
    }
}
