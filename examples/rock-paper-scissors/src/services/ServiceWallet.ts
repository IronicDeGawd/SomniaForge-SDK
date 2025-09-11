import { createWalletClient, http, parseEther } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { somniaNetwork } from '@somniaforge/sdk'

export class ServiceWallet {
  private walletClient
  private account

  constructor() {
    const privateKey = import.meta.env.VITE_SERVICE_WALLET_PRIVATE_KEY
    if (!privateKey) {
      throw new Error('Service wallet private key not configured')
    }

    this.account = privateKeyToAccount(privateKey as `0x${string}`)
    this.walletClient = createWalletClient({
      account: this.account,
      chain: somniaNetwork,
      transport: http('https://dream-rpc.somnia.network')
    })
  }

  getAddress(): `0x${string}` {
    return this.account.address
  }

  async getBalance(): Promise<bigint> {
    try {
      return await this.walletClient.getBalance({ 
        address: this.account.address 
      })
    } catch (error) {
      throw new Error(`Failed to get service wallet balance: ${error}`)
    }
  }

  async sendTransaction(to: `0x${string}`, value: bigint, data?: `0x${string}`) {
    try {
      const hash = await this.walletClient.sendTransaction({
        account: this.account,
        to,
        value,
        data,
        chain: somniaNetwork
      })
      return hash
    } catch (error) {
      throw new Error(`Service wallet transaction failed: ${error}`)
    }
  }

  async fundGameEntry(playerAddress: `0x${string}`, entryFee: bigint) {
    try {
      const balance = await this.getBalance()
      const requiredAmount = entryFee + parseEther('0.001') // Entry fee + gas buffer
      
      if (balance < requiredAmount) {
        throw new Error(`Insufficient service wallet funds. Need ${requiredAmount}, have ${balance}`)
      }

      return await this.sendTransaction(playerAddress, entryFee)
    } catch (error) {
      throw new Error(`Failed to fund game entry: ${error}`)
    }
  }
}

export const serviceWallet = new ServiceWallet()