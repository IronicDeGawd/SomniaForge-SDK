// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract RockPaperScissorsV2 is ReentrancyGuard {
    struct GameSessionData {
        bool isActive;
        bool isComplete;
        uint256 entryFee;
        uint256 prizePool;
        uint64 createdAt;
        uint32 maxPlayers;
    }

    struct PlayerData {
        bool isActive;
        bool hasSubmittedMove;
        bytes32 moveHash;
    }

    mapping(uint128 => GameSessionData) public sessions;
    mapping(uint128 => mapping(address => PlayerData)) public sessionPlayers;
    mapping(uint128 => address[]) public sessionPlayerList;

    uint128 private _sessionCounter = 0;

    event SessionCreated(uint128 indexed sessionId, address indexed creator, uint256 entryFee);
    event PlayerJoined(uint128 indexed sessionId, address indexed player);
    event ReadyToPlay(uint128 indexed sessionId, address[] players);
    event MoveCommitted(uint128 indexed sessionId, address indexed player);
    event MoveRevealed(uint128 indexed sessionId, address indexed player, Move move);
    event RevealPhaseStarted(uint128 indexed sessionId, uint256 deadline);
    event SessionCompleted(uint128 indexed sessionId, address[] winners, uint256[] prizes, uint64 completedAt);
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

    // Events for transparency
    event AutoWithdrawal(address indexed player, uint256 amount, uint128 indexed sessionId);
    event WithdrawalFailed(address indexed player, uint256 amount, uint128 indexed sessionId);
    event GameResultDetermined(uint128 indexed sessionId, address indexed winner, uint256 prizeAmount);

    mapping(uint128 => mapping(address => GameMove)) public gameMoves;
    mapping(uint128 => GameResult) public gameResults;
    mapping(uint128 => uint256) public revealDeadlines;
    mapping(uint128 => uint256) public revealsCount;

    // Emergency manual withdrawal for failed auto-withdrawals
    mapping(address => uint256) public playerBalances;

    uint256 public constant REVEAL_PHASE_DURATION = 300; // 5 minutes

    function _createGameSession(uint32 maxPlayers, uint256 entryFee) internal returns (uint128) {
        _sessionCounter++;
        uint128 sessionId = _sessionCounter;

        sessions[sessionId] = GameSessionData({
            isActive: true,
            isComplete: false,
            entryFee: entryFee,
            prizePool: 0,
            createdAt: uint64(block.timestamp),
            maxPlayers: maxPlayers
        });

        emit SessionCreated(sessionId, msg.sender, entryFee);
        return sessionId;
    }

    function _addPlayerToSession(uint128 sessionId, address player) internal {
        sessionPlayers[sessionId][player] = PlayerData({
            isActive: true,
            hasSubmittedMove: false,
            moveHash: bytes32(0)
        });

        sessionPlayerList[sessionId].push(player);
        sessions[sessionId].prizePool += msg.value;

        emit PlayerJoined(sessionId, player);
    }

    function getSessionPlayers(uint128 sessionId) external view returns (address[] memory) {
        return sessionPlayerList[sessionId];
    }

    function isSessionActive(uint128 sessionId) external view returns (bool) {
        return sessions[sessionId].isActive && !sessions[sessionId].isComplete;
    }

    function createRPSGame(uint256 entryFee) external payable returns (uint128) {
        require(msg.value == entryFee, "Incorrect entry fee");
        require(entryFee > 0, "Entry fee must be greater than 0");

        uint128 sessionId = _createGameSession(2, entryFee);

        _addPlayerToSession(sessionId, msg.sender);

        return sessionId;
    }

    function joinRPSGame(uint128 sessionId) external payable {
        GameSessionData storage session = sessions[sessionId];
        require(session.isActive && !session.isComplete, "Session not active");
        require(msg.value == session.entryFee, "Incorrect entry fee");
        require(sessionPlayerList[sessionId].length < 2, "Session full");
        require(!sessionPlayers[sessionId][msg.sender].isActive, "Already joined");

        _addPlayerToSession(sessionId, msg.sender);

        if (sessionPlayerList[sessionId].length == 2) {
            revealDeadlines[sessionId] = block.timestamp + REVEAL_PHASE_DURATION;
            emit ReadyToPlay(sessionId, sessionPlayerList[sessionId]);
        }
    }

    function commitMove(uint128 sessionId, bytes32 moveHash) external {
        require(sessions[sessionId].isActive && !sessions[sessionId].isComplete, "Session not active");
        require(sessionPlayers[sessionId][msg.sender].isActive, "Player not in session");
        require(!sessionPlayers[sessionId][msg.sender].hasSubmittedMove, "Move already committed");
        require(sessionPlayerList[sessionId].length == 2, "Waiting for opponent");

        sessionPlayers[sessionId][msg.sender].moveHash = moveHash;
        sessionPlayers[sessionId][msg.sender].hasSubmittedMove = true;

        emit MoveCommitted(sessionId, msg.sender);

        // Check if both players committed
        bool allCommitted = true;
        address[] memory playerList = sessionPlayerList[sessionId];
        for (uint i = 0; i < playerList.length; i++) {
            if (!sessionPlayers[sessionId][playerList[i]].hasSubmittedMove) {
                allCommitted = false;
                break;
            }
        }

        if (allCommitted) {
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

        // Check if all players revealed
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
            // Both failed to reveal - split prize with auto-withdrawal
            isDraw = true;
            prizeAmount = sessions[sessionId].prizePool / 2;
            _safeAutoWithdraw(player1, prizeAmount, sessionId);
            _safeAutoWithdraw(player2, prizeAmount, sessionId);
        } else {
            // Both revealed - determine winner by game rules
            Move move1 = gameMoves[sessionId][player1].move;
            Move move2 = gameMoves[sessionId][player2].move;

            if (move1 == move2) {
                // Draw - split prize with auto-withdrawal
                isDraw = true;
                prizeAmount = sessions[sessionId].prizePool / 2;
                _safeAutoWithdraw(player1, prizeAmount, sessionId);
                _safeAutoWithdraw(player2, prizeAmount, sessionId);
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

        // Auto-withdraw to winner (if not a draw)
        if (!isDraw && winner != address(0)) {
            _safeAutoWithdraw(winner, prizeAmount, sessionId);
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

        sessions[sessionId].isComplete = true;
        sessions[sessionId].isActive = false;

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
        emit GameResultDetermined(sessionId, winner, prizeAmount);
    }

    /**
     * @dev Safe auto-withdrawal with fallback to manual withdrawal
     * @param player Address to send funds to
     * @param amount Amount to send
     * @param sessionId Session ID for event logging
     */
    function _safeAutoWithdraw(address player, uint256 amount, uint128 sessionId) internal {
        if (amount == 0) return;

        // Attempt direct transfer with limited gas
        (bool success, ) = payable(player).call{value: amount, gas: 2300}("");

        if (success) {
            emit AutoWithdrawal(player, amount, sessionId);
        } else {
            // Fallback: Add to manual withdrawal balance
            playerBalances[player] += amount;
            emit WithdrawalFailed(player, amount, sessionId);
        }
    }

    /**
     * @dev Emergency manual withdrawal for failed auto-withdrawals
     */
    function withdraw() external nonReentrant {
        uint256 amount = playerBalances[msg.sender];
        require(amount > 0, "No balance to withdraw");

        playerBalances[msg.sender] = 0;

        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Withdrawal failed");

        emit AutoWithdrawal(msg.sender, amount, 0); // sessionId = 0 for manual withdrawals
    }

    // Read functions remain the same
    function getGameResult(uint128 sessionId) external view returns (GameResult memory) {
        return gameResults[sessionId];
    }

    function getPlayerGameMove(uint128 sessionId, address player) external view returns (GameMove memory) {
        return gameMoves[sessionId][player];
    }

    function getMoveHash(address player, Move move, uint256 nonce) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(player, uint256(move), nonce));
    }

    function getRevealDeadline(uint128 sessionId) external view returns (uint256) {
        return revealDeadlines[sessionId];
    }

    function getRevealsCount(uint128 sessionId) external view returns (uint256) {
        return revealsCount[sessionId];
    }
}