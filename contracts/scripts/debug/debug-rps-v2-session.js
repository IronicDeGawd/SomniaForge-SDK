const hre = require("hardhat");

async function main() {
  const sessionId = 2;
  const contractAddress = "0xaD114670d92588036240849b36A95FE4d10Ad08F";
  const targetWallet = "0x1A00D9a88fC5ccF7a52E268307F98739f770A956";

  console.log("🔍 Debugging RockPaperScissorsV2 session:", sessionId);
  console.log("🔍 Contract address:", contractAddress);
  console.log("🔍 Focusing on wallet:", targetWallet);

  // Get contract instance
  const RockPaperScissorsV2 = await hre.ethers.getContractFactory("RockPaperScissorsV2");
  const contract = RockPaperScissorsV2.attach(contractAddress);

  try {
    console.log("\n=== SESSION INFO ===");
    const isActive = await contract.isSessionActive(sessionId);
    console.log("Session active:", isActive);

    console.log("\n=== PLAYERS ===");
    const playerList = await contract.getSessionPlayers(sessionId);
    console.log("Player list:", playerList);

    console.log("\n=== SESSION DATA ===");
    const sessionData = await contract.sessions(sessionId);
    console.log("Session data:", {
      isActive: sessionData.isActive,
      isComplete: sessionData.isComplete,
      entryFee: hre.ethers.formatEther(sessionData.entryFee),
      prizePool: hre.ethers.formatEther(sessionData.prizePool),
      maxPlayers: sessionData.maxPlayers.toString(),
      createdAt: sessionData.createdAt.toString()
    });

    console.log("\n=== PLAYER MOVES ===");
    for (let i = 0; i < playerList.length; i++) {
      try {
        const playerData = await contract.sessionPlayers(sessionId, playerList[i]);
        const gameMove = await contract.getPlayerGameMove(sessionId, playerList[i]);
        console.log(`Player ${i + 1} (${playerList[i]}):`);
        console.log(`  Has submitted move: ${playerData.hasSubmittedMove}`);
        console.log(`  Move hash: ${playerData.moveHash}`);
        console.log(`  Game move: ${gameMove.move.toString()}, nonce: ${gameMove.nonce.toString()}, revealed: ${gameMove.revealed}`);
      } catch (err) {
        console.log(`Player ${i + 1} move data not available`);
      }
    }

    console.log("\n=== REVEAL INFO ===");
    const revealDeadline = await contract.getRevealDeadline(sessionId);
    const revealsCount = await contract.getRevealsCount(sessionId);
    const currentTime = Math.floor(Date.now() / 1000);

    console.log("Reveal deadline:", revealDeadline.toString());
    console.log("Current time:", currentTime);
    console.log("Time left:", (Number(revealDeadline) - currentTime), "seconds");
    console.log("Reveals count:", revealsCount.toString());
    console.log("Players count:", playerList.length);

    console.log("\n=== GAME RESULT ===");
    const gameResult = await contract.getGameResult(sessionId);
    console.log("Game result:", {
      winner: gameResult.winner,
      players: gameResult.players,
      moves: gameResult.moves.map(m => m.toString()),
      prizeAmount: hre.ethers.formatEther(gameResult.prizeAmount),
      isDraw: gameResult.isDraw,
      completedAt: gameResult.completedAt.toString()
    });

    console.log("\n=== PLAYER BALANCES (Manual Withdrawal) ===");
    for (let i = 0; i < playerList.length; i++) {
      const balance = await contract.playerBalances(playerList[i]);
      console.log(`Player ${i + 1} (${playerList[i]}) balance:`, hre.ethers.formatEther(balance), "STT");
    }

    console.log("\n=== TARGET WALLET ANALYSIS ===");
    console.log("Target wallet:", targetWallet);
    const targetIndex = playerList.findIndex(p => p.toLowerCase() === targetWallet.toLowerCase());
    if (targetIndex >= 0) {
      console.log("Wallet found at index:", targetIndex);

      const targetPlayerData = await contract.sessionPlayers(sessionId, targetWallet);
      const targetGameMove = await contract.getPlayerGameMove(sessionId, targetWallet);
      const targetBalance = await contract.playerBalances(targetWallet);

      console.log("Player data:", {
        isActive: targetPlayerData.isActive,
        hasSubmittedMove: targetPlayerData.hasSubmittedMove,
        moveHash: targetPlayerData.moveHash
      });

      console.log("Game move:", {
        move: targetGameMove.move.toString(),
        nonce: targetGameMove.nonce.toString(),
        revealed: targetGameMove.revealed
      });

      console.log("Manual withdrawal balance:", hre.ethers.formatEther(targetBalance), "STT");

      // Check if this player won/drew and should have received auto-withdrawal
      const isWinner = gameResult.winner.toLowerCase() === targetWallet.toLowerCase();
      const isDraw = gameResult.isDraw;

      if (isWinner) {
        console.log("✅ This wallet WON the game");
        if (targetBalance > 0n) {
          console.log("⚠️ Winner has manual withdrawal balance - auto-withdrawal may have failed");
        } else {
          console.log("✅ No manual withdrawal balance - auto-withdrawal likely succeeded");
        }
      } else if (isDraw) {
        console.log("🤝 This wallet was in a DRAW");
        if (targetBalance > 0n) {
          console.log("⚠️ Draw participant has manual withdrawal balance - auto-withdrawal may have failed");
        } else {
          console.log("✅ No manual withdrawal balance - auto-withdrawal likely succeeded");
        }
      } else {
        console.log("❌ This wallet LOST the game");
        console.log("Expected balance: 0 STT");
      }
    } else {
      console.log("❌ Target wallet not found in this session");
    }

  } catch (error) {
    console.error("❌ Error debugging session:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });