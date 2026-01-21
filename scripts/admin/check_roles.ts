import { ethers } from "hardhat";

/**
 * Check role assignments for a token
 * 
 * This script checks which addresses have which roles.
 * Useful for debugging role-related issues.
 * 
 * Usage:
 *   npx hardhat run scripts/check_roles.ts --network sepolia
 */

const TOKEN_ADDRESS = process.env.TOKEN_ADDRESS || "";

async function main() {
  const [signer] = await ethers.getSigners();

  if (!TOKEN_ADDRESS) {
    throw new Error("TOKEN_ADDRESS not set in .env");
  }

  console.log("═══════════════════════════════════════════════════════════");
  console.log("              Role Checker");
  console.log("═══════════════════════════════════════════════════════════");
  console.log("\nToken address:", TOKEN_ADDRESS);
  console.log("Your address:", signer.address);

  const token = await ethers.getContractAt("BalboaToken", TOKEN_ADDRESS);

  // Get role hashes
  const DEFAULT_ADMIN_ROLE = await token.DEFAULT_ADMIN_ROLE();
  const MINTER_ROLE = await token.MINTER_ROLE();
  const BURNER_ROLE = await token.BURNER_ROLE();
  const PAUSER_ROLE = await token.PAUSER_ROLE();
  const UPGRADER_ROLE = await token.UPGRADER_ROLE();
  const BLACKLISTER_ROLE = await token.BLACKLISTER_ROLE();

  console.log("\n📋 Role Hashes:");
  console.log("DEFAULT_ADMIN_ROLE:", DEFAULT_ADMIN_ROLE);
  console.log("MINTER_ROLE:       ", MINTER_ROLE);
  console.log("BURNER_ROLE:       ", BURNER_ROLE);
  console.log("PAUSER_ROLE:       ", PAUSER_ROLE);
  console.log("UPGRADER_ROLE:     ", UPGRADER_ROLE);
  console.log("BLACKLISTER_ROLE:  ", BLACKLISTER_ROLE);

  console.log("\n🔍 Checking your address:", signer.address);
  console.log("───────────────────────────────────────────────────────────");

  const roles = [
    { name: "DEFAULT_ADMIN_ROLE", hash: DEFAULT_ADMIN_ROLE },
    { name: "MINTER_ROLE", hash: MINTER_ROLE },
    { name: "BURNER_ROLE", hash: BURNER_ROLE },
    { name: "PAUSER_ROLE", hash: PAUSER_ROLE },
    { name: "UPGRADER_ROLE", hash: UPGRADER_ROLE },
    { name: "BLACKLISTER_ROLE", hash: BLACKLISTER_ROLE },
  ];

  for (const role of roles) {
    const hasRole = await token.hasRole(role.hash, signer.address);
    console.log(`${hasRole ? "✅" : "❌"} ${role.name}`);
  }

  // Try to find who has admin role by checking RoleGranted events
  console.log("\n🔎 Searching for admin addresses in events...");
  console.log("(This may take a moment)");
  
  try {
    // Get RoleGranted events for DEFAULT_ADMIN_ROLE
    const filter = token.filters.RoleGranted(DEFAULT_ADMIN_ROLE, null, null);
    const events = await token.queryFilter(filter, 0, "latest");
    
    if (events.length > 0) {
      console.log(`\n✅ Found ${events.length} admin grant event(s):`);
      
      const admins = new Set<string>();
      for (const event of events) {
        const account = event.args?.account;
        if (account) {
          admins.add(account);
        }
      }
      
      console.log("\n👥 Addresses that received DEFAULT_ADMIN_ROLE:");
      for (const admin of admins) {
        const hasRole = await token.hasRole(DEFAULT_ADMIN_ROLE, admin);
        console.log(`  ${hasRole ? "✅" : "❌"} ${admin} ${hasRole ? "(currently has role)" : "(role revoked)"}`);
      }
    } else {
      console.log("❌ No RoleGranted events found for DEFAULT_ADMIN_ROLE");
    }
  } catch (error: any) {
    console.log("⚠️  Could not fetch events:", error.message);
  }

  // Check token name and symbol to verify it's the right contract
  console.log("\n📝 Token Info:");
  try {
    const name = await token.name();
    const symbol = await token.symbol();
    console.log(`Name: ${name}`);
    console.log(`Symbol: ${symbol}`);
  } catch (error: any) {
    console.log("❌ Could not fetch token info - this might not be a valid token address");
  }

  console.log("\n💡 Next Steps:");
  if (await token.hasRole(DEFAULT_ADMIN_ROLE, signer.address)) {
    console.log("✅ You have admin role! You can grant roles using grant_roles.ts");
  } else {
    console.log("1. Check Etherscan for the deployment transaction:");
    console.log(`   https://sepolia.etherscan.io/address/${TOKEN_ADDRESS}`);
    console.log("2. The deployer address should have all roles");
    console.log("3. Update DEPLOYER_KEY in .env with that account's private key");
    console.log("4. Or have that account grant DEFAULT_ADMIN_ROLE to your address");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
