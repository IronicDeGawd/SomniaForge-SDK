const hre = require("hardhat");

async function main() {
  const sessionId = 2; // Session ID to debug
  const contractAddress = "0xaD114670d92588036240849b36A95FE4d10Ad08F";
  const targetWallet = "0x1A00D9a88fC5ccF7a52E268307F98739f770A956"; // Target wallet
  
  console.log("🔍 Debugging RockPaperScissors session:", sessionId);
  console.log("🔍 Contract address:", contractAddress);
  console.log("🔍 Focusing on wallet:", targetWallet);
  
  // Get contract instance
  const RockPaperScissors = await hre.ethers.getContractFactory("RockPaperScissors");
  const contract = RockPaperScissors.attach(contractAddress);
  
  try {
    console.log("\n=== SESSION INFO ===");
    const isActive = await contract.isSessionActive(sessionId);
    console.log("Session active:", isActive);
    
    console.log("\n=== PLAYERS ===");
    const playerList = await contract.getSessionPlayers(sessionId);
    console.log("Player list:", playerList);
    
    for (let i = 0; i < playerList.length; i++) {
      const moveHash = await contract.getPlayerMove(sessionId, playerList[i]);
      console.log(`Player ${i + 1} (${playerList[i]}):`, {
        moveHash: moveHash,
        hasSubmittedMove: moveHash !== "0x0000000000000000000000000000000000000000000000000000000000000000"
      });
    }
    
    console.log("\n=== GAME MOVES ===");
    for (let i = 0; i < playerList.length; i++) {
      try {
        const gameMove = await contract.getPlayerGameMove(sessionId, playerList[i]);
        console.log(`Player ${i + 1} game move:`, {
          move: gameMove.move.toString(),
          nonce: gameMove.nonce.toString(),
          revealed: gameMove.revealed
        });
      } catch (err) {
        console.log(`Player ${i + 1} game move: Not found or error`);
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
    
    console.log("\n=== ANALYSIS ===");
    if (revealsCount.toString() === playerList.length.toString()) {
      console.log("✅ All players have revealed - game should be complete");
    } else {
      console.log("⏳ Waiting for more reveals:", revealsCount.toString(), "of", playerList.length);
    }
    
    if (gameResult.completedAt.toString() === "0") {
      console.log("❌ Game result not set - _determineRPSWinner() not called");
    } else {
      console.log("✅ Game is complete");
    }
    
    console.log("\n=== PLAYER BALANCES ===");
    for (let i = 0; i < playerList.length; i++) {
      const balance = await contract.playerBalances(playerList[i]);
      console.log(`Player ${i + 1} (${playerList[i]}) balance:`, hre.ethers.formatEther(balance), "STT");
    }

    console.log("\n=== SPECIFIC WALLET ANALYSIS ===");
    console.log("Target wallet:", targetWallet);
    const targetIndex = playerList.findIndex(p => p.toLowerCase() === targetWallet.toLowerCase());
    if (targetIndex >= 0) {
      console.log("Wallet found at index:", targetIndex);
      const targetMoveHash = await contract.getPlayerMove(sessionId, targetWallet);
      const targetGameMove = await contract.getPlayerGameMove(sessionId, targetWallet);
      
      console.log("Move hash:", targetMoveHash);
      console.log("Has submitted move:", targetMoveHash !== "0x0000000000000000000000000000000000000000000000000000000000000000");
      console.log("Game move data:", {
        move: targetGameMove.move.toString(),
        nonce: targetGameMove.nonce.toString(),
        revealed: targetGameMove.revealed
      });
      
      if (targetGameMove.revealed) {
        console.log("✅ This wallet HAS revealed their move");
      } else {
        console.log("❌ This wallet has NOT revealed their move yet");
        console.log("⚠️ They committed a move but failed to reveal it");
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