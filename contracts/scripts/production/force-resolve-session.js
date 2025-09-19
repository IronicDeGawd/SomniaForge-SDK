const hre = require("hardhat");

async function main() {
  const sessionId = 24;
  const contractAddress = "0x38e4C113767fC478B17b15Cee015ab8452f28F93";

  console.log("🔧 Force resolving RockPaperScissors session:", sessionId);
  console.log("📍 Contract address:", contractAddress);

  // Get contract instance
  const RockPaperScissors = await hre.ethers.getContractFactory("RockPaperScissors");
  const contract = RockPaperScissors.attach(contractAddress);

  try {
    // Check current state before resolving
    console.log("\n=== PRE-RESOLUTION STATE ===");
    const isActive = await contract.isSessionActive(sessionId);
    const revealsCount = await contract.getRevealsCount(sessionId);
    const playerList = await contract.getSessionPlayers(sessionId);
    const revealDeadline = await contract.getRevealDeadline(sessionId);
    const currentTime = Math.floor(Date.now() / 1000);

    console.log("Session active:", isActive);
    console.log("Reveals count:", revealsCount.toString(), "of", playerList.length);
    console.log("Reveal deadline passed:", currentTime > Number(revealDeadline), `(${currentTime - Number(revealDeadline)} seconds ago)`);

    if (!isActive) {
      console.log("❌ Session is not active - cannot resolve");
      return;
    }

    if (revealsCount.toString() === playerList.length.toString()) {
      console.log("❌ All players have revealed - should auto-resolve. Check if game is already complete.");
      const gameResult = await contract.getGameResult(sessionId);
      if (gameResult.completedAt.toString() !== "0") {
        console.log("✅ Game is already complete");
        return;
      }
    }

    if (currentTime <= Number(revealDeadline)) {
      console.log("❌ Reveal deadline has not passed yet - cannot force resolve");
      console.log("Time remaining:", Number(revealDeadline) - currentTime, "seconds");
      return;
    }

    console.log("\n=== CALLING forceResolveGame ===");
    const tx = await contract.forceResolveGame(sessionId);
    console.log("Transaction hash:", tx.hash);
    console.log("⏳ Waiting for confirmation...");

    const receipt = await tx.wait();
    console.log("✅ Transaction confirmed in block:", receipt.blockNumber);
    console.log("Gas used:", receipt.gasUsed.toString());

    console.log("\n=== POST-RESOLUTION STATE ===");
    const gameResult = await contract.getGameResult(sessionId);
    console.log("Game result:", {
      winner: gameResult.winner,
      players: gameResult.players,
      moves: gameResult.moves.map(m => m.toString()),
      prizeAmount: hre.ethers.formatEther(gameResult.prizeAmount),
      isDraw: gameResult.isDraw,
      completedAt: gameResult.completedAt.toString()
    });

    console.log("\n=== PLAYER BALANCES ===");
    for (let i = 0; i < playerList.length; i++) {
      const balance = await contract.playerBalances(playerList[i]);
      console.log(`Player ${i + 1} (${playerList[i]}) balance:`, hre.ethers.formatEther(balance), "STT");
    }

    console.log("\n✅ Session resolved successfully!");

  } catch (error) {
    console.error("❌ Error force resolving session:", error);
    if (error.reason) {
      console.error("Reason:", error.reason);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });