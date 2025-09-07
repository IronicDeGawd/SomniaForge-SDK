// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./GameSession.sol";
import "./PlayerRegistry.sol";
import "./Leaderboard.sol";

contract MultiplayerGame is GameSession {
    enum GameType {
        RockPaperScissors,
        ReactionTime,
        NumberGuess,
        MemoryMatch,
        QuickMath
    }
    
    struct GameRound {
        uint32 roundNumber;
        uint32 timeLimit;
        uint64 startTime;
        uint64 endTime;
        bool isComplete;
        bytes32 correctAnswer;
        mapping(address => uint256) playerResponses;
        mapping(address => uint64) responseTimes;
        address[] respondedPlayers;
        address winner;
    }
    
    struct ExtendedSession {
        GameType gameType;
        uint32 totalRounds;
        uint32 currentRound;
        uint32 roundTimeLimit;
        bool isRoundBased;
        mapping(uint32 => GameRound) rounds;
        mapping(address => uint32) playerWins;
        mapping(address => uint256) playerTotalScore;
        mapping(address => uint64) averageResponseTime;
    }
    
    PlayerRegistry public playerRegistry;
    Leaderboard public leaderboard;
    
    mapping(uint128 => ExtendedSession) public extendedSessions;
    mapping(GameType => string) public gameTypeNames;
    
    // Game-specific constants
    uint256 private constant ROCK = 1;
    uint256 private constant PAPER = 2;
    uint256 private constant SCISSORS = 3;
    
    event GameTypeSet(uint128 indexed sessionId, GameType gameType, uint32 totalRounds);
    event RoundStarted(uint128 indexed sessionId, uint32 roundNumber, uint64 startTime, uint32 timeLimit);
    event RoundResponse(uint128 indexed sessionId, uint32 roundNumber, address indexed player, uint64 responseTime);
    event RoundCompleted(uint128 indexed sessionId, uint32 roundNumber, address winner, bytes32 correctAnswer);
    event GameCompleted(uint128 indexed sessionId, address winner, uint256 totalScore);
    event ScoreUpdated(uint128 indexed sessionId, address indexed player, uint256 newScore);
    
    constructor(address _playerRegistry, address _leaderboard) {
        playerRegistry = PlayerRegistry(_playerRegistry);
        leaderboard = Leaderboard(_leaderboard);
        
        _initializeGameTypeNames();
    }
    
    function _initializeGameTypeNames() internal {
        gameTypeNames[GameType.RockPaperScissors] = "Rock Paper Scissors";
        gameTypeNames[GameType.ReactionTime] = "Reaction Time";
        gameTypeNames[GameType.NumberGuess] = "Number Guessing";
        gameTypeNames[GameType.MemoryMatch] = "Memory Match";
        gameTypeNames[GameType.QuickMath] = "Quick Math";
    }
    
    function createMultiplayerGame(
        uint32 maxPlayers,
        uint256 entryFee,
        uint32 moveTimeLimit,
        GameType gameType,
        uint32 totalRounds,
        uint32 roundTimeLimit
    ) external payable returns (uint128) {
        require(totalRounds >= 1 && totalRounds <= 10, "Invalid round count");
        require(roundTimeLimit >= 5 && roundTimeLimit <= 300, "Invalid round time limit");
        
        uint128 sessionId = this.createSession{value: msg.value}(maxPlayers, entryFee, moveTimeLimit);
        
        ExtendedSession storage extSession = extendedSessions[sessionId];
        extSession.gameType = gameType;
        extSession.totalRounds = totalRounds;
        extSession.currentRound = 0;
        extSession.roundTimeLimit = roundTimeLimit;
        extSession.isRoundBased = true;
        
        emit GameTypeSet(sessionId, gameType, totalRounds);
        
        return sessionId;
    }
    
    function startNextRound(uint128 sessionId) external onlyRole(GAME_ROLE) {
        Session storage session = sessions[sessionId];
        ExtendedSession storage extSession = extendedSessions[sessionId];
        
        require(session.isActive && !session.isComplete, "Session not active");
        require(extSession.currentRound < extSession.totalRounds, "All rounds completed");
        
        extSession.currentRound++;
        GameRound storage round = extSession.rounds[extSession.currentRound];
        
        round.roundNumber = extSession.currentRound;
        round.timeLimit = extSession.roundTimeLimit;
        round.startTime = uint64(block.timestamp);
        round.endTime = uint64(block.timestamp) + extSession.roundTimeLimit;
        round.isComplete = false;
        
        // Generate round-specific challenge based on game type
        round.correctAnswer = _generateRoundChallenge(sessionId, extSession.gameType);
        
        emit RoundStarted(sessionId, extSession.currentRound, round.startTime, round.timeLimit);
    }
    
    function submitRoundResponse(
        uint128 sessionId,
        uint32 roundNumber,
        uint256 response
    ) external nonReentrant {
        Session storage session = sessions[sessionId];
        ExtendedSession storage extSession = extendedSessions[sessionId];
        GameRound storage round = extSession.rounds[roundNumber];
        
        require(session.isActive && !session.isComplete, "Session not active");
        require(sessionPlayers[sessionId][msg.sender].isActive, "Player not active");
        require(roundNumber == extSession.currentRound, "Invalid round number");
        require(!round.isComplete, "Round already completed");
        require(block.timestamp <= round.endTime, "Round time expired");
        require(round.playerResponses[msg.sender] == 0, "Response already submitted");
        
        uint64 responseTime = uint64(block.timestamp) - round.startTime;
        
        round.playerResponses[msg.sender] = response;
        round.responseTimes[msg.sender] = responseTime;
        round.respondedPlayers.push(msg.sender);
        
        emit RoundResponse(sessionId, roundNumber, msg.sender, responseTime);
        
        // Check if all active players have responded
        if (_allPlayersResponded(sessionId, roundNumber)) {
            _completeRound(sessionId, roundNumber);
        }
    }
    
    function _allPlayersResponded(uint128 sessionId, uint32 roundNumber) internal view returns (bool) {
        address[] memory players = sessionPlayerList[sessionId];
        GameRound storage round = extendedSessions[sessionId].rounds[roundNumber];
        
        uint256 activePlayerCount = 0;
        for (uint256 i = 0; i < players.length; i++) {
            if (sessionPlayers[sessionId][players[i]].isActive) {
                activePlayerCount++;
            }
        }
        
        return round.respondedPlayers.length == activePlayerCount;
    }
    
    function _completeRound(uint128 sessionId, uint32 roundNumber) internal {
        ExtendedSession storage extSession = extendedSessions[sessionId];
        GameRound storage round = extSession.rounds[roundNumber];
        
        round.isComplete = true;
        
        // Determine round winner based on game type
        address roundWinner = _determineRoundWinner(sessionId, roundNumber);
        round.winner = roundWinner;
        
        if (roundWinner != address(0)) {
            extSession.playerWins[roundWinner]++;
            
            // Update scores based on game type and performance
            _updatePlayerScores(sessionId, roundNumber);
        }
        
        emit RoundCompleted(sessionId, roundNumber, roundWinner, round.correctAnswer);
        
        // Check if game is complete
        if (extSession.currentRound >= extSession.totalRounds) {
            _completeMultiplayerGame(sessionId);
        }
    }
    
    function _determineRoundWinner(uint128 sessionId, uint32 roundNumber) internal view returns (address) {
        ExtendedSession storage extSession = extendedSessions[sessionId];
        GameRound storage round = extSession.rounds[roundNumber];
        
        if (extSession.gameType == GameType.RockPaperScissors) {
            return _determineRPSWinner(sessionId, roundNumber);
        } else if (extSession.gameType == GameType.ReactionTime) {
            return _determineFastestPlayer(sessionId, roundNumber);
        } else if (extSession.gameType == GameType.NumberGuess || 
                   extSession.gameType == GameType.MemoryMatch || 
                   extSession.gameType == GameType.QuickMath) {
            return _determineCorrectAnswer(sessionId, roundNumber);
        }
        
        return address(0);
    }
    
    function _determineRPSWinner(uint128 sessionId, uint32 roundNumber) internal view returns (address) {
        GameRound storage round = extendedSessions[sessionId].rounds[roundNumber];
        
        if (round.respondedPlayers.length != 2) return address(0);
        
        address player1 = round.respondedPlayers[0];
        address player2 = round.respondedPlayers[1];
        
        uint256 move1 = round.playerResponses[player1];
        uint256 move2 = round.playerResponses[player2];
        
        if (move1 == move2) return address(0); // Tie
        
        if ((move1 == ROCK && move2 == SCISSORS) ||
            (move1 == PAPER && move2 == ROCK) ||
            (move1 == SCISSORS && move2 == PAPER)) {
            return player1;
        }
        
        return player2;
    }
    
    function _determineFastestPlayer(uint128 sessionId, uint32 roundNumber) internal view returns (address) {
        GameRound storage round = extendedSessions[sessionId].rounds[roundNumber];
        
        if (round.respondedPlayers.length == 0) return address(0);
        
        address fastestPlayer = round.respondedPlayers[0];
        uint64 fastestTime = round.responseTimes[fastestPlayer];
        
        for (uint256 i = 1; i < round.respondedPlayers.length; i++) {
            address player = round.respondedPlayers[i];
            if (round.responseTimes[player] < fastestTime) {
                fastestTime = round.responseTimes[player];
                fastestPlayer = player;
            }
        }
        
        return fastestPlayer;
    }
    
    function _determineCorrectAnswer(uint128 sessionId, uint32 roundNumber) internal view returns (address) {
        GameRound storage round = extendedSessions[sessionId].rounds[roundNumber];
        uint256 correctAnswer = uint256(round.correctAnswer);
        
        address winner = address(0);
        uint64 bestTime = type(uint64).max;
        
        for (uint256 i = 0; i < round.respondedPlayers.length; i++) {
            address player = round.respondedPlayers[i];
            
            if (round.playerResponses[player] == correctAnswer) {
                if (round.responseTimes[player] < bestTime) {
                    bestTime = round.responseTimes[player];
                    winner = player;
                }
            }
        }
        
        return winner;
    }
    
    function _updatePlayerScores(uint128 sessionId, uint32 roundNumber) internal {
        ExtendedSession storage extSession = extendedSessions[sessionId];
        GameRound storage round = extSession.rounds[roundNumber];
        
        for (uint256 i = 0; i < round.respondedPlayers.length; i++) {
            address player = round.respondedPlayers[i];
            uint256 score = 0;
            
            if (player == round.winner) {
                score = 1000; // Base score for winning
                
                // Bonus for speed
                if (round.responseTimes[player] <= 5) {
                    score += 500; // Very fast response bonus
                } else if (round.responseTimes[player] <= 10) {
                    score += 250; // Fast response bonus
                }
            } else {
                score = 100; // Participation points
            }
            
            extSession.playerTotalScore[player] += score;
            
            // Update average response time
            uint32 totalResponses = 0;
            uint64 totalTime = 0;
            
            for (uint32 r = 1; r <= extSession.currentRound; r++) {
                if (extSession.rounds[r].responseTimes[player] > 0) {
                    totalTime += extSession.rounds[r].responseTimes[player];
                    totalResponses++;
                }
            }
            
            if (totalResponses > 0) {
                extSession.averageResponseTime[player] = totalTime / totalResponses;
            }
            
            emit ScoreUpdated(sessionId, player, extSession.playerTotalScore[player]);
        }
    }
    
    function _completeMultiplayerGame(uint128 sessionId) internal {
        ExtendedSession storage extSession = extendedSessions[sessionId];
        
        // Find overall winner
        address gameWinner = address(0);
        uint256 highestScore = 0;
        
        address[] memory players = sessionPlayerList[sessionId];
        for (uint256 i = 0; i < players.length; i++) {
            address player = players[i];
            uint256 playerScore = extSession.playerTotalScore[player];
            
            if (playerScore > highestScore) {
                highestScore = playerScore;
                gameWinner = player;
            }
            
            // Update PlayerRegistry stats
            if (playerRegistry.isRegistered(player)) {
                bool won = (player == gameWinner);
                uint256 earnings = won ? sessions[sessionId].prizePool : 0;
                uint256 gameTime = block.timestamp - sessions[sessionId].startedAt;
                
                playerRegistry.updateGameStats(player, won, earnings, sessions[sessionId].entryFee, gameTime);
                
                // Update specific game stats
                if (extSession.gameType == GameType.RockPaperScissors) {
                    playerRegistry.updateSpecificGameStats(player, "rock_paper_scissors");
                }
                
                // Submit score to leaderboard
                leaderboard.submitScore(0, player, playerScore); // Global leaderboard
            }
        }
        
        // Complete the base session
        sessions[sessionId].isComplete = true;
        
        // Distribute prizes
        if (gameWinner != address(0)) {
            playerBalances[gameWinner] += sessions[sessionId].prizePool;
        }
        
        emit GameCompleted(sessionId, gameWinner, highestScore);
    }
    
    function _generateRoundChallenge(uint128 sessionId, GameType gameType) internal view returns (bytes32) {
        // Generate pseudo-random challenges based on game type and round
        uint256 randomSeed = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            sessionId,
            extendedSessions[sessionId].currentRound
        )));
        
        if (gameType == GameType.NumberGuess) {
            // Generate number between 1-100
            return bytes32((randomSeed % 100) + 1);
        } else if (gameType == GameType.QuickMath) {
            // Generate simple math problem (result between 1-50)
            uint256 a = (randomSeed % 10) + 1;
            uint256 b = ((randomSeed >> 8) % 10) + 1;
            return bytes32(a + b);
        } else if (gameType == GameType.MemoryMatch) {
            // Generate pattern ID (1-20)
            return bytes32((randomSeed % 20) + 1);
        }
        
        return bytes32(randomSeed);
    }
    
    function forceCompleteRound(uint128 sessionId, uint32 roundNumber) external onlyRole(GAME_ROLE) {
        ExtendedSession storage extSession = extendedSessions[sessionId];
        GameRound storage round = extSession.rounds[roundNumber];
        
        require(round.roundNumber == roundNumber, "Round not found");
        require(!round.isComplete, "Round already completed");
        require(block.timestamp > round.endTime + 30, "Grace period not elapsed");
        
        _completeRound(sessionId, roundNumber);
    }
    
    // Override the base _determineWinner for compatibility
    function _determineWinner(uint128 sessionId) 
        internal 
        virtual 
        override 
        returns (address[] memory winners, uint256[] memory prizes) 
    {
        ExtendedSession storage extSession = extendedSessions[sessionId];
        
        if (!extSession.isRoundBased) {
            // Use base class logic for simple sessions
            return super._determineWinner(sessionId);
        }
        
        // For round-based games, find the player with most round wins
        address[] memory players = sessionPlayerList[sessionId];
        address winner = address(0);
        uint32 maxWins = 0;
        
        for (uint256 i = 0; i < players.length; i++) {
            address player = players[i];
            if (extSession.playerWins[player] > maxWins) {
                maxWins = extSession.playerWins[player];
                winner = player;
            }
        }
        
        winners = new address[](1);
        prizes = new uint256[](1);
        
        if (winner != address(0)) {
            winners[0] = winner;
            prizes[0] = sessions[sessionId].prizePool;
        }
    }
    
    // View functions
    function getGameInfo(uint128 sessionId) external view returns (
        GameType gameType,
        uint32 totalRounds,
        uint32 currentRound,
        uint32 roundTimeLimit
    ) {
        ExtendedSession storage extSession = extendedSessions[sessionId];
        return (
            extSession.gameType,
            extSession.totalRounds,
            extSession.currentRound,
            extSession.roundTimeLimit
        );
    }
    
    function getRoundInfo(uint128 sessionId, uint32 roundNumber) external view returns (
        uint64 startTime,
        uint64 endTime,
        bool isComplete,
        address winner,
        uint256 responseCount
    ) {
        GameRound storage round = extendedSessions[sessionId].rounds[roundNumber];
        return (
            round.startTime,
            round.endTime,
            round.isComplete,
            round.winner,
            round.respondedPlayers.length
        );
    }
    
    function getPlayerGameStats(uint128 sessionId, address player) external view returns (
        uint32 roundWins,
        uint256 totalScore,
        uint64 averageResponseTime
    ) {
        ExtendedSession storage extSession = extendedSessions[sessionId];
        return (
            extSession.playerWins[player],
            extSession.playerTotalScore[player],
            extSession.averageResponseTime[player]
        );
    }
    
    function getPlayerRoundResponse(uint128 sessionId, uint32 roundNumber, address player) 
        external 
        view 
        returns (uint256 response, uint64 responseTime) 
    {
        GameRound storage round = extendedSessions[sessionId].rounds[roundNumber];
        return (
            round.playerResponses[player],
            round.responseTimes[player]
        );
    }
    
}