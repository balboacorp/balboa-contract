import { ethers } from "hardhat";

/**
 * Find the correct proxy address from deployment
 * 
 * This script calculates where your proxy should be deployed
 * based on the factory and salts used in deploy_deterministic.ts
 * 
 * Usage:
 *   npx hardhat run scripts/find_proxy.ts --network sepolia
 */

const SALT_IMPL = ethers.keccak256(ethers.toUtf8Bytes("BALBOA_IMPL_V1"));
const SALT_PROXY = ethers.keccak256(ethers.toUtf8Bytes("BALBOA_PROXY_V1"));

async function main() {
  const [deployer] = await ethers.getSigners();
  const FACTORY = process.env.FACTORY_ADDRESS;

  if (!FACTORY) {
    throw new Error("FACTORY_ADDRESS not set in .env");
  }

  console.log("═══════════════════════════════════════════════════════════");
  console.log("           Finding Your Proxy Address");
  console.log("═══════════════════════════════════════════════════════════");
  console.log("\nFactory:", FACTORY);
  console.log("Deployer:", deployer.address);

  // Get implementation bytecode
  const Impl = await ethers.getContractFactory("BalboaToken");
  const implCreation = Impl.bytecode;
  const implBytecodeHash = ethers.keccak256(implCreation);
  const implAddr = ethers.getCreate2Address(FACTORY, SALT_IMPL, implBytecodeHash);

  console.log("\n📍 Implementation Address:", implAddr);

  // Get proxy bytecode
  const initData = Impl.interface.encodeFunctionData("initialize", [deployer.address]);
  const Proxy = await ethers.getContractFactory("ERC1967Proxy");
  const proxyCreation = Proxy.bytecode + Proxy.interface.encodeDeploy([implAddr, initData]).slice(2);
  const proxyBytecodeHash = ethers.keccak256(proxyCreation);
  const proxyAddr = ethers.getCreate2Address(FACTORY, SALT_PROXY, proxyBytecodeHash);

  console.log("📍 Proxy Address (YOUR TOKEN):", proxyAddr);

  // Check if they exist on-chain
  const implCode = await ethers.provider.getCode(implAddr);
  const proxyCode = await ethers.provider.getCode(proxyAddr);

  console.log("\n✅ Deployment Status:");
  console.log("Implementation:", implCode !== "0x" ? "✅ Deployed" : "❌ Not deployed");
  console.log("Proxy:         ", proxyCode !== "0x" ? "✅ Deployed" : "❌ Not deployed");

  if (proxyCode !== "0x") {
    // Verify it's the right proxy
    const token = await ethers.getContractAt("BalboaToken", proxyAddr);
    try {
      const name = await token.name();
      const symbol = await token.symbol();
      const hasRole = await token.hasRole(await token.DEFAULT_ADMIN_ROLE(), deployer.address);
      
      console.log("\n📝 Token Info:");
      console.log("Name:  ", name);
      console.log("Symbol:", symbol);
      console.log("\n🔐 Your Role Status:");
      console.log(hasRole ? "✅ You have DEFAULT_ADMIN_ROLE" : "❌ You DON'T have DEFAULT_ADMIN_ROLE");
      
      if (hasRole) {
        console.log("\n🎉 SUCCESS! This is the correct proxy address.");
        console.log("\n📝 Update your .env:");
        console.log(`TOKEN_ADDRESS=${proxyAddr}`);
      } else {
        console.log("\n⚠️  Proxy deployed but you don't have admin role.");
        console.log("This might mean someone else deployed it or initialization failed.");
      }
    } catch (error: any) {
      console.log("\n❌ Error reading token:", error.message);
    }
  } else {
    console.log("\n❌ Proxy not deployed yet!");
    console.log("Run: pnpm hardhat run scripts/deploy_deterministic.ts --network sepolia");
  }

  // Check what's at the address in .env
  const envTokenAddress = process.env.TOKEN_ADDRESS;
  if (envTokenAddress && envTokenAddress !== proxyAddr) {
    console.log("\n⚠️  WARNING: Your .env has a different address!");
    console.log("Current TOKEN_ADDRESS:", envTokenAddress);
    console.log("Expected PROXY:      ", proxyAddr);
    
    const envCode = await ethers.provider.getCode(envTokenAddress);
    if (envCode !== "0x") {
      try {
        const token = await ethers.getContractAt("BalboaToken", envTokenAddress);
        const name = await token.name();
        console.log("\nToken at .env address name:", name || "(empty - likely implementation)");
        
        if (!name) {
          console.log("❌ This is the IMPLEMENTATION, not the PROXY!");
          console.log(`\n✅ SOLUTION: Update TOKEN_ADDRESS to ${proxyAddr}`);
        }
      } catch (e) {
        console.log("Cannot read token at .env address");
      }
    }
  }

  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("Etherscan Links:");
  console.log(`Implementation: https://sepolia.etherscan.io/address/${implAddr}`);
  console.log(`Proxy (Token):  https://sepolia.etherscan.io/address/${proxyAddr}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
