import { ethers } from "hardhat";

/**
 * Revoke roles from specified addresses
 * 
 * This script helps remove roles after they've been distributed.
 * Useful for revoking roles from the deployer after transferring to multi-sig.
 * 
 * Usage:
 *   npx hardhat run scripts/revoke_roles.ts --network sepolia
 * 
 * Note: The account running this script must have DEFAULT_ADMIN_ROLE
 */

// ============================================================================
// CONFIGURATION - Edit these addresses
// ============================================================================

const TOKEN_ADDRESS = process.env.TOKEN_ADDRESS || ""; // Your proxy address

const ROLE_REVOCATIONS = {
  // Revoke MINTER_ROLE from these addresses
  MINTER: [
    // "0x1234567890123456789012345678901234567890",
  ],
  
  // Revoke BURNER_ROLE from these addresses
  BURNER: [
    // "0x1234567890123456789012345678901234567890",
  ],
  
  // Revoke PAUSER_ROLE from these addresses
  PAUSER: [
    // "0x1234567890123456789012345678901234567890",
  ],
  
  // Revoke UPGRADER_ROLE from these addresses
  UPGRADER: [
    // "0x1234567890123456789012345678901234567890",
  ],
  
  // Revoke BLACKLISTER_ROLE from these addresses
  BLACKLISTER: [
    // "0x1234567890123456789012345678901234567890",
  ],
  
  // Revoke DEFAULT_ADMIN_ROLE from these addresses (BE VERY CAREFUL!)
  // Make sure at least one address will retain admin access!
  ADMIN: [
    // "0x1234567890123456789012345678901234567890",
  ],
};

// ============================================================================
// Script Logic - Do not edit below unless you know what you're doing
// ============================================================================

interface RoleInfo {
  name: string;
  hash: string;
  addresses: string[];
}

async function main() {
  const [deployer] = await ethers.getSigners();

  if (!TOKEN_ADDRESS) {
    throw new Error("TOKEN_ADDRESS not set. Set it in .env or edit this script.");
  }

  console.log("═══════════════════════════════════════════════════════════");
  console.log("           Role Revocation Script");
  console.log("═══════════════════════════════════════════════════════════");
  console.log("\nExecuting with account:", deployer.address);
  console.log("Token address:", TOKEN_ADDRESS);

  // Get contract instance
  const token = await ethers.getContractAt("BalboaToken", TOKEN_ADDRESS);

  // Get all role hashes
  const DEFAULT_ADMIN_ROLE = await token.DEFAULT_ADMIN_ROLE();
  const MINTER_ROLE = await token.MINTER_ROLE();
  const BURNER_ROLE = await token.BURNER_ROLE();
  const PAUSER_ROLE = await token.PAUSER_ROLE();
  const UPGRADER_ROLE = await token.UPGRADER_ROLE();
  const BLACKLISTER_ROLE = await token.BLACKLISTER_ROLE();

  // Check if deployer has admin role
  const hasAdminRole = await token.hasRole(DEFAULT_ADMIN_ROLE, deployer.address);
  if (!hasAdminRole) {
    throw new Error("Deployer does not have DEFAULT_ADMIN_ROLE. Cannot revoke roles.");
  }

  console.log("\n✓ Deployer has DEFAULT_ADMIN_ROLE");

  // Prepare role revocations
  const roles: RoleInfo[] = [
    { name: "MINTER_ROLE", hash: MINTER_ROLE, addresses: ROLE_REVOCATIONS.MINTER },
    { name: "BURNER_ROLE", hash: BURNER_ROLE, addresses: ROLE_REVOCATIONS.BURNER },
    { name: "PAUSER_ROLE", hash: PAUSER_ROLE, addresses: ROLE_REVOCATIONS.PAUSER },
    { name: "UPGRADER_ROLE", hash: UPGRADER_ROLE, addresses: ROLE_REVOCATIONS.UPGRADER },
    { name: "BLACKLISTER_ROLE", hash: BLACKLISTER_ROLE, addresses: ROLE_REVOCATIONS.BLACKLISTER },
    { name: "DEFAULT_ADMIN_ROLE", hash: DEFAULT_ADMIN_ROLE, addresses: ROLE_REVOCATIONS.ADMIN },
  ];

  // Count total operations
  const totalOps = roles.reduce((sum, role) => sum + role.addresses.length, 0);

  if (totalOps === 0) {
    console.log("\n⚠️  No role revocations configured!");
    console.log("Edit the ROLE_REVOCATIONS section in this script to add addresses.");
    return;
  }

  console.log(`\n📋 Planning to revoke ${totalOps} role(s)...\n`);

  // Display plan
  for (const role of roles) {
    if (role.addresses.length > 0) {
      console.log(`${role.name}:`);
      for (const address of role.addresses) {
        const hasRole = await token.hasRole(role.hash, address);
        if (!hasRole) {
          console.log(`  ✓ ${address} (doesn't have role)`);
        } else {
          console.log(`  → ${address} (will revoke)`);
        }
      }
    }
  }

  // Confirmation
  console.log("\n⚠️  WARNING: Review the above carefully!");
  console.log("🔴 Revoking DEFAULT_ADMIN_ROLE can lock you out permanently!");
  console.log("Press Ctrl+C to cancel, or wait 10 seconds to proceed...");
  await new Promise(resolve => setTimeout(resolve, 10000));

  console.log("\n🚀 Starting role revocations...\n");

  let revokedCount = 0;
  let skippedCount = 0;

  // Revoke roles
  for (const role of roles) {
    for (const address of role.addresses) {
      const hasRole = await token.hasRole(role.hash, address);
      
      if (!hasRole) {
        console.log(`⏭️  Skipped: ${address} doesn't have ${role.name}`);
        skippedCount++;
      } else {
        try {
          console.log(`📤 Revoking ${role.name} from ${address}...`);
          const tx = await token.revokeRole(role.hash, address);
          await tx.wait();
          console.log(`✅ Revoked ${role.name} from ${address}`);
          console.log(`   Tx: ${tx.hash}`);
          revokedCount++;
        } catch (error: any) {
          console.error(`❌ Failed to revoke ${role.name} from ${address}:`, error.message);
        }
      }
    }
  }

  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("           Role Revocation Complete!");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`\n✅ Revoked: ${revokedCount}`);
  console.log(`⏭️  Skipped: ${skippedCount}`);
  console.log(`❌ Failed: ${totalOps - revokedCount - skippedCount}`);

  // Display current role holders for verification
  console.log("\n📊 Current Role Summary:");
  for (const role of roles) {
    console.log(`\n${role.name}:`);
    const allAddresses = [...new Set([...role.addresses, deployer.address])];
    for (const address of allAddresses) {
      const hasRole = await token.hasRole(role.hash, address);
      if (hasRole) {
        console.log(`  ✓ ${address}`);
      }
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
