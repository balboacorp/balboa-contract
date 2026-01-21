import { upgrades } from "hardhat";

/**
 * Print the current ERC1967 implementation address for a proxy.
 *
 * Usage:
 *   PROXY_ADDRESS=0x... pnpm hardhat run scripts/get_implementation.ts --network <network>
 */

const PROXY_ADDRESS = process.env.PROXY_ADDRESS || process.env.TOKEN_ADDRESS || "";

async function main() {
  if (!PROXY_ADDRESS) {
    throw new Error("Set PROXY_ADDRESS (or TOKEN_ADDRESS) in environment variables");
  }

  const impl = await upgrades.erc1967.getImplementationAddress(PROXY_ADDRESS);
  console.log("Proxy:", PROXY_ADDRESS);
  console.log("Implementation:", impl);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
