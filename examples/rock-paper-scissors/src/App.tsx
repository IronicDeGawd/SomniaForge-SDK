import { useState, useEffect } from 'react'
import { SomniaGameSDK } from '@somnia/game-sdk'
import { GameSessionManager } from '@somnia/game-sdk'
import { detectAvailableWallets, getWalletConnectionInstructions, switchToSomniaNetwork, addSomniaNetwork } from './utils/walletDetection'
import './App.css'

type Move = 'rock' | 'paper' | 'scissors' | null
type GameState = 'disconnected' | 'connecting' | 'connected' | 'creating' | 'waiting' | 'playing' | 'revealing' | 'finished'

interface GameSession {
  sessionId: string
  playerCount: number
  entryFee: string
  isActive: boolean
}

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
  const [showWalletInstructions, setShowWalletInstructions] = useState<boolean>(false)
  const [availableWallets, setAvailableWallets] = useState<any[]>([])
  const [showWalletSelector, setShowWalletSelector] = useState<boolean>(false)

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

  const connectBestWallet = async () => {
    // Reset all modal states
    setShowWalletSelector(false)
    setShowWalletInstructions(false)
    setError('')
    
    try {
      const wallets = await detectAvailableWallets()
      
      // Find the best wallet (prefer actual MetaMask over others)
      const bestWallet = wallets.find(w => 
        w.name.toLowerCase().includes('metamask') && !w.provider.isBraveWallet
      ) || wallets.find(w => 
        w.provider.isMetaMask && !w.provider.isBraveWallet && !w.provider.isPhantom
      ) || wallets[0]
      
      if (!bestWallet) {
        throw new Error('No compatible wallet found. Please install MetaMask.')
      }
      
      await connectSpecificWallet(bestWallet)
      
    } catch (err: any) {
      let errorMessage = 'Failed to connect wallet'
      
      if (err.message.includes('No compatible wallet found')) {
        errorMessage = err.message
      } else if (err.message.includes('User rejected') || err.code === 4001) {
        errorMessage = 'Connection rejected. Please approve the connection in your wallet.'
      } else if (err.code === 4902) {
        errorMessage = 'Somnia network will be added automatically - please try again.'
      } else {
        errorMessage = `Connection failed: ${err.message || err}`
        setShowWalletInstructions(true)
      }
      
      setError(errorMessage)
      setGameState('disconnected')
    }
  }


  const showWalletOptions = async () => {
    try {
      setError('')
      setShowWalletInstructions(false)
      const wallets = await detectAvailableWallets()
      setAvailableWallets(wallets)
      setShowWalletSelector(true)
    } catch (err: any) {
      setError('Could not detect wallets: ' + err.message)
    }
  }
  
  const closeWalletSelector = () => {
    setShowWalletSelector(false)
    setAvailableWallets([])
  }

  const addSomniaNetworkAutomatically = async () => {
    try {
      setError('')
      const wallets = await detectAvailableWallets()
      const bestWallet = wallets.find(w => 
        w.name.toLowerCase().includes('metamask') && !w.provider.isBraveWallet
      ) || wallets.find(w => 
        w.provider.isMetaMask && !w.provider.isBraveWallet && !w.provider.isPhantom
      ) || wallets[0]
      
      if (!bestWallet) {
        setError('No compatible wallet found. Please install MetaMask first.')
        return
      }
      
      await addSomniaNetwork(bestWallet.provider)
      setError('Somnia Network added successfully! You can now connect your wallet.')
      
    } catch (err: any) {
      if (err.code === 4001) {
        setError('Network addition rejected. Please approve the network addition in your wallet.')
      } else {
        setError(`Failed to add network: ${err.message}`)
      }
    }
  }

  const connectSpecificWallet = async (wallet: any) => {
    try {
      setGameState('connecting')
      setError('')
      closeWalletSelector()
      
      const provider = wallet.provider
      const accounts = await provider.request({
        method: 'eth_requestAccounts',
      })

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found')
      }

      const account = accounts[0]

      // Get current chain
      const chainId = await provider.request({
        method: 'eth_chainId',
      })

      const chainIdNumber = parseInt(chainId, 16)

      // Handle Somnia network
      if (chainIdNumber !== 50312) {
        try {
          await switchToSomniaNetwork(provider)
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            await addSomniaNetwork(provider)
          } else {
            throw switchError
          }
        }
      }

      // Get balance
      const balance = await provider.request({
        method: 'eth_getBalance',
        params: [account, 'latest'],
      })

      setAccount(account)
      setBalance((parseInt(balance, 16) / 10**18).toFixed(4))
      setGameState('connected')
      
    } catch (err: any) {
      let errorMessage = `Failed to connect to ${wallet.name}: ${err.message || err}`
      setError(errorMessage)
      setGameState('disconnected')
    }
  }

  const createGame = async () => {
    if (!sdk) return
    
    try {
      setGameState('creating')
      setError('')
      
      const entryFee = BigInt(10**15) // 0.001 STT
      const sessionId = await sdk.gameSession.createSession({
        maxPlayers: 2,
        entryFee,
        moveTimeLimit: 600
      })
      
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

  const joinGame = async (sessionId: string) => {
    if (!sdk) return
    
    try {
      setError('')
      
      await sdk.gameSession.joinSession(BigInt(sessionId))
      
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

  const submitMove = async (move: Move) => {
    if (!sdk || !currentSession || !move) return
    
    try {
      setError('')
      setSelectedMove(move)
      
      // Create move hash using SDK method
      const moveHash = GameSessionManager.createMoveHash(move, nonce.toString())
      
      await sdk.gameSession.submitMove(BigInt(currentSession.sessionId), moveHash as `0x${string}`)
      
      setGameState('revealing')
      
      // Simulate waiting for other player and then revealing
      setTimeout(() => {
        revealMoves()
      }, 3000)
      
    } catch (err) {
      setError(`Failed to submit move: ${err}`)
    }
  }

  const revealMoves = () => {
    // Simulate opponent move
    const moves: Move[] = ['rock', 'paper', 'scissors']
    const randomOpponentMove = moves[Math.floor(Math.random() * moves.length)]
    setOpponentMove(randomOpponentMove)
    
    // Determine winner
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
  }

  const resetGame = () => {
    setCurrentSession(null)
    setSelectedMove(null)
    setOpponentMove(null)
    setGameResult('')
    setGameState('connected')
  }

  const getMoveEmoji = (move: Move) => {
    switch (move) {
      case 'rock': return '🪨'
      case 'paper': return '📄'
      case 'scissors': return '✂️'
      default: return '❓'
    }
  }

  return (
    <div className="app">
      <header className="header">
        <h1>🎮 Rock Paper Scissors</h1>
        <p>Powered by Somnia Network</p>
        {account && (
          <div className="wallet-info">
            <p>Account: {account.slice(0, 6)}...{account.slice(-4)}</p>
            <p>Balance: {balance} STT</p>
          </div>
        )}
      </header>

      <main className="main">
        {gameState === 'disconnected' && (
          <div className="game-section">
            {error && (
              <div className="error">
                <p>{error}</p>
                <button onClick={() => setError('')}>Dismiss</button>
              </div>
            )}
            <h2>Connect Your Wallet</h2>
            <p>Connect to Somnia Network to start playing!</p>
            <div className="button-group-horizontal">
              <button onClick={connectBestWallet} className="primary-button">
                Connect Wallet
              </button>
              <button onClick={showWalletOptions} className="secondary-button">
                Choose Wallet
              </button>
              <div className="demo-info">
                {showWalletInstructions ? (
                  <>
                    <p><strong>{getWalletConnectionInstructions().title}</strong></p>
                    {getWalletConnectionInstructions().instructions.map((instruction, index) => (
                      <p key={index} style={{fontSize: '0.9rem', margin: '0.25rem 0'}}>
                        {instruction}
                      </p>
                    ))}
                    <button 
                      onClick={() => setShowWalletInstructions(false)}
                      style={{marginTop: '1rem', padding: '0.5rem 1rem', background: '#667eea', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer'}}
                    >
                      Hide Instructions
                    </button>
                  </>
                ) : (
                  <>
                    <p><strong>Quick Setup:</strong></p>
                    <p>1. Install <a href="https://metamask.io" target="_blank" rel="noopener">MetaMask</a> browser extension</p>
                    <p>2. Add Somnia Network automatically:</p>
                    <button 
                      onClick={addSomniaNetworkAutomatically}
                      className="primary-button"
                      style={{margin: '1rem 0', fontSize: '1rem', padding: '0.8rem 1.5rem'}}
                    >
                      🌐 Add Somnia Network
                    </button>
                    <p>3. Get test tokens from <a href="https://discord.com/invite/somnia" target="_blank" rel="noopener">Somnia Discord</a></p>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {showWalletSelector && (
          <div className="game-section">
            <h2>Select Wallet</h2>
            <p>Choose which wallet to connect:</p>
            <div className="wallet-list">
              {availableWallets.map((wallet, index) => (
                <button
                  key={index}
                  onClick={() => connectSpecificWallet(wallet)}
                  className="wallet-option"
                >
                  <strong>{wallet.name}</strong>
                  {wallet.provider.isBraveWallet && <span className="wallet-tag brave">Brave</span>}
                  {wallet.provider.isMetaMask && !wallet.provider.isBraveWallet && <span className="wallet-tag metamask">MetaMask</span>}
                  {wallet.provider.isPhantom && <span className="wallet-tag phantom">Phantom</span>}
                </button>
              ))}
            </div>
            <button onClick={closeWalletSelector} className="secondary-button">
              Cancel
            </button>
          </div>
        )}

        {gameState === 'connecting' && (
          <div className="game-section">
            <h2>Connecting...</h2>
            <p>Please approve the connection in your wallet</p>
          </div>
        )}

        {gameState === 'connected' && (
          <div className="game-section">
            <h2>Ready to Play!</h2>
            <p>Create a new game or join an existing one</p>
            <div className="button-group">
              <button onClick={createGame} className="primary-button">
                Create Game (0.001 STT)
              </button>
              <div className="join-game">
                <input
                  type="text"
                  placeholder="Session ID"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const target = e.target as HTMLInputElement
                      if (target.value) joinGame(target.value)
                    }
                  }}
                />
                <button onClick={() => {
                  const input = document.querySelector('input[placeholder="Session ID"]') as HTMLInputElement
                  if (input.value) joinGame(input.value)
                }}>
                  Join Game
                </button>
              </div>
            </div>
          </div>
        )}

        {gameState === 'creating' && (
          <div className="game-section">
            <h2>Creating Game...</h2>
            <p>Setting up your game session</p>
          </div>
        )}

        {gameState === 'waiting' && currentSession && (
          <div className="game-section">
            <h2>Waiting for Opponent</h2>
            <p>Game Session ID: <code>{currentSession.sessionId}</code></p>
            <p>Share this ID with your opponent to join!</p>
            <p>Entry Fee: {currentSession.entryFee} STT</p>
          </div>
        )}

        {gameState === 'playing' && (
          <div className="game-section">
            <h2>Choose Your Move!</h2>
            <p>Both players are connected. Make your move:</p>
            <div className="move-buttons">
              <button
                onClick={() => submitMove('rock')}
                className="move-button"
                disabled={selectedMove !== null}
              >
                🪨 Rock
              </button>
              <button
                onClick={() => submitMove('paper')}
                className="move-button"
                disabled={selectedMove !== null}
              >
                📄 Paper
              </button>
              <button
                onClick={() => submitMove('scissors')}
                className="move-button"
                disabled={selectedMove !== null}
              >
                ✂️ Scissors
              </button>
            </div>
            {selectedMove && <p>You chose: {getMoveEmoji(selectedMove)} {selectedMove}</p>}
          </div>
        )}

        {gameState === 'revealing' && (
          <div className="game-section">
            <h2>Revealing Moves...</h2>
            <p>Your move: {getMoveEmoji(selectedMove)} {selectedMove}</p>
            <p>Waiting for opponent to reveal...</p>
          </div>
        )}

        {gameState === 'finished' && (
          <div className="game-section">
            <h2>Game Results</h2>
            <div className="results">
              <div className="move-reveal">
                <div>
                  <h3>You</h3>
                  <div className="move-display">{getMoveEmoji(selectedMove)}</div>
                  <p>{selectedMove}</p>
                </div>
                <div className="vs">VS</div>
                <div>
                  <h3>Opponent</h3>
                  <div className="move-display">{getMoveEmoji(opponentMove)}</div>
                  <p>{opponentMove}</p>
                </div>
              </div>
              <div className="result">
                <h2>{gameResult}</h2>
              </div>
            </div>
            <button onClick={resetGame} className="primary-button">
              Play Again
            </button>
          </div>
        )}
      </main>

      <footer className="footer">
        <p>Built with SomniaGameSDK • Real-time blockchain gaming</p>
        <p>Network: Somnia Testnet (Chain ID: 50312)</p>
      </footer>
    </div>
  )
}

export default App
