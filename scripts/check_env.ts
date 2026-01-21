import * as dotenv from "dotenv";

dotenv.config();

console.log("Environment Variable Check");
console.log("═".repeat(60));

const requiredVars = [
  "DEPLOYER_KEY",
  "MAINNET_RPC",
  "FACTORY_ADDRESS",
  "TOKEN_ADDRESS",
  "ETHERSCAN_API_KEY"
];

for (const varName of requiredVars) {
  const value = process.env[varName];
  if (value) {
    if (varName === "DEPLOYER_KEY") {
      console.log(`✓ ${varName}: ***${value.slice(-4)}`);
    } else if (varName === "ETHERSCAN_API_KEY") {
      console.log(`✓ ${varName}: ***${value.slice(-4)}`);
    } else {
      console.log(`✓ ${varName}: ${value}`);
    }
  } else {
    console.log(`❌ ${varName}: NOT FOUND`);
  }
}

console.log("\nHardhat Config Check");
console.log("═".repeat(60));
import { HardhatUserConfig } from "hardhat/config";
import config from "../hardhat.config";

const typedConfig = config as HardhatUserConfig;
console.log("Etherscan API Keys in config:");
if (typedConfig.etherscan?.apiKey) {
  const apiKeyValue = typedConfig.etherscan.apiKey as any;
  if (typeof apiKeyValue === "string") {
    console.log("  apiKey:", apiKeyValue ? "***" + apiKeyValue.slice(-4) : "NOT SET");
  } else {
    console.log("  mainnet:", apiKeyValue.mainnet ? "***" + apiKeyValue.mainnet.slice(-4) : "NOT SET");
    console.log("  sepolia:", apiKeyValue.sepolia ? "***" + apiKeyValue.sepolia.slice(-4) : "NOT SET");
  }
}
