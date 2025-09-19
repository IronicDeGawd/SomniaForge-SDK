// Types for Ethereum wallet
interface Window {
  ethereum?: {
    request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
    isMetaMask?: boolean
    selectedAddress?: string
  }
}