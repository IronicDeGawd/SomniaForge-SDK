const hre = require("hardhat");

async function main() {
  console.log("Deploying RockPaperScissors contract...");

  const RockPaperScissors = await hre.ethers.getContractFactory("RockPaperScissors");
  const rockPaperScissors = await RockPaperScissors.deploy();

  console.log("Waiting for deployment...");
  await rockPaperScissors.waitForDeployment();

  const address = await rockPaperScissors.getAddress();
  console.log("RockPaperScissors deployed to:", address);
  
  // Wait a bit for the transaction to be mined
  console.log("Waiting for confirmation...");
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  console.log("Deployment complete!");
  console.log("Contract address:", address);
  console.log("Explorer link: https://shannon-explorer.somnia.network/address/" + address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });