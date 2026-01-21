import { ethers } from "hardhat";

/**
 * Deploy CREATE2 Factory
 * 
 * This factory enables deterministic deployment across chains.
 * Deploy it to the SAME address on all chains for consistent token addresses.
 * 
 * Usage:
 *   npx hardhat run scripts/deploy_factory.ts --network <network>
 * 
 * Note: You can also use Nick's Factory at 0x4e59b44847b379578588920cA78FbF26c0B4956C
 */

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("═══════════════════════════════════════════════════════════");
  console.log("           CREATE2 Factory Deployment");
  console.log("═══════════════════════════════════════════════════════════");
  console.log("\nDeploying with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

  const Factory = await ethers.getContractFactory("Create2Factory");
  const factory = await Factory.deploy();
  await factory.waitForDeployment();

  const factoryAddress = await factory.getAddress();
  
  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("           Deployment Complete!");
  console.log("═══════════════════════════════════════════════════════════");
  console.log("Factory address:", factoryAddress);
  console.log("\nIMPORTANT: Add this to your .env file:");
  console.log(`FACTORY_ADDRESS=${factoryAddress}`);
  console.log("\nFor deterministic deployment across chains:");
  console.log("  1. Deploy this factory to the SAME address on each chain");
  console.log("  2. Use a fresh deployer account with nonce 0");
  console.log("  3. Or use an existing factory like Nick's Factory:");
  console.log("     0x4e59b44847b379578588920cA78FbF26c0B4956C");
  console.log("\nVerify command:");
  console.log(`npx hardhat verify --network <network> ${factoryAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
