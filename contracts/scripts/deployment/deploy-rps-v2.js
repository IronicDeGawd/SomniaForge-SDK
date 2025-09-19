const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying RockPaperScissorsV2 with auto-withdrawal...");

  // Deploy the new contract
  const RockPaperScissorsV2 = await hre.ethers.getContractFactory("RockPaperScissorsV2");
  const rpsV2 = await RockPaperScissorsV2.deploy();

  await rpsV2.waitForDeployment();
  const rpsV2Address = await rpsV2.getAddress();

  console.log("✅ RockPaperScissorsV2 deployed to:", rpsV2Address);

  // Test auto-withdrawal functionality
  console.log("\n🧪 Testing auto-withdrawal...");

  try {
    // Create a test game
    const entryFee = hre.ethers.parseEther("0.01");
    const tx1 = await rpsV2.createRPSGame(entryFee, { value: entryFee });
    const receipt1 = await tx1.wait();

    // Find the session ID from events
    let sessionId;
    for (const log of receipt1.logs) {
      try {
        const decoded = rpsV2.interface.parseLog(log);
        if (decoded.name === 'SessionCreated') {
          sessionId = decoded.args.sessionId;
          break;
        }
      } catch (e) {
        continue;
      }
    }

    console.log("📝 Created test session:", sessionId.toString());

    // Get a second account to join
    const [owner, player2] = await hre.ethers.getSigners();

    // Player 2 joins
    const tx2 = await rpsV2.connect(player2).joinRPSGame(sessionId, { value: entryFee });
    await tx2.wait();
    console.log("👥 Player 2 joined session");

    // Both players commit moves
    const move1 = 1; // Rock
    const move2 = 2; // Paper
    const nonce1 = 12345n;
    const nonce2 = 67890n;

    const hash1 = hre.ethers.keccak256(
      hre.ethers.solidityPacked(['address', 'uint256', 'uint256'], [owner.address, move1, nonce1])
    );
    const hash2 = hre.ethers.keccak256(
      hre.ethers.solidityPacked(['address', 'uint256', 'uint256'], [player2.address, move2, nonce2])
    );

    await rpsV2.commitMove(sessionId, hash1);
    await rpsV2.connect(player2).commitMove(sessionId, hash2);
    console.log("🤝 Both players committed moves");

    // Reveal moves
    await rpsV2.revealMove(sessionId, move1, nonce1);
    const revealTx = await rpsV2.connect(player2).revealMove(sessionId, move2, nonce2);
    const revealReceipt = await revealTx.wait();

    console.log("🎭 Both players revealed moves");

    // Check for auto-withdrawal events
    console.log("\n💰 Checking auto-withdrawal events...");
    for (const log of revealReceipt.logs) {
      try {
        const decoded = rpsV2.interface.parseLog(log);
        if (decoded.name === 'AutoWithdrawal') {
          console.log(`✅ Auto-withdrawal: ${decoded.args.player} received ${hre.ethers.formatEther(decoded.args.amount)} STT`);
        } else if (decoded.name === 'WithdrawalFailed') {
          console.log(`❌ Withdrawal failed: ${decoded.args.player} - ${hre.ethers.formatEther(decoded.args.amount)} STT moved to manual withdrawal`);
        } else if (decoded.name === 'GameResultDetermined') {
          console.log(`🏆 Winner: ${decoded.args.winner} - Prize: ${hre.ethers.formatEther(decoded.args.prizeAmount)} STT`);
        }
      } catch (e) {
        continue;
      }
    }

    // Check final balances
    const finalBalance1 = await rpsV2.playerBalances(owner.address);
    const finalBalance2 = await rpsV2.playerBalances(player2.address);

    console.log("\n📊 Final manual withdrawal balances:");
    console.log(`Player 1: ${hre.ethers.formatEther(finalBalance1)} STT`);
    console.log(`Player 2: ${hre.ethers.formatEther(finalBalance2)} STT`);

    if (finalBalance1 === 0n && finalBalance2 === 0n) {
      console.log("✅ SUCCESS: Auto-withdrawal worked! No manual withdrawal needed.");
    } else {
      console.log("⚠️  Some funds require manual withdrawal (normal for contract recipients)");
    }

  } catch (error) {
    console.error("❌ Test failed:", error);
  }

  console.log("\n📋 Deployment Summary:");
  console.log("Old contract (manual):", "0x38e4C113767fC478B17b15Cee015ab8452f28F93");
  console.log("New contract (auto):", rpsV2Address);
  console.log("\n🎯 Benefits of V2:");
  console.log("✅ Immediate prize distribution");
  console.log("✅ No risk of funds being stolen");
  console.log("✅ Lower gas costs (no separate withdrawal tx)");
  console.log("✅ Full event transparency");
  console.log("✅ Fallback safety for contract recipients");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });