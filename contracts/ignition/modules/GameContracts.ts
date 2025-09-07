import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const GameContractsModule = buildModule("GameContractsModule", (m) => {
  // Deploy contracts in correct dependency order
  
  // 1. Deploy PlayerRegistry first (no dependencies)
  const playerRegistry = m.contract("PlayerRegistry");
  
  // 2. Deploy GameEconomy with treasury and developer fund addresses
  const treasury = m.getParameter("treasury", "0xFa559D88Ffc5146f6744f7B8D466D64eafA7D2b1"); // Use deployer as treasury
  const developerFund = m.getParameter("developerFund", "0xFa559D88Ffc5146f6744f7B8D466D64eafA7D2b1"); // Use deployer as dev fund
  
  const gameEconomy = m.contract("GameEconomy", [treasury, developerFund]);
  
  // 3. Deploy Leaderboard (depends on GameEconomy and PlayerRegistry)
  const leaderboard = m.contract("Leaderboard", [gameEconomy, playerRegistry]);
  
  // 4. Deploy GameSession (no dependencies)
  const gameSession = m.contract("GameSession");
  
  // 5. Deploy MultiplayerGame (depends on PlayerRegistry and Leaderboard)
  const multiplayerGame = m.contract("MultiplayerGame", [playerRegistry, leaderboard]);
  
  // Configure roles and permissions after deployment
  
  // Grant GAME_ROLE to MultiplayerGame on PlayerRegistry
  m.call(playerRegistry, "grantRole", [
    "0x851f8d8e1c01eae8e8c0b4f8e4e5c8d2c1e2d1f4c5a6b7e8f9d0e1f2a3b4c5d6", // GAME_ROLE hash
    multiplayerGame
  ], { id: "PlayerRegistry_GrantGameRole" });
  
  // Grant MINTER_ROLE to GameSession on GameEconomy
  m.call(gameEconomy, "grantRole", [
    "0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6", // MINTER_ROLE hash
    gameSession
  ], { id: "GameEconomy_GrantMinterRole" });
  
  // Grant GAME_ROLE to MultiplayerGame on GameEconomy
  m.call(gameEconomy, "grantRole", [
    "0x851f8d8e1c01eae8e8c0b4f8e4e5c8d2c1e2d1f4c5a6b7e8f9d0e1f2a3b4c5d6", // GAME_ROLE hash
    multiplayerGame
  ], { id: "GameEconomy_GrantGameRole" });
  
  // Grant GAME_ROLE to MultiplayerGame on GameSession
  m.call(gameSession, "grantRole", [
    "0x851f8d8e1c01eae8e8c0b4f8e4e5c8d2c1e2d1f4c5a6b7e8f9d0e1f2a3b4c5d6", // GAME_ROLE hash
    multiplayerGame
  ], { id: "GameSession_GrantGameRole" });
  
  // Grant GAME_ROLE to MultiplayerGame on Leaderboard
  m.call(leaderboard, "grantRole", [
    "0x851f8d8e1c01eae8e8c0b4f8e4e5c8d2c1e2d1f4c5a6b7e8f9d0e1f2a3b4c5d6", // GAME_ROLE hash
    multiplayerGame
  ], { id: "Leaderboard_GrantGameRole" });
  
  return {
    playerRegistry,
    gameEconomy,
    leaderboard,
    gameSession,
    multiplayerGame,
  };
});

export default GameContractsModule;