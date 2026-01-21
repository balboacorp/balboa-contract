import { ethers, run } from "hardhat";

/**
 * Verify Proxy Contract on Etherscan
 * 
 * This script verifies the ERC1967 proxy contract with the correct constructor arguments.
 * 
 * Usage:
 *   npx hardhat run scripts/verify_proxy.ts --network <network>
 * 
 * Make sure TOKEN_ADDRESS in .env is set to the PROXY address (not implementation)
 */

const SALT_IMPL  = ethers.keccak256(ethers.toUtf8Bytes("BALBOA_IMPL_V1"));
const SALT_PROXY = ethers.keccak256(ethers.toUtf8Bytes("BALBOA_PROXY_V1"));

async function main() {
  const [deployer] = await ethers.getSigners();
  const FACTORY = process.env.FACTORY_ADDRESS;
  const TOKEN_ADDRESS = process.env.TOKEN_ADDRESS;
  
  if (!FACTORY) {
    throw new Error("Missing FACTORY_ADDRESS in .env file");
  }
  
  if (!TOKEN_ADDRESS) {
    throw new Error("Missing TOKEN_ADDRESS in .env file - set this to your PROXY address");
  }

  console.log("═══════════════════════════════════════════════════════════");
  console.log("              Proxy Contract Verification");
  console.log("═══════════════════════════════════════════════════════════");
  console.log("\nProxy address:", TOKEN_ADDRESS);
  console.log("Factory address:", FACTORY);
  console.log("Deployer address:", deployer.address);
  
  // Check API key
  const apiKey = process.env.ETHERSCAN_API_KEY;
  if (!apiKey) {
    console.error("\n❌ ERROR: ETHERSCAN_API_KEY not found in .env file");
    console.log("Please add your Etherscan API key to .env:");
    console.log("ETHERSCAN_API_KEY=your_api_key_here");
    console.log("\nGet your API key from: https://etherscan.io/myapikey");
    throw new Error("Missing ETHERSCAN_API_KEY");
  }
  console.log("✓ Etherscan API key found:", "***" + apiKey.slice(-4));

  // Calculate implementation address
  const Impl = await ethers.getContractFactory("BalboaToken");
  const implCreation = Impl.bytecode;
  const implBytecodeHash = ethers.keccak256(implCreation);
  const implAddr = ethers.getCreate2Address(FACTORY, SALT_IMPL, implBytecodeHash);
  
  console.log("\nCalculated implementation:", implAddr);

  // Calculate initialization data
  const initData = Impl.interface.encodeFunctionData("initialize", [deployer.address]);
  console.log("Initialization data:", initData);

  // Verify implementation first
  console.log("\n[1/2] Verifying implementation contract...");
  try {
    await run("verify:verify", {
      address: implAddr,
      constructorArguments: [],
    });
    console.log("✓ Implementation verified");
  } catch (error: any) {
    if (error.message.includes("Already Verified")) {
      console.log("✓ Implementation already verified");
    } else {
      console.error("Implementation verification failed:", error.message);
    }
  }

  // Verify proxy with constructor arguments
  console.log("\n[2/2] Verifying proxy contract...");
  try {
    await run("verify:verify", {
      address: TOKEN_ADDRESS,
      constructorArguments: [implAddr, initData],
      contract: "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol:ERC1967Proxy"
    });
    console.log("✓ Proxy verified");
  } catch (error: any) {
    if (error.message.includes("Already Verified")) {
      console.log("✓ Proxy already verified");
    } else {
      console.error("\n❌ Proxy verification failed:", error.message);
      console.log("\n💡 Try manual verification:");
      console.log("1. Go to Etherscan proxy page");
      console.log("2. Click 'Contract' tab");
      console.log("3. Click 'Verify and Publish'");
      console.log("4. Select 'Solidity (Standard JSON Input)'");
      console.log("5. Contract address:", TOKEN_ADDRESS);
      console.log("6. Compiler:", "v0.8.24+commit.e11b9ed9");
      console.log("7. Contract name: @openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol:ERC1967Proxy");
      console.log("8. Constructor arguments (ABI-encoded):");
      
      // Encode constructor arguments
      const abiCoder = ethers.AbiCoder.defaultAbiCoder();
      const encodedArgs = abiCoder.encode(
        ["address", "bytes"],
        [implAddr, initData]
      ).slice(2); // Remove 0x prefix
      
      console.log(encodedArgs);
    }
  }

  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("              Verification Complete!");
  console.log("═══════════════════════════════════════════════════════════");
  console.log("\nEtherscan Links:");
  const network = await ethers.provider.getNetwork();
  const explorer = getExplorerUrl(Number(network.chainId));
  console.log(`Implementation: ${explorer}/address/${implAddr}#code`);
  console.log(`Proxy (Token):  ${explorer}/address/${TOKEN_ADDRESS}#code`);
  
  console.log("\n✨ After verification, you can:");
  console.log("   • Read proxy as implementation on Etherscan");
  console.log("   • Interact with token functions directly");
  console.log("   • Users will see verified source code");
}

function getExplorerUrl(chainId: number): string {
  const explorers: { [key: number]: string } = {
    1: "https://etherscan.io",
    11155111: "https://sepolia.etherscan.io",
    137: "https://polygonscan.com",
    42161: "https://arbiscan.io",
    10: "https://optimistic.etherscan.io",
    8453: "https://basescan.org",
  };
  return explorers[chainId] || "https://etherscan.io";
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
