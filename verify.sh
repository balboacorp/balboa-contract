#!/bin/bash

# Verify Proxy Contract on Etherscan
# Run: chmod +x verify.sh && ./verify.sh

echo "═══════════════════════════════════════════════════════════"
echo "         Verifying Proxy Contract on Mainnet"
echo "═══════════════════════════════════════════════════════════"

# Implementation address
IMPL="0x41D0ae1Fe14c46e545942F3117BD20ac7660D65F"

# Proxy address
PROXY="0x1199652322677ab830E307938110C5FDb2583b71"

# Initialization data (initialize function call with deployer address)
INIT_DATA="0xc4d66de80000000000000000000000006c79e951a3abd6c7d1b86975c350d3dda769d891"

echo ""
echo "Step 1: Verifying Implementation Contract..."
echo "Address: $IMPL"
npx hardhat verify --network mainnet $IMPL

echo ""
echo "Step 2: Verifying Proxy Contract..."
echo "Address: $PROXY"
echo "Constructor args: $IMPL $INIT_DATA"
npx hardhat verify --network mainnet \
  --contract "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol:ERC1967Proxy" \
  $PROXY $IMPL $INIT_DATA

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "                  Verification Complete!"
echo "═══════════════════════════════════════════════════════════"
echo "Implementation: https://etherscan.io/address/$IMPL#code"
echo "Proxy:          https://etherscan.io/address/$PROXY#code"
