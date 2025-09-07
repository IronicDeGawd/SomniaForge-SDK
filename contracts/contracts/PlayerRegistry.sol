// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract PlayerRegistry is AccessControl, ReentrancyGuard {
    bytes32 public constant GAME_ROLE = keccak256("GAME_ROLE");
    
    struct PlayerProfile {
        string username;
        uint64 registrationTime;
        uint32 totalGames;
        uint32 gamesWon;
        uint32 gamesLost;
        uint32 currentWinStreak;
        uint32 bestWinStreak;
        uint256 totalEarnings;
        uint256 totalSpent;
        bool isActive;
        uint8 level;
        uint256 experience;
    }
    
    struct PlayerStats {
        uint256 fastestWin;
        uint256 averageGameTime;
        uint32 rockPaperScissorsWins;
        uint32 tournamentWins;
        uint32 achievementsUnlocked;
        mapping(string => bool) achievements;
    }
    
    struct Achievement {
        string name;
        string description;
        uint256 reward;
        bool isActive;
    }
    
    mapping(address => PlayerProfile) public players;
    mapping(address => PlayerStats) private playerStats;
    mapping(string => bool) private usernameExists;
    mapping(address => bool) public isRegistered;
    
    mapping(string => Achievement) public achievements;
    string[] public achievementList;
    
    address[] public registeredPlayers;
    uint256 public totalPlayers;
    
    event PlayerRegistered(
        address indexed player,
        string username,
        uint64 registrationTime
    );
    
    event StatsUpdated(
        address indexed player,
        uint32 totalGames,
        uint32 gamesWon,
        uint256 totalEarnings
    );
    
    event AchievementUnlocked(
        address indexed player,
        string achievementName,
        uint256 reward
    );
    
    event LevelUp(
        address indexed player,
        uint8 newLevel,
        uint256 experience
    );
    
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(GAME_ROLE, msg.sender);
        
        _initializeAchievements();
    }
    
    function registerPlayer(string calldata username) external {
        require(bytes(username).length >= 3 && bytes(username).length <= 20, "Invalid username length");
        require(!isRegistered[msg.sender], "Already registered");
        require(!usernameExists[username], "Username taken");
        require(_isValidUsername(username), "Invalid username format");
        
        players[msg.sender] = PlayerProfile({
            username: username,
            registrationTime: uint64(block.timestamp),
            totalGames: 0,
            gamesWon: 0,
            gamesLost: 0,
            currentWinStreak: 0,
            bestWinStreak: 0,
            totalEarnings: 0,
            totalSpent: 0,
            isActive: true,
            level: 1,
            experience: 0
        });
        
        isRegistered[msg.sender] = true;
        usernameExists[username] = true;
        registeredPlayers.push(msg.sender);
        totalPlayers++;
        
        emit PlayerRegistered(msg.sender, username, uint64(block.timestamp));
        
        _checkAndUnlockAchievement(msg.sender, "first_registration");
    }
    
    function updateGameStats(
        address player,
        bool won,
        uint256 earnings,
        uint256 spent,
        uint256 gameTime
    ) external onlyRole(GAME_ROLE) {
        require(isRegistered[player], "Player not registered");
        
        PlayerProfile storage profile = players[player];
        PlayerStats storage stats = playerStats[player];
        
        profile.totalGames++;
        profile.totalEarnings += earnings;
        profile.totalSpent += spent;
        
        if (won) {
            profile.gamesWon++;
            profile.currentWinStreak++;
            profile.experience += 100;
            
            if (profile.currentWinStreak > profile.bestWinStreak) {
                profile.bestWinStreak = profile.currentWinStreak;
            }
            
            if (stats.fastestWin == 0 || gameTime < stats.fastestWin) {
                stats.fastestWin = gameTime;
            }
        } else {
            profile.gamesLost++;
            profile.currentWinStreak = 0;
            profile.experience += 25;
        }
        
        stats.averageGameTime = (stats.averageGameTime * (profile.totalGames - 1) + gameTime) / profile.totalGames;
        
        _updateLevel(player);
        _checkMultipleAchievements(player);
        
        emit StatsUpdated(player, profile.totalGames, profile.gamesWon, profile.totalEarnings);
    }
    
    function updateSpecificGameStats(
        address player,
        string calldata gameType
    ) external onlyRole(GAME_ROLE) {
        require(isRegistered[player], "Player not registered");
        
        PlayerStats storage stats = playerStats[player];
        
        if (keccak256(bytes(gameType)) == keccak256(bytes("rock_paper_scissors"))) {
            stats.rockPaperScissorsWins++;
            _checkAndUnlockAchievement(player, "rps_master");
        }
    }
    
    function _updateLevel(address player) internal {
        PlayerProfile storage profile = players[player];
        uint8 newLevel = uint8(profile.experience / 1000) + 1;
        
        if (newLevel > profile.level) {
            profile.level = newLevel;
            emit LevelUp(player, newLevel, profile.experience);
            
            if (newLevel == 5) {
                _checkAndUnlockAchievement(player, "level_5");
            } else if (newLevel == 10) {
                _checkAndUnlockAchievement(player, "level_10");
            }
        }
    }
    
    function _checkMultipleAchievements(address player) internal {
        PlayerProfile memory profile = players[player];
        PlayerStats storage stats = playerStats[player];
        
        if (profile.totalGames == 1) {
            _checkAndUnlockAchievement(player, "first_game");
        } else if (profile.totalGames == 10) {
            _checkAndUnlockAchievement(player, "veteran_player");
        } else if (profile.totalGames == 100) {
            _checkAndUnlockAchievement(player, "century_club");
        }
        
        if (profile.gamesWon == 1) {
            _checkAndUnlockAchievement(player, "first_victory");
        } else if (profile.gamesWon == 10) {
            _checkAndUnlockAchievement(player, "winning_streak");
        } else if (profile.gamesWon == 50) {
            _checkAndUnlockAchievement(player, "champion");
        }
        
        if (profile.bestWinStreak >= 5) {
            _checkAndUnlockAchievement(player, "streak_master");
        } else if (profile.bestWinStreak >= 10) {
            _checkAndUnlockAchievement(player, "unstoppable");
        }
        
        if (profile.totalEarnings >= 1 ether) {
            _checkAndUnlockAchievement(player, "high_earner");
        } else if (profile.totalEarnings >= 10 ether) {
            _checkAndUnlockAchievement(player, "whale");
        }
        
        if (stats.rockPaperScissorsWins >= 20) {
            _checkAndUnlockAchievement(player, "rps_legend");
        }
    }
    
    function _checkAndUnlockAchievement(address player, string memory achievementKey) internal {
        PlayerStats storage stats = playerStats[player];
        
        if (!stats.achievements[achievementKey] && achievements[achievementKey].isActive) {
            stats.achievements[achievementKey] = true;
            stats.achievementsUnlocked++;
            
            Achievement memory achievement = achievements[achievementKey];
            
            if (achievement.reward > 0) {
                players[player].totalEarnings += achievement.reward;
            }
            
            emit AchievementUnlocked(player, achievement.name, achievement.reward);
        }
    }
    
    function _initializeAchievements() internal {
        _addAchievement("first_registration", "Welcome!", "Register your first account", 0.01 ether);
        _addAchievement("first_game", "First Steps", "Play your first game", 0.005 ether);
        _addAchievement("first_victory", "Taste of Victory", "Win your first game", 0.02 ether);
        _addAchievement("veteran_player", "Getting Serious", "Play 10 games", 0.05 ether);
        _addAchievement("century_club", "Dedication", "Play 100 games", 0.2 ether);
        _addAchievement("winning_streak", "On a Roll", "Win 10 games", 0.1 ether);
        _addAchievement("champion", "True Champion", "Win 50 games", 0.5 ether);
        _addAchievement("streak_master", "Streak Master", "Achieve a 5-game win streak", 0.08 ether);
        _addAchievement("unstoppable", "Unstoppable Force", "Achieve a 10-game win streak", 0.25 ether);
        _addAchievement("high_earner", "Money Maker", "Earn 1 ETH total", 0.1 ether);
        _addAchievement("whale", "High Roller", "Earn 10 ETH total", 1 ether);
        _addAchievement("level_5", "Rising Star", "Reach level 5", 0.05 ether);
        _addAchievement("level_10", "Elite Player", "Reach level 10", 0.15 ether);
        _addAchievement("rps_master", "Rock Paper Scissors Pro", "Win 5 RPS games", 0.03 ether);
        _addAchievement("rps_legend", "RPS Legend", "Win 20 RPS games", 0.15 ether);
    }
    
    function _addAchievement(
        string memory key,
        string memory name,
        string memory description,
        uint256 reward
    ) internal {
        achievements[key] = Achievement({
            name: name,
            description: description,
            reward: reward,
            isActive: true
        });
        achievementList.push(key);
    }
    
    function _isValidUsername(string calldata username) internal pure returns (bool) {
        bytes memory usernameBytes = bytes(username);
        
        for (uint256 i = 0; i < usernameBytes.length; i++) {
            bytes1 char = usernameBytes[i];
            
            if (!(char >= 0x30 && char <= 0x39) && // 0-9
                !(char >= 0x41 && char <= 0x5A) && // A-Z
                !(char >= 0x61 && char <= 0x7A) && // a-z
                char != 0x5F) {                     // _
                return false;
            }
        }
        
        return true;
    }
    
    function getPlayerProfile(address player) external view returns (PlayerProfile memory) {
        require(isRegistered[player], "Player not registered");
        return players[player];
    }
    
    function getPlayerStats(address player) external view returns (
        uint256 fastestWin,
        uint256 averageGameTime,
        uint32 rockPaperScissorsWins,
        uint32 tournamentWins,
        uint32 achievementsUnlocked
    ) {
        require(isRegistered[player], "Player not registered");
        PlayerStats storage stats = playerStats[player];
        
        return (
            stats.fastestWin,
            stats.averageGameTime,
            stats.rockPaperScissorsWins,
            stats.tournamentWins,
            stats.achievementsUnlocked
        );
    }
    
    function hasAchievement(address player, string calldata achievementKey) external view returns (bool) {
        return playerStats[player].achievements[achievementKey];
    }
    
    function getUsername(address player) external view returns (string memory) {
        require(isRegistered[player], "Player not registered");
        return players[player].username;
    }
    
    function getWinRate(address player) external view returns (uint256) {
        require(isRegistered[player], "Player not registered");
        PlayerProfile memory profile = players[player];
        
        if (profile.totalGames == 0) return 0;
        return (profile.gamesWon * 10000) / profile.totalGames; // Return as basis points
    }
    
    function getLeaderboardData(uint256 offset, uint256 limit) external view returns (
        address[] memory playerAddresses,
        string[] memory usernames,
        uint32[] memory totalWins,
        uint256[] memory totalEarnings
    ) {
        uint256 end = offset + limit;
        if (end > totalPlayers) end = totalPlayers;
        
        uint256 resultLength = end - offset;
        playerAddresses = new address[](resultLength);
        usernames = new string[](resultLength);
        totalWins = new uint32[](resultLength);
        totalEarnings = new uint256[](resultLength);
        
        for (uint256 i = 0; i < resultLength; i++) {
            address player = registeredPlayers[offset + i];
            PlayerProfile memory profile = players[player];
            
            playerAddresses[i] = player;
            usernames[i] = profile.username;
            totalWins[i] = profile.gamesWon;
            totalEarnings[i] = profile.totalEarnings;
        }
    }
    
    function getAllAchievements() external view returns (string[] memory keys, string[] memory names, string[] memory descriptions) {
        keys = new string[](achievementList.length);
        names = new string[](achievementList.length);
        descriptions = new string[](achievementList.length);
        
        for (uint256 i = 0; i < achievementList.length; i++) {
            string memory key = achievementList[i];
            Achievement memory achievement = achievements[key];
            
            keys[i] = key;
            names[i] = achievement.name;
            descriptions[i] = achievement.description;
        }
    }
    
    function updateTournamentWin(address player) external onlyRole(GAME_ROLE) {
        require(isRegistered[player], "Player not registered");
        playerStats[player].tournamentWins++;
    }
}