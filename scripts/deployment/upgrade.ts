import { ethers, upgrades } from "hardhat";

/**
 * Upgrade BalboaToken to a new implementation
 * 
 * Usage:
 *   PROXY_ADDRESS=0x... npx hardhat run scripts/upgrade.ts --network <network>
 * 
 * Optional:
 *   CONTRACT_NAME=BalboaTokenV2 # Specify new implementation contract name
 */

const PROXY_ADDRESS = process.env.PROXY_ADDRESS || "";
const CONTRACT_NAME = process.env.CONTRACT_NAME || "BalboaToken";

async function main() {
  if (!PROXY_ADDRESS) {
    throw new Error("Please set PROXY_ADDRESS in environment variable");
  }

  console.log("═══════════════════════════════════════════════════════════");
  console.log("           BalboaToken Upgrade Script");
  console.log("═══════════════════════════════════════════════════════════");
  
  const [deployer] = await ethers.getSigners();
  console.log("\nUpgrading with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");
  console.log("Proxy address:", PROXY_ADDRESS);
  console.log("New implementation:", CONTRACT_NAME);

  // Validate proxy exists
  const proxyCode = await ethers.provider.getCode(PROXY_ADDRESS);
  if (proxyCode === "0x") {
    throw new Error(`No contract found at proxy address: ${PROXY_ADDRESS}`);
  }

  // Attach to existing proxy
  const balboa = await ethers.getContractAt("BalboaToken", PROXY_ADDRESS);
  
  // Validate caller has UPGRADER_ROLE
  console.log("\nValidating permissions...");
  const UPGRADER_ROLE = await balboa.UPGRADER_ROLE();
  const hasRole = await balboa.hasRole(UPGRADER_ROLE, deployer.address);
  if (!hasRole) {
    throw new Error(`Account ${deployer.address} does not have UPGRADER_ROLE`);
  }
  console.log("✓ Caller has UPGRADER_ROLE");

  // Get current implementation
  const currentImpl = await upgrades.erc1967.getImplementationAddress(PROXY_ADDRESS);
  console.log("\nCurrent implementation:", currentImpl);

  // Preflight: validate upgrade safety (storage layout, UUPS compatibility, etc.)
  console.log("\nValidating upgrade compatibility...");
  const NewImplementation = await ethers.getContractFactory(CONTRACT_NAME);
  try {
    await upgrades.validateUpgrade(PROXY_ADDRESS, NewImplementation);
    console.log("✓ Upgrade compatibility check passed");
  } catch (e: any) {
    const message = typeof e?.message === "string" ? e.message : String(e);
    if (message.toLowerCase().includes("forceimport") || message.toLowerCase().includes("not registered")) {
      console.log("⚠️  Proxy not registered in local upgrades manifest; importing...");
      const CurrentImplementation = await ethers.getContractFactory("BalboaToken");
      await upgrades.forceImport(PROXY_ADDRESS, CurrentImplementation, { kind: "uups" });
      console.log("✓ Proxy imported");
      await upgrades.validateUpgrade(PROXY_ADDRESS, NewImplementation);
      console.log("✓ Upgrade compatibility check passed");
    } else {
      throw e;
    }
  }

  // Deploy new implementation
  console.log("\nDeploying new implementation...");
  const upgraded = await upgrades.upgradeProxy(PROXY_ADDRESS, NewImplementation);
  await upgraded.waitForDeployment();
  
  const proxyAddress = await upgraded.getAddress();
  const newImpl = await upgrades.erc1967.getImplementationAddress(proxyAddress);
  
  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("           Upgrade Complete!");
  console.log("═══════════════════════════════════════════════════════════");
  console.log("Proxy address (unchanged):", proxyAddress);
  console.log("Old implementation:", currentImpl);
  console.log("New implementation:", newImpl);

  // Post-upgrade sanity checks
  try {
    const name = await upgraded.name();
    const symbol = await upgraded.symbol();
    console.log("\nToken metadata (post-upgrade):");
    console.log("Name:  ", name);
    console.log("Symbol:", symbol);
  } catch {
    // Non-fatal: keep script output focused; verification can be done separately
  }

  console.log("\nVerify command:");
  console.log(`npx hardhat verify --network <network> ${newImpl}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
