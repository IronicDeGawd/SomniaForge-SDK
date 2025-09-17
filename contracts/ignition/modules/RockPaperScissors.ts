import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const RockPaperScissorsModule = buildModule("RockPaperScissorsModule", (m) => {
  const rockPaperScissors = m.contract("RockPaperScissors", [], {
    // Add deployment options for better reliability
    value: 0n,
    from: undefined, // Use default deployer
  });

  return { rockPaperScissors };
});

export default RockPaperScissorsModule;