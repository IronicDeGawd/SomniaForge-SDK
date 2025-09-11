export interface GameError {
  title: string
  message: string
  action?: string
}

export function parseGameError(error: unknown): GameError {
  const errorStr = String(error).toLowerCase()

  if (errorStr.includes('user rejected') || errorStr.includes('rejected')) {
    return {
      title: 'Transaction Cancelled',
      message: 'You cancelled the transaction. No worries, try again when ready!',
      action: 'retry'
    }
  }

  if (errorStr.includes('insufficient funds') || errorStr.includes('insufficient balance')) {
    return {
      title: 'Insufficient Funds',
      message: 'You need more STT tokens to play. Get some from the faucet!',
      action: 'fund'
    }
  }

  if (errorStr.includes('already committed') || errorStr.includes('move already submitted')) {
    return {
      title: 'Move Already Submitted',
      message: 'You\'ve already made your move! Wait for the opponent.',
      action: 'wait'
    }
  }

  if (errorStr.includes('session not active') || errorStr.includes('game not started')) {
    return {
      title: 'Game Not Ready',
      message: 'This game session isn\'t active yet. Wait for more players to join!',
      action: 'wait'
    }
  }

  if (errorStr.includes('reveal phase not started')) {
    return {
      title: 'Too Early to Reveal',
      message: 'Wait for both players to make their moves first!',
      action: 'wait'
    }
  }

  if (errorStr.includes('invalid move') || errorStr.includes('move not found')) {
    return {
      title: 'Invalid Move',
      message: 'Something went wrong with your move. Try selecting it again!',
      action: 'retry'
    }
  }

  if (errorStr.includes('no balance to withdraw') || errorStr.includes('no balance available')) {
    return {
      title: 'No Balance to Withdraw',
      message: 'You don\'t have any winnings to withdraw. Funds may have been withdrawn already.',
      action: 'ok'
    }
  }

  if (errorStr.includes('withdrawal failed') || errorStr.includes('transfer failed')) {
    return {
      title: 'Withdrawal Failed',
      message: 'The withdrawal transaction failed. Please try again or contact support.',
      action: 'retry'
    }
  }

  if (errorStr.includes('network') || errorStr.includes('connection')) {
    return {
      title: 'Network Issue',
      message: 'Having trouble connecting. Check your internet and try again!',
      action: 'retry'
    }
  }

  if (errorStr.includes('wallet not connected')) {
    return {
      title: 'Wallet Disconnected',
      message: 'Please connect your wallet to continue playing!',
      action: 'connect'
    }
  }

  return {
    title: 'Unexpected Error',
    message: 'Something unexpected happened. Our team has been notified!',
    action: 'retry'
  }
}

export function getActionText(action?: string): string {
  switch (action) {
    case 'retry': return 'Try Again'
    case 'fund': return 'Get STT Tokens'
    case 'wait': return 'Got It'
    case 'connect': return 'Connect Wallet'
    default: return 'OK'
  }
}