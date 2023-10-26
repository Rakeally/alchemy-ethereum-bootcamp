const { ethers } = require("ethers");
require("dotenv").config();
const hre = require("hardhat");

async function main() {
  const url = process.env.SEPOLIA_URL;
  const privateKey = process.env.PRIVATE_KEY;
  console.log(url);
  const provider = new ethers.JsonRpcProvider(url);

  let wallet = new ethers.Wallet(privateKey, provider);

  let jkTokenArtifacts = await hre.artifacts.readArtifact("JKToken");
  let daoArtifacts = await hre.artifacts.readArtifact("DAOV1");
  let daoProxyArtifacts = await hre.artifacts.readArtifact("DAOProxy");

  const initialValue = 60000;

  const JKToken = new ethers.ContractFactory(
    jkTokenArtifacts.abi,
    jkTokenArtifacts.bytecode,
    wallet
  );

  const jkToken = await JKToken.deploy(initialValue);
  await jkToken.waitForDeployment();
  jkTokenContract = jkToken.target;

  const Dao = new ethers.ContractFactory(
    daoArtifacts.abi,
    daoArtifacts.bytecode,
    wallet
  );

  const dao = await Dao.deploy();
  await dao.waitForDeployment();

  const DaoProxy = new ethers.ContractFactory(
    daoProxyArtifacts.abi,
    daoProxyArtifacts.bytecode,
    wallet
  );
  const daoProxy = await DaoProxy.deploy(dao.target);

  await daoProxy.waitForDeployment();

  console.log("jktoken deployed to: ", jkTokenContract);
  console.log("DAO deployed to: ", dao.target);
  console.log("DAOProxy deployed to: ", daoProxy.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
