// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract GameEconomy is ERC20, AccessControl, ReentrancyGuard {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant GAME_ROLE = keccak256("GAME_ROLE");
    
    struct BettingPool {
        uint256 poolId;
        uint256 totalPool;
        uint256 option1Pool;
        uint256 option2Pool;
        uint32 option1Bettors;
        uint32 option2Bettors;
        uint64 deadline;
        bool isActive;
        bool isResolved;
        uint8 winningOption;
        string description;
    }
    
    struct UserBet {
        uint256 amount;
        uint8 option;
        bool claimed;
    }
    
    address public treasury;
    address public developerFund;
    
    uint256 public constant EXCHANGE_RATE = 1000; // 1 STT = 1000 GAME tokens
    uint256 public constant PLATFORM_FEE = 250; // 2.5% in basis points
    uint256 public constant DEVELOPER_FEE = 500; // 5% in basis points
    uint256 public constant BASIS_POINTS = 10000;
    
    uint256 private _poolCounter;
    uint256 public totalSTTDeposited;
    uint256 public totalFeesCollected;
    
    mapping(uint256 => BettingPool) public bettingPools;
    mapping(uint256 => mapping(address => UserBet)) public userBets;
    mapping(address => uint256) public pendingWithdrawals;
    
    event TokensExchanged(
        address indexed user,
        uint256 sttAmount,
        uint256 gameTokens,
        bool isDeposit
    );
    
    event BettingPoolCreated(
        uint256 indexed poolId,
        string description,
        uint64 deadline
    );
    
    event BetPlaced(
        uint256 indexed poolId,
        address indexed user,
        uint256 amount,
        uint8 option
    );
    
    event PoolResolved(
        uint256 indexed poolId,
        uint8 winningOption,
        uint256 totalPayout,
        uint256 platformFee
    );
    
    event WinningsClaimedFromPool(
        uint256 indexed poolId,
        address indexed user,
        uint256 amount
    );
    
    event RevenueDistributed(
        uint256 platformAmount,
        uint256 developerAmount
    );
    
    constructor(
        address _treasury,
        address _developerFund
    ) ERC20("GameToken", "GAME") {
        require(_treasury != address(0), "Invalid treasury address");
        require(_developerFund != address(0), "Invalid developer fund address");
        
        treasury = _treasury;
        developerFund = _developerFund;
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(GAME_ROLE, msg.sender);
        
        _mint(msg.sender, 1000000 * 10**decimals()); // Initial supply for testing
    }
    
    function depositSTT() external payable nonReentrant {
        require(msg.value > 0, "Must send STT");
        
        uint256 gameTokens = msg.value * EXCHANGE_RATE;
        totalSTTDeposited += msg.value;
        
        _mint(msg.sender, gameTokens);
        
        emit TokensExchanged(msg.sender, msg.value, gameTokens, true);
    }
    
    function withdrawSTT(uint256 gameTokenAmount) external nonReentrant {
        require(gameTokenAmount > 0, "Amount must be positive");
        require(balanceOf(msg.sender) >= gameTokenAmount, "Insufficient GAME tokens");
        
        uint256 sttAmount = gameTokenAmount / EXCHANGE_RATE;
        require(sttAmount > 0, "Amount too small");
        require(address(this).balance >= sttAmount, "Insufficient STT reserves");
        
        _burn(msg.sender, gameTokenAmount);
        
        (bool success, ) = payable(msg.sender).call{value: sttAmount}("");
        require(success, "STT transfer failed");
        
        emit TokensExchanged(msg.sender, sttAmount, gameTokenAmount, false);
    }
    
    function createBettingPool(
        string calldata description,
        uint64 duration
    ) external onlyRole(GAME_ROLE) returns (uint256) {
        require(duration > 0 && duration <= 86400 * 7, "Invalid duration"); // Max 7 days
        
        uint256 poolId = ++_poolCounter;
        uint64 deadline = uint64(block.timestamp) + duration;
        
        bettingPools[poolId] = BettingPool({
            poolId: poolId,
            totalPool: 0,
            option1Pool: 0,
            option2Pool: 0,
            option1Bettors: 0,
            option2Bettors: 0,
            deadline: deadline,
            isActive: true,
            isResolved: false,
            winningOption: 0,
            description: description
        });
        
        emit BettingPoolCreated(poolId, description, deadline);
        return poolId;
    }
    
    function placeBet(uint256 poolId, uint8 option, uint256 amount) external nonReentrant {
        BettingPool storage pool = bettingPools[poolId];
        require(pool.isActive && !pool.isResolved, "Pool not active");
        require(block.timestamp < pool.deadline, "Betting period ended");
        require(option == 1 || option == 2, "Invalid option");
        require(amount > 0, "Amount must be positive");
        require(balanceOf(msg.sender) >= amount, "Insufficient tokens");
        require(userBets[poolId][msg.sender].amount == 0, "Already placed bet");
        
        _burn(msg.sender, amount);
        
        pool.totalPool += amount;
        userBets[poolId][msg.sender] = UserBet({
            amount: amount,
            option: option,
            claimed: false
        });
        
        if (option == 1) {
            pool.option1Pool += amount;
            pool.option1Bettors++;
        } else {
            pool.option2Pool += amount;
            pool.option2Bettors++;
        }
        
        emit BetPlaced(poolId, msg.sender, amount, option);
    }
    
    function resolveBettingPool(uint256 poolId, uint8 winningOption) external onlyRole(GAME_ROLE) {
        BettingPool storage pool = bettingPools[poolId];
        require(pool.isActive && !pool.isResolved, "Pool not active or already resolved");
        require(block.timestamp >= pool.deadline, "Betting period not ended");
        require(winningOption == 1 || winningOption == 2, "Invalid winning option");
        
        pool.isResolved = true;
        pool.winningOption = winningOption;
        pool.isActive = false;
        
        uint256 platformFee = (pool.totalPool * PLATFORM_FEE) / BASIS_POINTS;
        uint256 availablePayout = pool.totalPool - platformFee;
        
        totalFeesCollected += platformFee;
        
        emit PoolResolved(poolId, winningOption, availablePayout, platformFee);
        
        _distributeRevenue(platformFee);
    }
    
    function claimWinnings(uint256 poolId) external nonReentrant {
        BettingPool storage pool = bettingPools[poolId];
        UserBet storage userBet = userBets[poolId][msg.sender];
        
        require(pool.isResolved, "Pool not resolved");
        require(userBet.amount > 0, "No bet placed");
        require(!userBet.claimed, "Already claimed");
        require(userBet.option == pool.winningOption, "Losing bet");
        
        uint256 winningPool = pool.winningOption == 1 ? pool.option1Pool : pool.option2Pool;
        require(winningPool > 0, "No winning pool");
        
        uint256 platformFee = (pool.totalPool * PLATFORM_FEE) / BASIS_POINTS;
        uint256 availablePayout = pool.totalPool - platformFee;
        
        uint256 userWinnings = (userBet.amount * availablePayout) / winningPool;
        
        userBet.claimed = true;
        _mint(msg.sender, userWinnings);
        
        emit WinningsClaimedFromPool(poolId, msg.sender, userWinnings);
    }
    
    function _distributeRevenue(uint256 totalFee) internal {
        if (totalFee == 0) return;
        
        uint256 developerAmount = (totalFee * DEVELOPER_FEE) / BASIS_POINTS;
        uint256 platformAmount = totalFee - developerAmount;
        
        if (developerAmount > 0) {
            _mint(developerFund, developerAmount);
        }
        
        if (platformAmount > 0) {
            _mint(treasury, platformAmount);
        }
        
        emit RevenueDistributed(platformAmount, developerAmount);
    }
    
    function distributePrizes(
        address[] calldata winners,
        uint256[] calldata amounts
    ) external onlyRole(GAME_ROLE) {
        require(winners.length == amounts.length, "Array length mismatch");
        
        for (uint256 i = 0; i < winners.length; i++) {
            if (amounts[i] > 0) {
                _mint(winners[i], amounts[i]);
            }
        }
    }
    
    function burnTokens(address from, uint256 amount) external onlyRole(GAME_ROLE) {
        _burn(from, amount);
    }
    
    function mintReward(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }
    
    function emergencyWithdraw() external onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");
        
        (bool success, ) = payable(treasury).call{value: balance}("");
        require(success, "Transfer failed");
    }
    
    function updateTreasury(address _newTreasury) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_newTreasury != address(0), "Invalid address");
        treasury = _newTreasury;
    }
    
    function updateDeveloperFund(address _newDeveloperFund) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_newDeveloperFund != address(0), "Invalid address");
        developerFund = _newDeveloperFund;
    }
    
    function getPoolInfo(uint256 poolId) external view returns (
        uint256 totalPool,
        uint256 option1Pool,
        uint256 option2Pool,
        uint32 option1Bettors,
        uint32 option2Bettors,
        uint64 deadline,
        bool isActive,
        bool isResolved,
        uint8 winningOption,
        string memory description
    ) {
        BettingPool memory pool = bettingPools[poolId];
        return (
            pool.totalPool,
            pool.option1Pool,
            pool.option2Pool,
            pool.option1Bettors,
            pool.option2Bettors,
            pool.deadline,
            pool.isActive,
            pool.isResolved,
            pool.winningOption,
            pool.description
        );
    }
    
    function getUserBet(uint256 poolId, address user) external view returns (
        uint256 amount,
        uint8 option,
        bool claimed
    ) {
        UserBet memory bet = userBets[poolId][user];
        return (bet.amount, bet.option, bet.claimed);
    }
    
    function getExchangeRate() external pure returns (uint256) {
        return EXCHANGE_RATE;
    }
    
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    function getCurrentPoolId() external view returns (uint256) {
        return _poolCounter;
    }
    
    function calculatePotentialWinnings(uint256 poolId, uint256 betAmount, uint8 option) 
        external 
        view 
        returns (uint256) 
    {
        BettingPool memory pool = bettingPools[poolId];
        if (!pool.isActive || pool.isResolved) return 0;
        
        uint256 currentPool = option == 1 ? pool.option1Pool : pool.option2Pool;
        uint256 projectedTotalPool = pool.totalPool + betAmount;
        uint256 projectedWinningPool = currentPool + betAmount;
        
        if (projectedWinningPool == 0) return 0;
        
        uint256 platformFee = (projectedTotalPool * PLATFORM_FEE) / BASIS_POINTS;
        uint256 availablePayout = projectedTotalPool - platformFee;
        
        return (betAmount * availablePayout) / projectedWinningPool;
    }
    
    receive() external payable {
        if (msg.value > 0) {
            uint256 gameTokens = msg.value * EXCHANGE_RATE;
            totalSTTDeposited += msg.value;
            _mint(msg.sender, gameTokens);
            emit TokensExchanged(msg.sender, msg.value, gameTokens, true);
        }
    }
}