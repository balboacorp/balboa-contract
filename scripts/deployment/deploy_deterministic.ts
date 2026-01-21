import { ethers } from "hardhat";

/**
 * Deploy BalboaToken deterministically using CREATE2
 * 
 * This ensures the same proxy address across all chains.
 * 
 * Prerequisites:
 *   - Factory deployed at FACTORY_ADDRESS (same on all chains)
 *   - FACTORY_ADDRESS set in .env
 * 
 * Usage:
 *   npx hardhat run scripts/deploy_deterministic.ts --network <network>
 */

const SALT_IMPL  = ethers.keccak256(ethers.toUtf8Bytes("BALBOA_IMPL_V1"));
const SALT_PROXY = ethers.keccak256(ethers.toUtf8Bytes("BALBOA_PROXY_V1"));

async function main() {
  const [deployer] = await ethers.getSigners();
  const FACTORY = process.env.FACTORY_ADDRESS;
  
  if (!FACTORY) {
    throw new Error("Missing FACTORY_ADDRESS in .env file");
  }

  console.log("═══════════════════════════════════════════════════════════");
  console.log("           BalboaToken Deterministic Deployment");
  console.log("═══════════════════════════════════════════════════════════");
  console.log("\nDeploying with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");
  console.log("Factory address:", FACTORY);

  // Validate factory exists
  const factoryCode = await ethers.provider.getCode(FACTORY);
  if (factoryCode === "0x") {
    throw new Error(`No factory contract found at ${FACTORY}`);
  }

  const factory = await ethers.getContractAt("Create2Factory", FACTORY);

  // 1) Deploy Implementation
  console.log("\n[1/2] Deploying BalboaToken implementation...");
  const Impl = await ethers.getContractFactory("BalboaToken");
  const implCreation = Impl.bytecode;
  
  const tx1 = await factory.deploy(SALT_IMPL, implCreation);
  await tx1.wait();

  const implBytecodeHash = ethers.keccak256(implCreation);
  const implAddr = ethers.getCreate2Address(FACTORY, SALT_IMPL, implBytecodeHash);
  console.log("✓ Implementation deployed:", implAddr);

  // 2) Deploy Proxy
  console.log("\n[2/2] Deploying ERC1967 Proxy...");
  const initData = Impl.interface.encodeFunctionData("initialize", [deployer.address]);
  
  const Proxy = await ethers.getContractFactory("ERC1967Proxy");
  const proxyCreation = Proxy.bytecode + Proxy.interface.encodeDeploy([implAddr, initData]).slice(2);

  const tx2 = await factory.deploy(SALT_PROXY, proxyCreation);
  await tx2.wait();

  const proxyBytecodeHash = ethers.keccak256(proxyCreation);
  const proxyAddr = ethers.getCreate2Address(FACTORY, SALT_PROXY, proxyBytecodeHash);
  console.log("✓ Proxy deployed:", proxyAddr);

  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("           Deployment Complete!");
  console.log("═══════════════════════════════════════════════════════════");
  console.log("Implementation:", implAddr);
  console.log("Proxy (Token):", proxyAddr);
  console.log("Admin/Roles:", deployer.address);
  console.log("\nThis proxy address will be IDENTICAL on all chains using:");
  console.log("  • Same factory:", FACTORY);
  console.log("  • Same salts (SALT_IMPL, SALT_PROXY)");
  console.log("  • Same compiler settings");
  console.log("  • Same admin address");
  console.log("\nVerify commands:");
  console.log(`npx hardhat verify --network <network> ${implAddr}`);
  console.log(`npx hardhat verify --network <network> ${proxyAddr} ${implAddr} ${initData}`);
  console.log("\nInteract with token:");
  console.log(`const token = await ethers.getContractAt("BalboaToken", "${proxyAddr}");`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
