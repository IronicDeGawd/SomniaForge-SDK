import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28", // Official Somnia version
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
    },
  },
  networks: {
    somnia: {
      url: "https://dream-rpc.somnia.network",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 50312,
    },
  },
  etherscan: {
    apiKey: {
      somnia: process.env.ETHERSCAN_API_KEY || "",
    },
    customChains: [
      {
        network: "somnia",
        chainId: 50312,
        urls: {
          apiURL: "https://shannon-explorer.somnia.network/api",
          browserURL: "https://shannon-explorer.somnia.network",
        },
      },
    ],
  },
};

export default config;
