import { ethers } from "hardhat";

/**
 * Grant roles to specified addresses
 * 
 * This script helps distribute roles after deployment.
 * Edit the ROLE_ASSIGNMENTS section below with your desired addresses.
 * 
 * Usage:
 *   npx hardhat run scripts/grant_roles.ts --network sepolia
 * 
 * Note: The account running this script must have DEFAULT_ADMIN_ROLE
 */

// ============================================================================
// CONFIGURATION - Edit these addresses
// ============================================================================

const TOKEN_ADDRESS = process.env.TOKEN_ADDRESS || ""; // Your proxy address

const ROLE_ASSIGNMENTS = {
  // Grant MINTER_ROLE to these addresses
  MINTER: [
    "0x6C79e951a3aBD6c7d1B86975C350d3DdA769d891",
  ],
  
  // Grant BURNER_ROLE to these addresses
  BURNER: [
    "0x6C79e951a3aBD6c7d1B86975C350d3DdA769d891",
  ],
  
  // Grant PAUSER_ROLE to these addresses
  PAUSER: [
    "0x6C79e951a3aBD6c7d1B86975C350d3DdA769d891",
  ],
  
  // Grant UPGRADER_ROLE to these addresses
  UPGRADER: [
    "0x6C79e951a3aBD6c7d1B86975C350d3DdA769d891",
  ],
  
  // Grant BLACKLISTER_ROLE to these addresses
  BLACKLISTER: [
    "0x6C79e951a3aBD6c7d1B86975C350d3DdA769d891",
  ],
  
  // Grant DEFAULT_ADMIN_ROLE to these addresses (BE CAREFUL!)
  ADMIN: [
    "0x6C79e951a3aBD6c7d1B86975C350d3DdA769d891",
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
  console.log("              Role Management Script");
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
    console.log("\n❌ ERROR: Deployer does not have DEFAULT_ADMIN_ROLE");
    console.log("\nDebugging Information:");
    console.log("─────────────────────────────────────────────────────────");
    console.log("Your address:", deployer.address);
    console.log("Token address:", TOKEN_ADDRESS);
    console.log("\nChecking who has DEFAULT_ADMIN_ROLE...");
    
    // Try to get admin role members (OpenZeppelin AccessControl)
    try {
      const adminCount = await token.getRoleMemberCount(DEFAULT_ADMIN_ROLE);
      console.log(`\nFound ${adminCount} admin(s):`);
      for (let i = 0; i < adminCount; i++) {
        const admin = await token.getRoleMember(DEFAULT_ADMIN_ROLE, i);
        console.log(`  ${i + 1}. ${admin}`);
      }
    } catch (e) {
      console.log("Could not enumerate admins (contract may not support getRoleMember)");
    }
    
    console.log("\n💡 Possible Solutions:");
    console.log("1. Make sure TOKEN_ADDRESS is the PROXY address (not implementation)");
    console.log("2. Use the account that deployed the token");
    console.log("3. Have an existing admin grant DEFAULT_ADMIN_ROLE to this account");
    console.log("4. Check the deployment transaction to see who was set as admin");
    console.log("\n🔍 Verify on Etherscan:");
    console.log(`   https://sepolia.etherscan.io/address/${TOKEN_ADDRESS}#readContract`);
    console.log("   Call hasRole() with:");
    console.log(`   - role: ${DEFAULT_ADMIN_ROLE}`);
    console.log(`   - account: ${deployer.address}`);
    
    throw new Error("Cannot grant roles without DEFAULT_ADMIN_ROLE");
  }

  console.log("\n✓ Deployer has DEFAULT_ADMIN_ROLE");

  // Prepare role assignments
  const roles: RoleInfo[] = [
    { name: "MINTER_ROLE", hash: MINTER_ROLE, addresses: ROLE_ASSIGNMENTS.MINTER },
    { name: "BURNER_ROLE", hash: BURNER_ROLE, addresses: ROLE_ASSIGNMENTS.BURNER },
    { name: "PAUSER_ROLE", hash: PAUSER_ROLE, addresses: ROLE_ASSIGNMENTS.PAUSER },
    { name: "UPGRADER_ROLE", hash: UPGRADER_ROLE, addresses: ROLE_ASSIGNMENTS.UPGRADER },
    { name: "BLACKLISTER_ROLE", hash: BLACKLISTER_ROLE, addresses: ROLE_ASSIGNMENTS.BLACKLISTER },
    { name: "DEFAULT_ADMIN_ROLE", hash: DEFAULT_ADMIN_ROLE, addresses: ROLE_ASSIGNMENTS.ADMIN },
  ];

  // Count total operations
  const totalOps = roles.reduce((sum, role) => sum + role.addresses.length, 0);

  if (totalOps === 0) {
    console.log("\n⚠️  No role assignments configured!");
    console.log("Edit the ROLE_ASSIGNMENTS section in this script to add addresses.");
    return;
  }

  console.log(`\n📋 Planning to grant ${totalOps} role(s)...\n`);

  // Display plan
  for (const role of roles) {
    if (role.addresses.length > 0) {
      console.log(`${role.name}:`);
      for (const address of role.addresses) {
        const hasRole = await token.hasRole(role.hash, address);
        if (hasRole) {
          console.log(`  ✓ ${address} (already has role)`);
        } else {
          console.log(`  → ${address} (will grant)`);
        }
      }
    }
  }

  // Confirmation
  console.log("\n⚠️  Review the above carefully!");
  console.log("Press Ctrl+C to cancel, or wait 5 seconds to proceed...");
  await new Promise(resolve => setTimeout(resolve, 5000));

  console.log("\n🚀 Starting role assignments...\n");

  let grantedCount = 0;
  let skippedCount = 0;

  // Grant roles
  for (const role of roles) {
    for (const address of role.addresses) {
      const hasRole = await token.hasRole(role.hash, address);
      
      if (hasRole) {
        console.log(`⏭️  Skipped: ${address} already has ${role.name}`);
        skippedCount++;
      } else {
        try {
          console.log(`📤 Granting ${role.name} to ${address}...`);
          const tx = await token.grantRole(role.hash, address);
          await tx.wait();
          console.log(`✅ Granted ${role.name} to ${address}`);
          console.log(`   Tx: ${tx.hash}`);
          grantedCount++;
        } catch (error: any) {
          console.error(`❌ Failed to grant ${role.name} to ${address}:`, error.message);
        }
      }
    }
  }

  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("              Role Assignment Complete!");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`\n✅ Granted: ${grantedCount}`);
  console.log(`⏭️  Skipped: ${skippedCount}`);
  console.log(`❌ Failed: ${totalOps - grantedCount - skippedCount}`);

  // Display current role holders
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

  console.log("\n💡 Next Steps:");
  console.log("1. Verify all roles are assigned correctly");
  console.log("2. Consider transferring DEFAULT_ADMIN_ROLE to a multi-sig");
  console.log("3. Run: npx hardhat run scripts/revoke_roles.ts --network sepolia");
  console.log("   to revoke roles from the deployer account if needed");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
