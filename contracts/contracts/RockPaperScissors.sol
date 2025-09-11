// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./GameSession.sol";

contract RockPaperScissors is GameSession {
    enum Move { None, Rock, Paper, Scissors }
    
    struct GameMove {
        Move move;
        uint256 nonce;
        bool revealed;
    }
    
    struct GameResult {
        address winner;
        address[] players;
        Move[] moves;
        uint256 prizeAmount;
        bool isDraw;
        uint64 completedAt;
    }
    
    mapping(uint128 => mapping(address => GameMove)) public gameMoves;
    mapping(uint128 => GameResult) public gameResults;
    mapping(uint128 => uint256) public revealDeadlines;
    mapping(uint128 => uint256) public revealsCount;
    
    uint256 public constant REVEAL_PHASE_DURATION = 300; // 5 minutes
    
    event MoveCommitted(uint128 indexed sessionId, address indexed player, bytes32 moveHash);
    event MoveRevealed(uint128 indexed sessionId, address indexed player, Move move);
    event GameResultDetermined(uint128 indexed sessionId, address indexed winner, bool isDraw, uint256 prizeAmount);
    event RevealPhaseStarted(uint128 indexed sessionId, uint256 deadline);
    
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }
    
    function createRPSGame(uint256 entryFee) external payable returns (uint128) {
        require(msg.value >= entryFee, "Insufficient entry fee");
        require(entryFee > 0, "Entry fee must be greater than 0");
        
        uint128 sessionId = ++_sessionCounter;
        
        sessions[sessionId] = Session({
            sessionId: sessionId,
            playerCount: 1,
            maxPlayers: 2,
            moveTimeLimit: 600, // 10 minutes
            createdAt: uint64(block.timestamp),
            startedAt: 0,
            isActive: false,
            isComplete: false,
            entryFee: entryFee,
            prizePool: entryFee,
            creator: msg.sender
        });
        
        sessionPlayers[sessionId][msg.sender] = Player({
            wallet: msg.sender,
            moveHash: bytes32(0),
            joinedAt: uint32(block.timestamp),
            moveSubmittedAt: 0,
            hasSubmittedMove: false,
            isActive: true
        });
        
        sessionPlayerList[sessionId].push(msg.sender);
        
        if (msg.value > entryFee) {
            playerBalances[msg.sender] += msg.value - entryFee;
        }
        
        emit SessionCreated(sessionId, msg.sender, 2, entryFee, 600);
        emit PlayerJoined(sessionId, msg.sender, 1);
        
        return sessionId;
    }
    
    function joinRPSGame(uint128 sessionId) external payable {
        Session storage session = sessions[sessionId];
        require(session.sessionId != 0, "Session not found");
        require(!session.isActive, "Session already started");
        require(!session.isComplete, "Session completed");
        require(session.playerCount < session.maxPlayers, "Session full");
        require(sessionPlayers[sessionId][msg.sender].wallet == address(0), "Already joined");
        require(msg.value >= session.entryFee, "Insufficient entry fee");
        
        session.playerCount++;
        session.prizePool += session.entryFee;
        
        sessionPlayers[sessionId][msg.sender] = Player({
            wallet: msg.sender,
            moveHash: bytes32(0),
            joinedAt: uint32(block.timestamp),
            moveSubmittedAt: 0,
            hasSubmittedMove: false,
            isActive: true
        });
        
        sessionPlayerList[sessionId].push(msg.sender);
        
        if (msg.value > session.entryFee) {
            playerBalances[msg.sender] += msg.value - session.entryFee;
        }
        
        emit PlayerJoined(sessionId, msg.sender, session.playerCount);
        
        // Auto-start when both players joined
        if (session.playerCount == session.maxPlayers) {
            session.isActive = true;
            session.startedAt = uint64(block.timestamp);
            emit SessionStarted(sessionId, uint64(block.timestamp));
        }
    }
    
    function commitMove(uint128 sessionId, bytes32 moveHash) external {
        require(sessions[sessionId].isActive && !sessions[sessionId].isComplete, "Session not active");
        require(sessionPlayers[sessionId][msg.sender].isActive, "Player not in session");
        require(!sessionPlayers[sessionId][msg.sender].hasSubmittedMove, "Move already submitted");
        require(sessionPlayerList[sessionId].length == 2, "Waiting for players");
        
        sessionPlayers[sessionId][msg.sender].moveHash = moveHash;
        sessionPlayers[sessionId][msg.sender].hasSubmittedMove = true;
        sessionPlayers[sessionId][msg.sender].moveSubmittedAt = uint32(block.timestamp);
        
        emit MoveCommitted(sessionId, msg.sender, moveHash);
        emit MoveSubmitted(sessionId, msg.sender, moveHash, uint32(block.timestamp));
        
        // Check if both players committed
        address[] memory playerList = sessionPlayerList[sessionId];
        bool allCommitted = true;
        for (uint i = 0; i < playerList.length; i++) {
            if (!sessionPlayers[sessionId][playerList[i]].hasSubmittedMove) {
                allCommitted = false;
                break;
            }
        }
        
        if (allCommitted) {
            revealDeadlines[sessionId] = block.timestamp + REVEAL_PHASE_DURATION;
            emit RevealPhaseStarted(sessionId, revealDeadlines[sessionId]);
        }
    }
    
    function revealMove(uint128 sessionId, Move move, uint256 nonce) external {
        _revealMoveInternal(sessionId, msg.sender, move, nonce);
    }
    
    
    function _revealMoveInternal(uint128 sessionId, address player, Move move, uint256 nonce) internal {
        require(sessions[sessionId].isActive && !sessions[sessionId].isComplete, "Session not active");
        require(sessionPlayers[sessionId][player].isActive, "Player not in session");
        require(sessionPlayers[sessionId][player].hasSubmittedMove, "No move committed");
        require(!gameMoves[sessionId][player].revealed, "Move already revealed");
        require(block.timestamp <= revealDeadlines[sessionId], "Reveal phase ended");
        require(move != Move.None, "Invalid move");
        
        bytes32 expectedHash = keccak256(abi.encodePacked(player, uint256(move), nonce));
        require(expectedHash == sessionPlayers[sessionId][player].moveHash, "Invalid reveal");
        
        gameMoves[sessionId][player] = GameMove({
            move: move,
            nonce: nonce,
            revealed: true
        });
        
        revealsCount[sessionId]++;
        
        emit MoveRevealed(sessionId, player, move);
        
        // Check if all players revealed or reveal phase ended
        if (revealsCount[sessionId] == sessionPlayerList[sessionId].length) {
            _determineRPSWinner(sessionId);
        }
    }
    
    
    function forceResolveGame(uint128 sessionId) external {
        require(sessions[sessionId].isActive && !sessions[sessionId].isComplete, "Session not active");
        require(block.timestamp > revealDeadlines[sessionId], "Reveal phase not ended");
        require(revealsCount[sessionId] < sessionPlayerList[sessionId].length, "All moves revealed");
        
        _determineRPSWinner(sessionId);
    }
    
    function _determineRPSWinner(uint128 sessionId) internal {
        address[] memory playerList = sessionPlayerList[sessionId];
        require(playerList.length == 2, "Invalid player count");
        
        address player1 = playerList[0];
        address player2 = playerList[1];
        
        bool p1Revealed = gameMoves[sessionId][player1].revealed;
        bool p2Revealed = gameMoves[sessionId][player2].revealed;
        
        address winner;
        bool isDraw = false;
        uint256 prizeAmount = sessions[sessionId].prizePool;
        
        // If only one player revealed, they win
        if (p1Revealed && !p2Revealed) {
            winner = player1;
        } else if (!p1Revealed && p2Revealed) {
            winner = player2;
        } else if (!p1Revealed && !p2Revealed) {
            // Both failed to reveal - split prize
            isDraw = true;
            prizeAmount = sessions[sessionId].prizePool / 2;
            playerBalances[player1] += prizeAmount;
            playerBalances[player2] += prizeAmount;
        } else {
            // Both revealed - determine winner by game rules
            Move move1 = gameMoves[sessionId][player1].move;
            Move move2 = gameMoves[sessionId][player2].move;
            
            if (move1 == move2) {
                // Draw
                isDraw = true;
                prizeAmount = sessions[sessionId].prizePool / 2;
                playerBalances[player1] += prizeAmount;
                playerBalances[player2] += prizeAmount;
            } else if (
                (move1 == Move.Rock && move2 == Move.Scissors) ||
                (move1 == Move.Paper && move2 == Move.Rock) ||
                (move1 == Move.Scissors && move2 == Move.Paper)
            ) {
                winner = player1;
            } else {
                winner = player2;
            }
        }
        
        if (!isDraw && winner != address(0)) {
            playerBalances[winner] += prizeAmount;
        }
        
        // Store game result
        Move[] memory moves = new Move[](2);
        moves[0] = gameMoves[sessionId][player1].move;
        moves[1] = gameMoves[sessionId][player2].move;
        
        gameResults[sessionId] = GameResult({
            winner: winner,
            players: playerList,
            moves: moves,
            prizeAmount: prizeAmount,
            isDraw: isDraw,
            completedAt: uint64(block.timestamp)
        });
        
        // Mark session as complete
        sessions[sessionId].isComplete = true;
        sessions[sessionId].isActive = false;
        
        emit GameResultDetermined(sessionId, winner, isDraw, prizeAmount);
        
        // Create arrays for SessionCompleted event
        address[] memory winners = new address[](isDraw ? 2 : 1);
        uint256[] memory prizes = new uint256[](isDraw ? 2 : 1);
        
        if (isDraw) {
            winners[0] = player1;
            winners[1] = player2;
            prizes[0] = prizeAmount;
            prizes[1] = prizeAmount;
        } else {
            winners[0] = winner;
            prizes[0] = prizeAmount;
        }
        
        emit SessionCompleted(sessionId, winners, prizes, uint64(block.timestamp));
    }
    
    function getGameResult(uint128 sessionId) external view returns (GameResult memory) {
        return gameResults[sessionId];
    }
    
    function getPlayerGameMove(uint128 sessionId, address player) external view returns (GameMove memory) {
        return gameMoves[sessionId][player];
    }
    
    function getMoveHash(address player, Move move, uint256 nonce) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(player, uint256(move), nonce));
    }
    
    function withdraw() external nonReentrant {
        uint256 amount = playerBalances[msg.sender];
        require(amount > 0, "No balance to withdraw");
        
        playerBalances[msg.sender] = 0;
        
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Withdrawal failed");
    }
    
    function getRevealDeadline(uint128 sessionId) external view returns (uint256) {
        return revealDeadlines[sessionId];
    }
    
    function getRevealsCount(uint128 sessionId) external view returns (uint256) {
        return revealsCount[sessionId];
    }
}