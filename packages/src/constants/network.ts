import { defineChain } from 'viem'

export const somniaNetwork = defineChain({
  id: 50312,
  name: 'Somnia Network',
  nativeCurrency: {
    decimals: 18,
    name: 'Somnia Test Token',
    symbol: 'STT',
  },
  rpcUrls: {
    default: {
      http: ['https://dream-rpc.somnia.network'],
      webSocket: ['wss://dream-rpc.somnia.network/ws'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Somnia Explorer',
      url: 'https://shannon-explorer.somnia.network',
    },
  },
  testnet: true,
})

export const SOMNIA_CHAIN_ID = 50312 as const
export const SOMNIA_RPC_URL = 'https://dream-rpc.somnia.network' as const
export const SOMNIA_WS_URL = 'wss://dream-rpc.somnia.network/ws' as const