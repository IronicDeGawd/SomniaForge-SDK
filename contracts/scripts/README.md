# Scripts Directory

Organized collection of scripts for Rock Paper Scissors contract development and maintenance.

## 📁 Directory Structure

### `/deployment` - Contract Deployment Scripts
- **`deploy-rps-v2.js`** - Deploy RockPaperScissorsV2 with auto-withdrawal system
- **`deploy-rps-simple.js`** - Simple deployment script for basic contract
- **`deploy-rps.ts`** - TypeScript deployment script
- **`deploy.ts`** - Original deployment script

### `/production` - Production Management Scripts
- **`force-resolve-session.js`** - Force resolve stuck game sessions after reveal deadline

### `/debug` - Development & Debugging Scripts
- **`debug-rps-session.js`** - Debug sessions on old V1 contract (manual withdrawal)
- **`debug-rps-v2-session.js`** - Debug sessions on new V2 contract (auto-withdrawal)

## 🚀 Usage Examples

### Deploy V2 Contract (Auto-Withdrawal)
```bash
npx hardhat run scripts/deployment/deploy-rps-v2.js --network somnia
```

### Debug a Session
```bash
# For V1 contract sessions
npx hardhat run scripts/debug/debug-rps-session.js --network somnia

# For V2 contract sessions
npx hardhat run scripts/debug/debug-rps-v2-session.js --network somnia
```

### Force Resolve Stuck Games
```bash
npx hardhat run scripts/production/force-resolve-session.js --network somnia
```

## 📝 Script Configuration

Most scripts use these default configurations:
- **V1 Contract**: `0x38e4C113767fC478B17b15Cee015ab8452f28F93`
- **V2 Contract**: `0xaD114670d92588036240849b36A95FE4d10Ad08F`
- **Network**: Somnia Testnet (`somnia`)

To modify session IDs or wallet addresses, edit the variables at the top of each script.

## 🔧 Contract Versions

- **V1 (Manual Withdrawal)**: Players must manually call `withdraw()` to claim prizes
- **V2 (Auto-Withdrawal)**: Prizes automatically transfer to winners upon game completion

## ⚠️ Important Notes

- Always verify contract addresses before running scripts
- V2 auto-withdrawal requires session to be completed (both players revealed or deadline passed)
- Use force resolve only after reveal deadlines have passed