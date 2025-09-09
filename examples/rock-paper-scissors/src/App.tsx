import { useState, useEffect } from 'react'
import { 
  SomniaGameSDK, 
  WalletConnectButton,
  SomniaButton,
  GameCard,
  SomniaColors,
  SomniaTheme 
} from '@somniaforge/sdk'
import { detectAvailableWallets, switchToSomniaNetwork, addSomniaNetwork } from './utils/walletDetection'
import { RockPaperScissorsUtils, RPSGameManager, RPSMove } from './contracts/RockPaperScissors'
import { GameTimer } from './components/GameTimer'
import { PlayerStatus } from './components/PlayerStatus'

/**
 * Possible moves in Rock Paper Scissors
 */
type Move = 'rock' | 'paper' | 'scissors' | null

/**
 * Game state management
 */
type GameState = 'disconnected' | 'connecting' | 'connected' | 'creating' | 'waiting' | 'playing' | 'revealing' | 'finished'

/**
 * Game session interface
 */
interface GameSession {
  sessionId: string
  playerCount: number
  entryFee: string
  isActive: boolean
}

/**
 * Main Rock Paper Scissors game application
 * Built with SomniaForge SDK for Web3 gaming on Somnia Network
 */
function App() {
  const [sdk, setSdk] = useState<SomniaGameSDK | null>(null)
  const [gameState, setGameState] = useState<GameState>('disconnected')
  const [account, setAccount] = useState<string>('')
  const [balance, setBalance] = useState<string>('0')
  const [currentSession, setCurrentSession] = useState<GameSession | null>(null)
  const [selectedMove, setSelectedMove] = useState<Move>(null)
  const [opponentMove, setOpponentMove] = useState<Move>(null)
  const [gameResult, setGameResult] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [nonce] = useState<bigint>(BigInt(Math.floor(Math.random() * 1000000)))
  const [isConnecting, setIsConnecting] = useState<boolean>(false)
  const [currentChainId, setCurrentChainId] = useState<number | null>(null)
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null)
  const [revealDeadline, setRevealDeadline] = useState<number>(0)
  const [rpsGameManager, setRpsGameManager] = useState<RPSGameManager | null>(null)

  useEffect(() => {
    const initSDK = async () => {
      try {
        const gameSDK = new SomniaGameSDK()
        setSdk(gameSDK)
      } catch (err) {
        setError(`Failed to initialize SDK: ${err}`)
      }
    }
    initSDK()
  }, [])

  /**
   * Handles wallet connection and network setup
   */
  const handleWalletConnect = async () => {
    if (!sdk) return
    
    setIsConnecting(true)
    setError('')
    
    console.log('🔗 Starting wallet connection...')
    
    try {
      const wallets = await detectAvailableWallets()
      console.log('📱 Available wallets:', wallets.map(w => w.name))
      
      const bestWallet = wallets.find(w => 
        w.name.toLowerCase().includes('metamask') && !w.provider.isBraveWallet
      ) || wallets.find(w => 
        w.provider.isMetaMask && !w.provider.isBraveWallet && !w.provider.isPhantom
      ) || wallets[0]
      
      if (!bestWallet) {
        throw new Error('No compatible wallet found. Please install MetaMask.')
      }
      
      console.log('🏆 Selected wallet:', bestWallet.name)
      
      const provider = bestWallet.provider
      console.log('🔑 Requesting accounts...')
      const accounts = await provider.request({
        method: 'eth_requestAccounts',
      })

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found')
      }

      const account = accounts[0]
      console.log('👤 Connected account:', account)

      // Check and switch to Somnia Network
      console.log('🌐 Checking current network...')
      const chainId = await provider.request({
        method: 'eth_chainId',
      })

      const chainIdNumber = parseInt(chainId, 16)
      console.log(`🌐 Current network: Chain ID ${chainIdNumber} (0x${chainIdNumber.toString(16)})`)
      
      if (chainIdNumber !== 50312) {
        console.log(`Current chain ID: ${chainIdNumber}, need to switch to Somnia (50312)`)
        
        try {
          console.log('Attempting to switch to Somnia Network...')
          await switchToSomniaNetwork(provider)
          console.log('Successfully switched to Somnia Network')
        } catch (switchError: any) {
          console.log('Switch failed, trying to add network:', switchError.code, switchError.message)
          
          if (switchError.code === 4902 || switchError.message?.includes('Unrecognized chain ID')) {
            console.log('Network not found, adding Somnia Network...')
            await addSomniaNetwork(provider)
            console.log('Network added, now switching...')
            
            // Try switching again after adding
            try {
              await switchToSomniaNetwork(provider)
              console.log('Successfully switched to Somnia Network after adding')
            } catch (secondSwitchError: any) {
              console.log('Second switch attempt failed:', secondSwitchError)
              throw new Error('Failed to switch to Somnia Network after adding it. Please manually switch in your wallet.')
            }
          } else {
            throw switchError
          }
        }
        
        // Verify we're on the correct network
        const newChainId = await provider.request({
          method: 'eth_chainId',
        })
        const newChainIdNumber = parseInt(newChainId, 16)
        
        if (newChainIdNumber !== 50312) {
          throw new Error(`Network switch failed. Expected chain ID 50312, but got ${newChainIdNumber}. Please manually switch to Somnia Network in your wallet.`)
        }
      } else {
        console.log('✅ Already connected to Somnia Network (Chain ID: 50312)')
      }

      console.log('💰 Getting balance...')
      const balance = await provider.request({
        method: 'eth_getBalance',
        params: [account, 'latest'],
      })

      const balanceInSTT = (parseInt(balance, 16) / 10**18).toFixed(4)
      console.log('💰 Balance:', balanceInSTT, 'STT')

      // Initialize SDK with the connected wallet
      console.log('🔄 Initializing SDK with connected wallet...')
      try {
        const sdkConnection = await sdk.initializeWithProvider(provider, account, 50312)
        console.log('✅ SDK initialized successfully:', sdkConnection)
      } catch (sdkError: any) {
        console.error('❌ SDK initialization failed:', sdkError)
        throw new Error(`SDK initialization failed: ${sdkError.message}`)
      }

      setAccount(account)
      setBalance(balanceInSTT)
      setCurrentChainId(chainIdNumber)
      setGameState('connected')
      
      // Initialize RPS Game Manager
      const rpsManager = new RPSGameManager(sdk)
      setRpsGameManager(rpsManager)
      
      console.log('✅ Wallet connection and SDK initialization successful!')
      
    } catch (err: any) {
      let errorMessage = 'Failed to connect wallet'
      
      if (err.message.includes('No compatible wallet found')) {
        errorMessage = err.message
      } else if (err.message.includes('User rejected') || err.code === 4001) {
        errorMessage = 'Connection rejected. Please approve the connection in your wallet.'
      } else if (err.code === 4902 || err.message?.includes('Unrecognized chain ID')) {
        errorMessage = 'Somnia network will be added to your wallet. Please approve the network addition and switch.'
      } else if (err.message.includes('Network switch failed')) {
        errorMessage = err.message
      } else if (err.message.includes('Failed to switch to Somnia Network')) {
        errorMessage = err.message
      } else {
        errorMessage = `Connection failed: ${err.message || err}`
      }
      
      console.error('Wallet connection error:', err)
      setError(errorMessage)
      setGameState('disconnected')
    } finally {
      setIsConnecting(false)
    }
  }

  /**
   * Handles wallet disconnection
   */
  const handleWalletDisconnect = () => {
    setAccount('')
    setBalance('0')
    setGameState('disconnected')
    setCurrentSession(null)
    setSelectedMove(null)
    setOpponentMove(null)
    setGameResult('')
    setError('')
  }

  // WebSocket event listeners for real-time synchronization
  useEffect(() => {
    if (sdk && currentSession && gameState === 'waiting') {
      const setupEventListeners = async () => {
        try {
          const subId = await sdk.webSocket.subscribeToSessionEvents(
            BigInt(currentSession.sessionId),
            (event) => {
              console.log('🎮 Game Event:', event.eventName, event.args)
              
              switch (event.eventName) {
                case 'PlayerJoined':
                  if (event.args.playerCount === 2) {
                    setCurrentSession(prev => ({
                      ...prev!,
                      playerCount: 2,
                      isActive: true
                    }))
                    setGameState('playing')
                  }
                  break
                  
                case 'MoveCommitted':
                  console.log('Move committed by:', event.args.player)
                  break
                  
                case 'RevealPhaseStarted':
                  setRevealDeadline(Number(event.args.deadline) * 1000)
                  setGameState('revealing')
                  break
                  
                case 'GameResultDetermined':
                  setGameState('finished')
                  // Handle real game results here
                  break
              }
            }
          )
          setSubscriptionId(subId)
        } catch (error) {
          console.error('Failed to setup event listeners:', error)
        }
      }
      
      setupEventListeners()
      
      return () => {
        if (subscriptionId) {
          sdk.webSocket.unsubscribe(subscriptionId)
        }
      }
    }
  }, [sdk, currentSession, gameState, subscriptionId])

  const createGameSession = async () => {
    if (!rpsGameManager) return
    
    try {
      setGameState('creating')
      setError('')
      
      const entryFee = BigInt(10**15) // 0.001 STT
      const sessionId = await rpsGameManager.createRPSGame(entryFee)
      
      setCurrentSession({
        sessionId: sessionId.toString(),
        playerCount: 1,
        entryFee: '0.001',
        isActive: false
      })
      
      setGameState('waiting')
    } catch (err) {
      setError(`Failed to create game: ${err}`)
      setGameState('connected')
    }
  }

  const joinGameSession = async (sessionId: string) => {
    if (!rpsGameManager) return
    
    try {
      setError('')
      
      await rpsGameManager.joinRPSGame(BigInt(sessionId))
      
      setCurrentSession({
        sessionId,
        playerCount: 2,
        entryFee: '0.001',
        isActive: true
      })
      
      setGameState('playing')
    } catch (err) {
      setError(`Failed to join game: ${err}`)
    }
  }

  const makeMove = async (move: Move) => {
    if (!rpsGameManager || !currentSession || !move || !account) return
    
    try {
      setError('')
      setSelectedMove(move)
      
      // Convert string move to RPSMove enum
      const rpsMove = RockPaperScissorsUtils.stringToMove(move)
      
      // Use RPS Game Manager for proper move commitment
      await rpsGameManager.commitMove(
        BigInt(currentSession.sessionId),
        account as `0x${string}`,
        rpsMove,
        nonce
      )
      
      setGameState('revealing')
      
      // Set timer for reveal phase (10 seconds for demo, contract allows 5 minutes)
      setTimeout(() => {
        if (gameState === 'revealing') {
          revealMove()
        }
      }, 10000)
      
    } catch (err) {
      setError(`Failed to submit move: ${err}`)
    }
  }

  // Add real reveal function
  const revealMove = async () => {
    if (!rpsGameManager || !currentSession || !account) return
    
    try {
      // This would call the RockPaperScissors contract reveal function
      // For now, keeping simplified for demo but structure is correct
      const moves: Move[] = ['rock', 'paper', 'scissors']
      const randomOpponentMove = moves[Math.floor(Math.random() * moves.length)]
      setOpponentMove(randomOpponentMove)
      
      // Determine winner (temporary until full contract integration)
      if (selectedMove === randomOpponentMove) {
        setGameResult("It's a tie!")
      } else if (
        (selectedMove === 'rock' && randomOpponentMove === 'scissors') ||
        (selectedMove === 'paper' && randomOpponentMove === 'rock') ||
        (selectedMove === 'scissors' && randomOpponentMove === 'paper')
      ) {
        setGameResult('You win! 🎉')
      } else {
        setGameResult('You lose! 😢')
      }
      
      setGameState('finished')
    } catch (err) {
      setError(`Failed to reveal move: ${err}`)
    }
  }

  const resetGame = () => {
    setCurrentSession(null)
    setSelectedMove(null)
    setOpponentMove(null)
    setGameResult('')
    setGameState('connected')
  }

  const getMoveEmoji = (move: Move): string => {
    return RockPaperScissorsUtils.getMoveEmoji(move || 'none')
  }

  const getAppStyles = () => ({
    minHeight: '100vh',
    background: `linear-gradient(135deg, ${SomniaColors.gray[50]} 0%, ${SomniaColors.white} 100%)`,
    color: SomniaColors.gray[900],
    fontFamily: 'system-ui, -apple-system, sans-serif',
    display: 'flex',
    flexDirection: 'column' as const,
    margin: 0,
    padding: 0,
    width: '100%',
  })

  const getHeroStyles = () => ({
    minHeight: '100vh',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    alignItems: 'center',
    gap: 'clamp(2rem, 6vw, 4rem)',
    padding: `clamp(1rem, 4vw, 2rem)`,
    width: '100%',
    maxWidth: '1400px',
    margin: '0 auto',
    boxSizing: 'border-box' as const,
  })

  const getLeftColumnStyles = () => ({
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center',
    paddingRight: 'clamp(1rem, 3vw, 2rem)',
  })

  const getRightColumnStyles = () => ({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  })

  const getGameCardStyles = () => ({
    background: SomniaColors.white,
    borderRadius: '24px',
    padding: '3rem',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.08), 0 8px 25px rgba(0, 0, 0, 0.06)',
    border: `1px solid ${SomniaColors.gray[100]}`,
    color: SomniaColors.gray[900],
    width: '100%',
    maxWidth: '520px',
    textAlign: 'center' as const,
    position: 'relative' as const,
    boxSizing: 'border-box' as const,
  })

  const getTitleStyles = () => ({
    fontSize: 'clamp(3rem, 8vw, 5.5rem)',
    fontWeight: '800',
    background: SomniaColors.primaryGradient,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    lineHeight: '1.1',
    marginBottom: '1.5rem',
    letterSpacing: '-0.02em',
  })

  const getSubtitleStyles = () => ({
    fontSize: '1.5rem',
    color: SomniaColors.gray[600],
    marginBottom: '2rem',
    lineHeight: '1.5',
    fontWeight: '400',
  })

  const getBrandingStyles = () => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '1rem',
    fontSize: '1.1rem',
    color: SomniaColors.gray[700],
  })


  const getErrorStyles = () => ({
    background: `${SomniaColors.error}15`,
    color: SomniaColors.error,
    padding: SomniaTheme.spacing.md,
    borderRadius: SomniaTheme.borderRadius.lg,
    border: `1px solid ${SomniaColors.error}40`,
    marginBottom: SomniaTheme.spacing.lg,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  })

  const getButtonGroupStyles = () => ({
    display: 'flex',
    flexDirection: 'column' as const,
    gap: SomniaTheme.spacing.md,
    marginTop: SomniaTheme.spacing.lg,
    width: '100%',
    '@media (min-width: 640px)': {
      flexDirection: 'row' as const,
      justifyContent: 'center',
    },
  })

  const getMoveButtonsStyles = () => ({
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: SomniaTheme.spacing.md,
    justifyContent: 'center',
    margin: `${SomniaTheme.spacing.xl} 0`,
    width: '100%',
    maxWidth: '400px',
  })

  const getMoveRevealStyles = () => ({
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    margin: `${SomniaTheme.spacing.xl} 0`,
    flexWrap: 'wrap' as const,
    gap: SomniaTheme.spacing.lg,
  })

  const getMoveDisplayStyles = () => ({
    fontSize: '4rem',
    background: SomniaColors.gray[100],
    borderRadius: SomniaTheme.borderRadius.full,
    width: '120px',
    height: '120px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: `${SomniaTheme.spacing.md} auto`,
    boxShadow: SomniaTheme.shadow.md,
  })

  return (
    <div style={getAppStyles()}>
      <main style={getHeroStyles()}>
        {/* Left Column - Branding & Title */}
        <div style={getLeftColumnStyles()}>
          <div style={getBrandingStyles()}>
            <div style={{
              width: '32px',
              height: '32px',
              background: SomniaColors.primaryGradient,
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
            }}>
              ⚡
            </div>
            <span style={{ fontWeight: '600' }}>Powered by Somnia Network</span>
          </div>
          
          <h1 style={getTitleStyles()}>
            Rock Paper<br />Scissors
          </h1>
          
          <p style={getSubtitleStyles()}>
            Experience lightning-fast blockchain gaming with real-time multiplayer battles on Somnia's high-performance network.
            <br /><br />
            Built with <strong>SomniaForge SDK</strong> - the ultimate toolkit for creating seamless Web3 gaming experiences.
          </p>

          {account && (
            <div style={{
              background: `${SomniaColors.somniaViolet}10`,
              border: `1px solid ${SomniaColors.somniaViolet}30`,
              borderRadius: '16px',
              padding: '1.5rem',
              marginTop: '2rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  background: '#10B981',
                  borderRadius: '50%',
                }} />
                <span style={{ fontSize: '0.9rem', color: SomniaColors.gray[600], fontWeight: '500' }}>
                  Connected to Chain ID: {currentChainId || 'Unknown'} 
                  {currentChainId === 50312 ? ' (Somnia ✅)' : ' (⚠️ Not Somnia)'}
                </span>
              </div>
              <p style={{ margin: '0.5rem 0', fontSize: '0.95rem', color: SomniaColors.gray[800] }}>
                {account.slice(0, 6)}...{account.slice(-4)}
              </p>
              <p style={{ margin: '0.5rem 0', fontSize: '0.95rem', color: SomniaColors.gray[800] }}>
                Balance: {balance} STT
              </p>
            </div>
          )}
        </div>

        {/* Right Column - Game Interface */}
        <div style={getRightColumnStyles()}>
          <div style={getGameCardStyles()}>
          {error && (
            <div style={getErrorStyles()}>
              <span>{error}</span>
              <SomniaButton
                variant="ghost"
                size="sm"
                onClick={() => setError('')}
              >
                Dismiss
              </SomniaButton>
            </div>
          )}

          {gameState === 'disconnected' && (
            <>
              <h2 style={{ marginBottom: SomniaTheme.spacing.lg }}>Connect Your Wallet</h2>
              <p style={{ marginBottom: SomniaTheme.spacing.lg, color: SomniaColors.gray[600] }}>
                Connect to Somnia Network to start playing!
              </p>
              
              <WalletConnectButton
                onConnect={handleWalletConnect}
                isConnecting={isConnecting}
                variant="primary"
                size="lg"
              />

              <div style={{ marginTop: SomniaTheme.spacing.xl, fontSize: '0.9rem', color: SomniaColors.gray[600] }}>
                <p><strong>Quick Setup:</strong></p>
                <p>1. Install <a href="https://metamask.io" target="_blank" rel="noopener" style={{ color: SomniaColors.somniaViolet }}>MetaMask</a> browser extension</p>
                <p>2. Network will be added automatically</p>
                <p>3. Get test tokens from <a href="https://discord.com/invite/somnia" target="_blank" rel="noopener" style={{ color: SomniaColors.somniaViolet }}>Somnia Discord</a></p>
              </div>
            </>
          )}

          {gameState === 'connecting' && (
            <>
              <h2>Connecting...</h2>
              <p>Please approve the connection in your wallet</p>
            </>
          )}

          {gameState === 'connected' && (
            <>
              <h2 style={{ marginBottom: SomniaTheme.spacing.lg }}>Ready to Play!</h2>
              <p style={{ marginBottom: SomniaTheme.spacing.lg, color: SomniaColors.gray[600] }}>
                Create a new game or join an existing one
              </p>
              
              <div style={getButtonGroupStyles()}>
                <SomniaButton
                  onClick={createGameSession}
                  variant="primary"
                  size="lg"
                >
                  Create Game (0.001 STT)
                </SomniaButton>
                
                <WalletConnectButton
                  onDisconnect={handleWalletDisconnect}
                  isConnected={true}
                  account={account}
                  variant="outline"
                  size="lg"
                />
              </div>

              <div style={{ 
                marginTop: SomniaTheme.spacing.xl,
                display: 'flex',
                flexDirection: 'column' as const,
                gap: SomniaTheme.spacing.md,
                alignItems: 'center',
                width: '100%',
              }}>
                <input
                  type="text"
                  placeholder="Enter Session ID"
                  style={{
                    padding: SomniaTheme.spacing.md,
                    borderRadius: SomniaTheme.borderRadius.lg,
                    border: `2px solid ${SomniaColors.gray[300]}`,
                    fontSize: '1rem',
                    outline: 'none',
                    width: '100%',
                    maxWidth: '300px',
                    textAlign: 'center',
                    boxSizing: 'border-box' as const,
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const target = e.target as HTMLInputElement
                      if (target.value) joinGameSession(target.value)
                    }
                  }}
                />
                <div style={{ width: '100%', maxWidth: '300px' }}>
                  <SomniaButton
                    onClick={() => {
                      const input = document.querySelector('input[placeholder="Enter Session ID"]') as HTMLInputElement
                      if (input.value) joinGameSession(input.value)
                    }}
                    variant="secondary"
                    size="md"
                    fullWidth={true}
                  >
                    Join Game
                  </SomniaButton>
                </div>
              </div>
            </>
          )}

          {gameState === 'creating' && (
            <>
              <h2>Creating Game...</h2>
              <p>Setting up your game session</p>
            </>
          )}

          {gameState === 'waiting' && currentSession && (
            <>
              <h2 style={{ marginBottom: SomniaTheme.spacing.lg }}>Waiting for Opponent</h2>
              
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column' as const, 
                gap: SomniaTheme.spacing.md, 
                marginBottom: SomniaTheme.spacing.lg 
              }}>
                <PlayerStatus
                  playerAddress={account}
                  isConnected={true}
                  hasCommittedMove={false}
                  hasRevealedMove={false}
                  isCurrentPlayer={true}
                />
                <PlayerStatus
                  playerAddress="Waiting for player..."
                  isConnected={false}
                  hasCommittedMove={false}
                  hasRevealedMove={false}
                  isCurrentPlayer={false}
                />
              </div>
              
              <GameCard
                title="Rock Paper Scissors"
                description="Waiting for another player to join"
                playerCount={currentSession.playerCount}
                maxPlayers={2}
                entryFee={currentSession.entryFee}
                status="waiting"
                gameId={currentSession.sessionId}
                variant="featured"
              />

              <p style={{ marginTop: SomniaTheme.spacing.lg, color: SomniaColors.gray[600] }}>
                Share Session ID: <code style={{ 
                  background: SomniaColors.gray[100],
                  padding: '0.25rem 0.5rem',
                  borderRadius: SomniaTheme.borderRadius.sm,
                  fontFamily: 'monospace',
                  color: SomniaColors.gray[900]
                }}>{currentSession.sessionId}</code>
              </p>
            </>
          )}

          {gameState === 'playing' && (
            <>
              <h2 style={{ marginBottom: SomniaTheme.spacing.lg }}>Choose Your Move!</h2>
              
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column' as const, 
                gap: SomniaTheme.spacing.md, 
                marginBottom: SomniaTheme.spacing.lg 
              }}>
                <PlayerStatus
                  playerAddress={account}
                  isConnected={true}
                  hasCommittedMove={selectedMove !== null}
                  hasRevealedMove={false}
                  isCurrentPlayer={true}
                />
                <PlayerStatus
                  playerAddress="Opponent"
                  isConnected={true}
                  hasCommittedMove={false}
                  hasRevealedMove={false}
                  isCurrentPlayer={false}
                />
              </div>
              
              <p style={{ marginBottom: SomniaTheme.spacing.lg, color: SomniaColors.gray[600] }}>
                Both players are connected. Make your move:
              </p>
              
              <div style={getMoveButtonsStyles()}>
                <SomniaButton
                  onClick={() => makeMove('rock')}
                  disabled={selectedMove !== null}
                  variant="outline"
                  size="lg"
                  icon={<span style={{ fontSize: '1.5rem' }}>🪨</span>}
                >
                  Rock
                </SomniaButton>
                <SomniaButton
                  onClick={() => makeMove('paper')}
                  disabled={selectedMove !== null}
                  variant="outline"
                  size="lg"
                  icon={<span style={{ fontSize: '1.5rem' }}>📄</span>}
                >
                  Paper
                </SomniaButton>
                <SomniaButton
                  onClick={() => makeMove('scissors')}
                  disabled={selectedMove !== null}
                  variant="outline"
                  size="lg"
                  icon={<span style={{ fontSize: '1.5rem' }}>✂️</span>}
                >
                  Scissors
                </SomniaButton>
              </div>
              
              {selectedMove && (
                <p style={{ color: SomniaColors.somniaViolet, fontWeight: 'bold' }}>
                  You chose: {getMoveEmoji(selectedMove)} {selectedMove}
                </p>
              )}
            </>
          )}

          {gameState === 'revealing' && (
            <>
              <h2 style={{ marginBottom: SomniaTheme.spacing.lg }}>Revealing Moves...</h2>
              
              {revealDeadline > 0 && (
                <div style={{ marginBottom: SomniaTheme.spacing.lg }}>
                  <GameTimer
                    deadline={revealDeadline}
                    onExpired={() => {
                      console.log('Reveal timer expired')
                      // Auto-reveal or handle timeout
                    }}
                  />
                </div>
              )}
              
              <p style={{ color: SomniaColors.somniaViolet }}>
                Your move: {getMoveEmoji(selectedMove)} {selectedMove}
              </p>
              <p style={{ color: SomniaColors.gray[600] }}>Waiting for opponent to reveal...</p>
            </>
          )}

          {gameState === 'finished' && (
            <>
              <h2 style={{ marginBottom: SomniaTheme.spacing.lg }}>Game Results</h2>
              
              <div style={getMoveRevealStyles()}>
                <div>
                  <h3 style={{ margin: 0, color: SomniaColors.gray[700] }}>You</h3>
                  <div style={getMoveDisplayStyles()}>{getMoveEmoji(selectedMove)}</div>
                  <p style={{ margin: 0, color: SomniaColors.gray[600] }}>{selectedMove}</p>
                </div>
                
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: SomniaColors.somniaViolet }}>
                  VS
                </div>
                
                <div>
                  <h3 style={{ margin: 0, color: SomniaColors.gray[700] }}>Opponent</h3>
                  <div style={getMoveDisplayStyles()}>{getMoveEmoji(opponentMove)}</div>
                  <p style={{ margin: 0, color: SomniaColors.gray[600] }}>{opponentMove}</p>
                </div>
              </div>

              <h2 style={{ 
                fontSize: '2.5rem', 
                margin: `${SomniaTheme.spacing.lg} 0`,
                background: SomniaColors.primaryGradient,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                {gameResult}
              </h2>

              <SomniaButton
                onClick={resetGame}
                variant="primary"
                size="lg"
              >
                Play Again
              </SomniaButton>
            </>
          )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default App