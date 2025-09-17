// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract GameSession is ReentrancyGuard, AccessControl {
    bytes32 public constant GAME_ROLE = keccak256("GAME_ROLE");
    
    struct Session {
        uint128 sessionId;
        uint32 playerCount;
        uint32 maxPlayers;
        uint32 moveTimeLimit;
        uint64 createdAt;
        uint64 startedAt;
        bool isActive;
        bool isComplete;
        uint256 entryFee;
        uint256 prizePool;
        address creator;
    }
    
    struct Player {
        address wallet;
        bytes32 moveHash;
        uint32 joinedAt;
        uint32 moveSubmittedAt;
        bool hasSubmittedMove;
        bool isActive;
    }
    
    uint128 internal _sessionCounter;
    
    mapping(uint128 => Session) public sessions;
    mapping(uint128 => mapping(address => Player)) public sessionPlayers;
    mapping(uint128 => address[]) public sessionPlayerList;
    mapping(address => uint256) public playerBalances;
    
    event SessionCreated(
        uint128 indexed sessionId,
        address indexed creator,
        uint32 maxPlayers,
        uint256 entryFee,
        uint32 moveTimeLimit
    );
    
    event PlayerJoined(
        uint128 indexed sessionId,
        address indexed player,
        uint32 playerCount
    );
    
    event SessionStarted(
        uint128 indexed sessionId,
        uint64 startedAt
    );
    
    event MoveSubmitted(
        uint128 indexed sessionId,
        address indexed player,
        bytes32 moveHash,
        uint32 submittedAt
    );
    
    event SessionCompleted(
        uint128 indexed sessionId,
        address[] winners,
        uint256[] prizes,
        uint64 completedAt
    );
    
    event PrizeDistributed(
        uint128 indexed sessionId,
        address indexed player,
        uint256 amount
    );
    
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(GAME_ROLE, msg.sender);
    }
    
    function createSession(
        uint32 maxPlayers,
        uint256 entryFee,
        uint32 moveTimeLimit
    ) external payable nonReentrant returns (uint128) {
        require(maxPlayers >= 2 && maxPlayers <= 100, "Invalid player count");
        require(moveTimeLimit >= 10 && moveTimeLimit <= 3600, "Invalid time limit");
        require(msg.value >= entryFee, "Insufficient entry fee sent");
        
        uint128 sessionId = ++_sessionCounter;
        
        sessions[sessionId] = Session({
            sessionId: sessionId,
            playerCount: 1,
            maxPlayers: maxPlayers,
            moveTimeLimit: moveTimeLimit,
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
        
        emit SessionCreated(sessionId, msg.sender, maxPlayers, entryFee, moveTimeLimit);
        emit PlayerJoined(sessionId, msg.sender, 1);
        
        return sessionId;
    }
    
    function joinSession(uint128 sessionId) external payable nonReentrant {
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
        
        if (session.playerCount == session.maxPlayers) {
            _startSession(sessionId);
        }
    }
    
    function startSession(uint128 sessionId) external {
        Session storage session = sessions[sessionId];
        require(session.creator == msg.sender || hasRole(GAME_ROLE, msg.sender), "Not authorized");
        require(session.playerCount >= 2, "Need at least 2 players");
        require(!session.isActive, "Already started");
        
        _startSession(sessionId);
    }
    
    function _startSession(uint128 sessionId) internal {
        sessions[sessionId].isActive = true;
        sessions[sessionId].startedAt = uint64(block.timestamp);
        
        emit SessionStarted(sessionId, uint64(block.timestamp));
    }
    
    function submitMove(uint128 sessionId, bytes32 moveHash) external nonReentrant {
        Session storage session = sessions[sessionId];
        Player storage player = sessionPlayers[sessionId][msg.sender];
        
        require(session.isActive && !session.isComplete, "Session not active");
        require(player.wallet == msg.sender, "Not a player");
        require(player.isActive, "Player eliminated");
        require(!player.hasSubmittedMove, "Move already submitted");
        require(
            block.timestamp <= session.startedAt + session.moveTimeLimit,
            "Move deadline passed"
        );
        
        player.moveHash = moveHash;
        player.moveSubmittedAt = uint32(block.timestamp);
        player.hasSubmittedMove = true;
        
        emit MoveSubmitted(sessionId, msg.sender, moveHash, uint32(block.timestamp));
        
        if (_allMovesSubmitted(sessionId)) {
            _completeSession(sessionId);
        }
    }
    
    function _allMovesSubmitted(uint128 sessionId) internal view returns (bool) {
        address[] memory players = sessionPlayerList[sessionId];
        uint256 activeCount = 0;
        uint256 submittedCount = 0;
        
        for (uint256 i = 0; i < players.length; i++) {
            Player memory player = sessionPlayers[sessionId][players[i]];
            if (player.isActive) {
                activeCount++;
                if (player.hasSubmittedMove) {
                    submittedCount++;
                }
            }
        }
        
        return submittedCount == activeCount && activeCount > 0;
    }
    
    function _completeSession(uint128 sessionId) internal {
        Session storage session = sessions[sessionId];
        session.isComplete = true;
        
        (address[] memory winners, uint256[] memory prizes) = _determineWinner(sessionId);
        
        for (uint256 i = 0; i < winners.length; i++) {
            if (prizes[i] > 0) {
                playerBalances[winners[i]] += prizes[i];
                emit PrizeDistributed(sessionId, winners[i], prizes[i]);
            }
        }
        
        emit SessionCompleted(sessionId, winners, prizes, uint64(block.timestamp));
    }
    
    function _determineWinner(uint128 sessionId) 
        internal 
        virtual 
        returns (address[] memory winners, uint256[] memory prizes) 
    {
        Session memory session = sessions[sessionId];
        address[] memory players = sessionPlayerList[sessionId];
        
        winners = new address[](1);
        prizes = new uint256[](1);
        
        address winner = players[0];
        for (uint256 i = 1; i < players.length; i++) {
            if (sessionPlayers[sessionId][players[i]].isActive) {
                winner = players[i];
                break;
            }
        }
        
        winners[0] = winner;
        prizes[0] = session.prizePool;
    }
    
    function forceCompleteSession(uint128 sessionId) external onlyRole(GAME_ROLE) {
        Session storage session = sessions[sessionId];
        require(session.isActive && !session.isComplete, "Invalid session state");
        require(
            block.timestamp > session.startedAt + session.moveTimeLimit + 60,
            "Wait period not elapsed"
        );
        
        _eliminateInactivePlayers(sessionId);
        _completeSession(sessionId);
    }
    
    function _eliminateInactivePlayers(uint128 sessionId) internal {
        address[] memory players = sessionPlayerList[sessionId];
        
        for (uint256 i = 0; i < players.length; i++) {
            Player storage player = sessionPlayers[sessionId][players[i]];
            if (player.isActive && !player.hasSubmittedMove) {
                player.isActive = false;
            }
        }
    }
    
    function withdrawBalance() external nonReentrant {
        uint256 amount = playerBalances[msg.sender];
        require(amount > 0, "No balance to withdraw");
        
        playerBalances[msg.sender] = 0;
        
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Transfer failed");
    }
    
    function getSessionPlayers(uint128 sessionId) external view returns (address[] memory) {
        return sessionPlayerList[sessionId];
    }
    
    function getPlayerMove(uint128 sessionId, address player) external view returns (bytes32) {
        return sessionPlayers[sessionId][player].moveHash;
    }
    
    function isSessionActive(uint128 sessionId) external view returns (bool) {
        return sessions[sessionId].isActive && !sessions[sessionId].isComplete;
    }
    
    function getCurrentSessionId() external view returns (uint128) {
        return _sessionCounter;
    }
}