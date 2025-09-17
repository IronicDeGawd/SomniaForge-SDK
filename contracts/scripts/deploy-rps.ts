import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying RockPaperScissors contract with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  const RockPaperScissors = await ethers.getContractFactory("RockPaperScissors");
  const rockPaperScissors = await RockPaperScissors.deploy();

  await rockPaperScissors.waitForDeployment();

  console.log("RockPaperScissors deployed to:", await rockPaperScissors.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });