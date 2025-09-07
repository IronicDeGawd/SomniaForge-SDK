// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IGameEconomy {
    function distributePrizes(address[] calldata winners, uint256[] calldata amounts) external;
    function burnTokens(address from, uint256 amount) external;
}

interface IPlayerRegistry {
    function updateTournamentWin(address player) external;
    function getUsername(address player) external view returns (string memory);
}

contract Leaderboard is AccessControl, ReentrancyGuard {
    bytes32 public constant GAME_ROLE = keccak256("GAME_ROLE");
    
    struct LeaderboardEntry {
        address player;
        uint256 score;
        uint64 lastUpdated;
        uint32 rank;
    }
    
    struct Tournament {
        uint256 tournamentId;
        string name;
        uint256 entryFee;
        uint256 prizePool;
        uint32 maxParticipants;
        uint32 currentParticipants;
        uint64 startTime;
        uint64 endTime;
        bool isActive;
        bool isComplete;
        bool prizeDistributed;
        address[] participants;
        mapping(address => bool) hasJoined;
        mapping(address => uint256) playerScores;
    }
    
    struct GlobalStats {
        uint256 totalTournaments;
        uint256 totalPrizesPaid;
        uint32 activePlayers;
        address topPlayer;
        uint256 highestScore;
    }
    
    mapping(uint256 => Tournament) public tournaments;
    mapping(address => LeaderboardEntry) public globalLeaderboard;
    mapping(uint256 => LeaderboardEntry[]) public tournamentLeaderboards;
    
    address[] public globalPlayerList;
    mapping(address => bool) public isInGlobalLeaderboard;
    
    uint256 private _tournamentCounter;
    GlobalStats public globalStats;
    
    IGameEconomy public gameEconomy;
    IPlayerRegistry public playerRegistry;
    
    event TournamentCreated(
        uint256 indexed tournamentId,
        string name,
        uint256 entryFee,
        uint32 maxParticipants,
        uint64 startTime,
        uint64 endTime
    );
    
    event PlayerJoinedTournament(
        uint256 indexed tournamentId,
        address indexed player,
        uint32 currentParticipants
    );
    
    event TournamentStarted(
        uint256 indexed tournamentId,
        uint64 startTime
    );
    
    event ScoreSubmitted(
        uint256 indexed tournamentId,
        address indexed player,
        uint256 score,
        uint32 newRank
    );
    
    event GlobalLeaderboardUpdated(
        address indexed player,
        uint256 newScore,
        uint32 newRank
    );
    
    event TournamentCompleted(
        uint256 indexed tournamentId,
        address[] winners,
        uint256[] prizes
    );
    
    event PrizesDistributed(
        uint256 indexed tournamentId,
        uint256 totalDistributed
    );
    
    constructor(address _gameEconomy, address _playerRegistry) {
        require(_gameEconomy != address(0), "Invalid GameEconomy address");
        require(_playerRegistry != address(0), "Invalid PlayerRegistry address");
        
        gameEconomy = IGameEconomy(_gameEconomy);
        playerRegistry = IPlayerRegistry(_playerRegistry);
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(GAME_ROLE, msg.sender);
    }
    
    function createTournament(
        string calldata name,
        uint256 entryFee,
        uint32 maxParticipants,
        uint64 duration
    ) external onlyRole(GAME_ROLE) returns (uint256) {
        require(maxParticipants >= 2 && maxParticipants <= 1000, "Invalid participant count");
        require(duration >= 300 && duration <= 604800, "Invalid duration"); // 5 min to 1 week
        
        uint256 tournamentId = ++_tournamentCounter;
        Tournament storage tournament = tournaments[tournamentId];
        
        tournament.tournamentId = tournamentId;
        tournament.name = name;
        tournament.entryFee = entryFee;
        tournament.prizePool = 0;
        tournament.maxParticipants = maxParticipants;
        tournament.currentParticipants = 0;
        tournament.startTime = uint64(block.timestamp);
        tournament.endTime = uint64(block.timestamp) + duration;
        tournament.isActive = true;
        tournament.isComplete = false;
        tournament.prizeDistributed = false;
        
        globalStats.totalTournaments++;
        
        emit TournamentCreated(
            tournamentId,
            name,
            entryFee,
            maxParticipants,
            tournament.startTime,
            tournament.endTime
        );
        
        return tournamentId;
    }
    
    function joinTournament(uint256 tournamentId) external payable nonReentrant {
        Tournament storage tournament = tournaments[tournamentId];
        
        require(tournament.tournamentId != 0, "Tournament not found");
        require(tournament.isActive && !tournament.isComplete, "Tournament not active");
        require(block.timestamp < tournament.endTime, "Tournament ended");
        require(!tournament.hasJoined[msg.sender], "Already joined");
        require(tournament.currentParticipants < tournament.maxParticipants, "Tournament full");
        require(msg.value >= tournament.entryFee, "Insufficient entry fee");
        
        tournament.hasJoined[msg.sender] = true;
        tournament.participants.push(msg.sender);
        tournament.currentParticipants++;
        tournament.prizePool += tournament.entryFee;
        tournament.playerScores[msg.sender] = 0;
        
        if (msg.value > tournament.entryFee) {
            // Refund excess payment
            (bool success, ) = payable(msg.sender).call{value: msg.value - tournament.entryFee}("");
            require(success, "Refund failed");
        }
        
        emit PlayerJoinedTournament(tournamentId, msg.sender, tournament.currentParticipants);
        
        if (tournament.currentParticipants == tournament.maxParticipants) {
            emit TournamentStarted(tournamentId, uint64(block.timestamp));
        }
    }
    
    function submitScore(
        uint256 tournamentId,
        address player,
        uint256 score
    ) external onlyRole(GAME_ROLE) {
        Tournament storage tournament = tournaments[tournamentId];
        
        require(tournament.tournamentId != 0, "Tournament not found");
        require(tournament.isActive && !tournament.isComplete, "Tournament not active");
        require(tournament.hasJoined[player], "Player not in tournament");
        require(block.timestamp <= tournament.endTime, "Tournament ended");
        
        // Update tournament score if higher
        if (score > tournament.playerScores[player]) {
            tournament.playerScores[player] = score;
        }
        
        // Update global leaderboard
        _updateGlobalLeaderboard(player, score);
        
        // Calculate tournament rank
        uint32 rank = _calculateTournamentRank(tournamentId, player);
        
        emit ScoreSubmitted(tournamentId, player, score, rank);
        
        // Auto-complete tournament if time expired
        if (block.timestamp > tournament.endTime) {
            _completeTournament(tournamentId);
        }
    }
    
    function completeTournament(uint256 tournamentId) external onlyRole(GAME_ROLE) {
        Tournament storage tournament = tournaments[tournamentId];
        require(tournament.isActive && !tournament.isComplete, "Invalid tournament state");
        require(block.timestamp >= tournament.endTime, "Tournament not ended");
        
        _completeTournament(tournamentId);
    }
    
    function _completeTournament(uint256 tournamentId) internal {
        Tournament storage tournament = tournaments[tournamentId];
        tournament.isComplete = true;
        tournament.isActive = false;
        
        // Create leaderboard for this tournament
        LeaderboardEntry[] storage leaderboard = tournamentLeaderboards[tournamentId];
        
        for (uint256 i = 0; i < tournament.participants.length; i++) {
            address player = tournament.participants[i];
            uint256 score = tournament.playerScores[player];
            
            leaderboard.push(LeaderboardEntry({
                player: player,
                score: score,
                lastUpdated: uint64(block.timestamp),
                rank: 0 // Will be calculated during sorting
            }));
        }
        
        // Sort leaderboard (bubble sort for simplicity, could be optimized)
        _sortLeaderboard(leaderboard);
        
        // Assign ranks
        for (uint256 i = 0; i < leaderboard.length; i++) {
            leaderboard[i].rank = uint32(i + 1);
        }
        
        // Determine winners and prizes
        (address[] memory winners, uint256[] memory prizes) = _calculatePrizes(tournamentId);
        
        emit TournamentCompleted(tournamentId, winners, prizes);
        
        // Mark first place as tournament winner in PlayerRegistry
        if (winners.length > 0) {
            playerRegistry.updateTournamentWin(winners[0]);
        }
    }
    
    function _calculatePrizes(uint256 tournamentId) internal view returns (
        address[] memory winners,
        uint256[] memory prizes
    ) {
        Tournament storage tournament = tournaments[tournamentId];
        LeaderboardEntry[] storage leaderboard = tournamentLeaderboards[tournamentId];
        
        uint256 participantCount = leaderboard.length;
        if (participantCount == 0) {
            return (new address[](0), new uint256[](0));
        }
        
        uint256 prizeCount = participantCount >= 10 ? 5 : participantCount >= 3 ? 3 : 1;
        
        winners = new address[](prizeCount);
        prizes = new uint256[](prizeCount);
        
        uint256 totalPrize = tournament.prizePool;
        
        if (prizeCount == 1) {
            // Winner takes all
            winners[0] = leaderboard[0].player;
            prizes[0] = totalPrize;
        } else if (prizeCount == 3) {
            // Top 3: 60%, 25%, 15%
            winners[0] = leaderboard[0].player;
            winners[1] = leaderboard[1].player;
            winners[2] = leaderboard[2].player;
            
            prizes[0] = (totalPrize * 60) / 100;
            prizes[1] = (totalPrize * 25) / 100;
            prizes[2] = (totalPrize * 15) / 100;
        } else if (prizeCount == 5) {
            // Top 5: 45%, 25%, 15%, 10%, 5%
            uint256[5] memory percentages = [uint256(45), 25, 15, 10, 5];
            
            for (uint256 i = 0; i < 5; i++) {
                winners[i] = leaderboard[i].player;
                prizes[i] = (totalPrize * percentages[i]) / 100;
            }
        }
    }
    
    function distributePrizes(uint256 tournamentId) external nonReentrant onlyRole(GAME_ROLE) {
        Tournament storage tournament = tournaments[tournamentId];
        require(tournament.isComplete && !tournament.prizeDistributed, "Invalid state");
        
        (address[] memory winners, uint256[] memory prizes) = _calculatePrizes(tournamentId);
        
        if (winners.length > 0) {
            // Convert STT prizes to GAME tokens for distribution
            uint256[] memory gameTokenPrizes = new uint256[](prizes.length);
            for (uint256 i = 0; i < prizes.length; i++) {
                gameTokenPrizes[i] = prizes[i] * 1000; // 1 STT = 1000 GAME tokens
            }
            
            gameEconomy.distributePrizes(winners, gameTokenPrizes);
            globalStats.totalPrizesPaid += tournament.prizePool;
        }
        
        tournament.prizeDistributed = true;
        
        emit PrizesDistributed(tournamentId, tournament.prizePool);
    }
    
    function _updateGlobalLeaderboard(address player, uint256 score) internal {
        LeaderboardEntry storage entry = globalLeaderboard[player];
        
        if (!isInGlobalLeaderboard[player]) {
            // New player
            entry.player = player;
            entry.score = score;
            entry.lastUpdated = uint64(block.timestamp);
            entry.rank = uint32(globalPlayerList.length + 1);
            
            globalPlayerList.push(player);
            isInGlobalLeaderboard[player] = true;
            globalStats.activePlayers++;
        } else if (score > entry.score) {
            // Update existing player's best score
            entry.score = score;
            entry.lastUpdated = uint64(block.timestamp);
        } else {
            // Score not improved, no update needed
            return;
        }
        
        // Update global high score
        if (score > globalStats.highestScore) {
            globalStats.highestScore = score;
            globalStats.topPlayer = player;
        }
        
        // Recalculate rank (simplified - in production, use more efficient sorting)
        uint32 newRank = 1;
        for (uint256 i = 0; i < globalPlayerList.length; i++) {
            address otherPlayer = globalPlayerList[i];
            if (otherPlayer != player && globalLeaderboard[otherPlayer].score > score) {
                newRank++;
            }
        }
        
        entry.rank = newRank;
        
        emit GlobalLeaderboardUpdated(player, score, newRank);
    }
    
    function _calculateTournamentRank(uint256 tournamentId, address player) internal view returns (uint32) {
        Tournament storage tournament = tournaments[tournamentId];
        uint256 playerScore = tournament.playerScores[player];
        uint32 rank = 1;
        
        for (uint256 i = 0; i < tournament.participants.length; i++) {
            address participant = tournament.participants[i];
            if (participant != player && tournament.playerScores[participant] > playerScore) {
                rank++;
            }
        }
        
        return rank;
    }
    
    function _sortLeaderboard(LeaderboardEntry[] storage leaderboard) internal {
        uint256 n = leaderboard.length;
        
        for (uint256 i = 0; i < n - 1; i++) {
            for (uint256 j = 0; j < n - i - 1; j++) {
                if (leaderboard[j].score < leaderboard[j + 1].score) {
                    // Swap
                    LeaderboardEntry memory temp = leaderboard[j];
                    leaderboard[j] = leaderboard[j + 1];
                    leaderboard[j + 1] = temp;
                }
            }
        }
    }
    
    function getTournamentInfo(uint256 tournamentId) external view returns (
        string memory name,
        uint256 entryFee,
        uint256 prizePool,
        uint32 maxParticipants,
        uint32 currentParticipants,
        uint64 startTime,
        uint64 endTime,
        bool isActive,
        bool isComplete
    ) {
        Tournament storage tournament = tournaments[tournamentId];
        return (
            tournament.name,
            tournament.entryFee,
            tournament.prizePool,
            tournament.maxParticipants,
            tournament.currentParticipants,
            tournament.startTime,
            tournament.endTime,
            tournament.isActive,
            tournament.isComplete
        );
    }
    
    function getTournamentLeaderboard(uint256 tournamentId) external view returns (
        address[] memory players,
        string[] memory usernames,
        uint256[] memory scores,
        uint32[] memory ranks
    ) {
        LeaderboardEntry[] storage leaderboard = tournamentLeaderboards[tournamentId];
        
        players = new address[](leaderboard.length);
        usernames = new string[](leaderboard.length);
        scores = new uint256[](leaderboard.length);
        ranks = new uint32[](leaderboard.length);
        
        for (uint256 i = 0; i < leaderboard.length; i++) {
            players[i] = leaderboard[i].player;
            usernames[i] = playerRegistry.getUsername(leaderboard[i].player);
            scores[i] = leaderboard[i].score;
            ranks[i] = leaderboard[i].rank;
        }
    }
    
    function getGlobalLeaderboard(uint256 offset, uint256 limit) external view returns (
        address[] memory players,
        string[] memory usernames,
        uint256[] memory scores,
        uint32[] memory ranks
    ) {
        uint256 totalPlayers = globalPlayerList.length;
        uint256 end = offset + limit;
        if (end > totalPlayers) end = totalPlayers;
        
        uint256 resultLength = end - offset;
        players = new address[](resultLength);
        usernames = new string[](resultLength);
        scores = new uint256[](resultLength);
        ranks = new uint32[](resultLength);
        
        // Create a sorted array of all players (simplified implementation)
        address[] memory sortedPlayers = new address[](totalPlayers);
        for (uint256 i = 0; i < totalPlayers; i++) {
            sortedPlayers[i] = globalPlayerList[i];
        }
        
        // Sort by score (bubble sort - should be optimized for production)
        for (uint256 i = 0; i < totalPlayers - 1; i++) {
            for (uint256 j = 0; j < totalPlayers - i - 1; j++) {
                if (globalLeaderboard[sortedPlayers[j]].score < globalLeaderboard[sortedPlayers[j + 1]].score) {
                    address temp = sortedPlayers[j];
                    sortedPlayers[j] = sortedPlayers[j + 1];
                    sortedPlayers[j + 1] = temp;
                }
            }
        }
        
        // Return the requested slice
        for (uint256 i = 0; i < resultLength; i++) {
            address player = sortedPlayers[offset + i];
            players[i] = player;
            usernames[i] = playerRegistry.getUsername(player);
            scores[i] = globalLeaderboard[player].score;
            ranks[i] = uint32(offset + i + 1);
        }
    }
    
    function getPlayerTournamentScore(uint256 tournamentId, address player) external view returns (uint256) {
        return tournaments[tournamentId].playerScores[player];
    }
    
    function getActiveTournaments() external view returns (uint256[] memory) {
        uint256 count = 0;
        
        // Count active tournaments
        for (uint256 i = 1; i <= _tournamentCounter; i++) {
            if (tournaments[i].isActive && !tournaments[i].isComplete && 
                block.timestamp <= tournaments[i].endTime) {
                count++;
            }
        }
        
        uint256[] memory activeTournaments = new uint256[](count);
        uint256 index = 0;
        
        for (uint256 i = 1; i <= _tournamentCounter; i++) {
            if (tournaments[i].isActive && !tournaments[i].isComplete && 
                block.timestamp <= tournaments[i].endTime) {
                activeTournaments[index] = i;
                index++;
            }
        }
        
        return activeTournaments;
    }
    
    function getCurrentTournamentId() external view returns (uint256) {
        return _tournamentCounter;
    }
    
    function updateContractAddresses(
        address _gameEconomy,
        address _playerRegistry
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_gameEconomy != address(0), "Invalid GameEconomy address");
        require(_playerRegistry != address(0), "Invalid PlayerRegistry address");
        
        gameEconomy = IGameEconomy(_gameEconomy);
        playerRegistry = IPlayerRegistry(_playerRegistry);
    }
}