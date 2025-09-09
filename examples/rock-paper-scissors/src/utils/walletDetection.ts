// Modern wallet detection using EIP-6963 and provider-specific detection
interface EIP6963ProviderInfo {
  uuid: string
  name: string
  icon: string
  rdns: string
}

interface EIP6963ProviderDetail {
  info: EIP6963ProviderInfo
  provider: unknown
}

interface WalletProvider {
  name: string
  provider: unknown
  isAvailable: boolean
}

export const detectAvailableWallets = async (): Promise<WalletProvider[]> => {
  const wallets: WalletProvider[] = []

  // EIP-6963 wallet detection
  const eip6963Providers: EIP6963ProviderDetail[] = []
  
  // Listen for EIP-6963 providers
  const handleProviderAnnouncement = (event: CustomEvent<EIP6963ProviderDetail>) => {
    eip6963Providers.push(event.detail)
  }

  window.addEventListener('eip6963:announceProvider', handleProviderAnnouncement as EventListener)
  
  // Request providers to announce themselves
  window.dispatchEvent(new Event('eip6963:requestProvider'))
  
  // Wait a bit for providers to respond
  await new Promise(resolve => setTimeout(resolve, 100))
  
  // Remove listener
  window.removeEventListener('eip6963:announceProvider', handleProviderAnnouncement as EventListener)

  // Add EIP-6963 detected wallets
  for (const providerDetail of eip6963Providers) {
    wallets.push({
      name: providerDetail.info.name,
      provider: providerDetail.provider,
      isAvailable: true
    })
  }

  // Legacy detection for wallets that don't support EIP-6963
  const ethereum = (window as unknown as { ethereum?: unknown }).ethereum

  if (ethereum) {
    // Check for MetaMask specifically
    if ((ethereum as { isMetaMask?: boolean }).isMetaMask && !wallets.some(w => w.name.toLowerCase().includes('metamask'))) {
      wallets.push({
        name: 'MetaMask',
        provider: ethereum,
        isAvailable: true
      })
    }

    // Generic provider if no specific detection
    if (wallets.length === 0) {
      wallets.push({
        name: 'Ethereum Wallet',
        provider: ethereum,
        isAvailable: true
      })
    }
  }

  // Check for provider-specific injections
  const trustwallet = (window as unknown as { trustwallet?: unknown }).trustwallet
  if (trustwallet && !wallets.some(w => w.name.toLowerCase().includes('trust'))) {
    wallets.push({
      name: 'Trust Wallet',
      provider: trustwallet,
      isAvailable: true
    })
  }

  return wallets
}

// Helper function to add Somnia network to wallet
export const addSomniaNetwork = async (provider: { request: (args: { method: string; params: unknown[] }) => Promise<unknown> }) => {
  return await provider.request({
    method: 'wallet_addEthereumChain',
    params: [{
      chainId: '0xc488', // 50312 in hex
      chainName: 'Somnia Testnet',
      nativeCurrency: {
        name: 'Somnia Test Token',
        symbol: 'STT',
        decimals: 18,
      },
      rpcUrls: ['https://dream-rpc.somnia.network'],
      blockExplorerUrls: ['https://shannon-explorer.somnia.network'],
    }],
  })
}

// Helper function to switch to Somnia network
export const switchToSomniaNetwork = async (provider: { request: (args: { method: string; params: unknown[] }) => Promise<unknown> }) => {
  return await provider.request({
    method: 'wallet_switchEthereumChain',
    params: [{ chainId: '0xc488' }], // 50312 in hex
  })
}

export const getWalletConnectionInstructions = () => {
  return {
    title: "Wallet Connection Issues?",
    instructions: [
      "If you see 'Unexpected error' with evmAsk.js:",
      "1. Disable Phantom wallet extension temporarily",
      "2. Keep only MetaMask enabled",
      "3. Refresh the page and try again",
      "",
      "Alternative solutions:",
      "• Use a different browser profile with only MetaMask",
      "• Temporarily disable other wallet extensions",
      "• Use Firefox with a fresh MetaMask installation"
    ]
  }
}