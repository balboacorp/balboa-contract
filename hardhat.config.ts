import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";
import * as dotenv from "dotenv";
import { HardhatUserConfig } from "hardhat/config";

dotenv.config();

// Helper to get and trim environment variables
const getEnv = (key: string): string => {
  const value = process.env[key];
  return value ? value.trim() : "";
};

// Debug: Check if API key is loaded
const etherscanKey = getEnv("ETHERSCAN_API_KEY");
if (!etherscanKey && process.env.HARDHAT_NETWORK) {
  console.warn("⚠️  WARNING: ETHERSCAN_API_KEY not found in environment variables");
  console.warn("   Make sure your .env file is in the project root");
}

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    sepolia: {
      url: getEnv("SEPOLIA_RPC") || "",
      accounts: getEnv("DEPLOYER_KEY") ? [getEnv("DEPLOYER_KEY")] : [],
    },
    mainnet: {
      url: getEnv("MAINNET_RPC") || "",
      accounts: getEnv("DEPLOYER_KEY") ? [getEnv("DEPLOYER_KEY")] : [],
    },
    polygon: {
      url: getEnv("POLYGON_RPC") || "",
      accounts: getEnv("DEPLOYER_KEY") ? [getEnv("DEPLOYER_KEY")] : [],
    },
    arbitrum: {
      url: getEnv("ARBITRUM_RPC") || "",
      accounts: getEnv("DEPLOYER_KEY") ? [getEnv("DEPLOYER_KEY")] : [],
    },
    optimism: {
      url: getEnv("OPTIMISM_RPC") || "",
      accounts: getEnv("DEPLOYER_KEY") ? [getEnv("DEPLOYER_KEY")] : [],
    },
    base: {
      url: getEnv("BASE_RPC") || "",
      accounts: getEnv("DEPLOYER_KEY") ? [getEnv("DEPLOYER_KEY")] : [],
    },
  },
  // Etherscan v2 (2025+): use a single apiKey value.
  // Network-specific keys are deprecated and no longer work on Etherscan v1 endpoints.
  etherscan: {
    apiKey: getEnv("ETHERSCAN_API_KEY"),
  },
  sourcify: {
    enabled: true,
  },
};

export default config;
