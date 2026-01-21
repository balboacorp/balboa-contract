# Deployment Guide

## 🚀 Detailed Deployment Instructions

### Prerequisites

1. **Node.js 18+** and **pnpm** installed
2. **.env file** configured with:
   ```bash
   DEPLOYER_KEY=your_private_key_here
   SEPOLIA_RPC=https://1rpc.io/sepolia
   ETHERSCAN_API_KEY=your_etherscan_api_key
   ```
3. **Testnet ETH** for gas fees

---

## Step 1: Deploy the Create2Factory

The factory enables deterministic deployment across all chains.

```bash
pnpm hardhat run scripts/deploy_factory.ts --network sepolia
```

**Output:**
```
CREATE2 Factory deployed to: 0x616a1721ff0783FF6ED4ee8EfC7752aF91260Fa3
```

Save this address:
```bash
echo "FACTORY_ADDRESS=0x616a1721ff0783FF6ED4ee8EfC7752aF91260Fa3" >> .env
```

### Verify Factory (Optional)

```bash
npx hardhat verify --network sepolia 0x616a1721ff0783FF6ED4ee8EfC7752aF91260Fa3
```

---

## Step 2: Deploy BalboaToken

Uses the factory from Step 1 to deploy deterministically.

```bash
pnpm hardhat run scripts/deploy_deterministic.ts --network sepolia
```

**Output:**
```
Implementation: 0x1234...5678
Proxy:          0xABCD...EF01
```

**⚠️ CRITICAL:** Save the **PROXY** address, not the implementation!

```bash
echo "TOKEN_ADDRESS=0xABCD...EF01" >> .env
```

---

## Step 3: Verify Token on Etherscan

### Option A: Via Hardhat (Recommended)

```bash
npx hardhat verify --network sepolia 0xABCD...EF01
```

### Option B: Via Web UI

1. Go to Etherscan
2. Navigate to your proxy address
3. Click "Is this a proxy?" → Yes
4. Enter implementation address
5. Contract code will be verified

---

## Step 4: Distribute Roles

After deployment, the deployer address has all roles. Distribute them:

### Edit Role Assignments

Open `scripts/grant_roles.ts`:

```typescript
const ROLE_ASSIGNMENTS = {
  MINTER: [
    "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",  // Treasury
  ],
  BURNER: [
    "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",  // Compliance
  ],
  PAUSER: [
    "0x1234567890123456789012345678901234567890",  // Security Multi-sig
  ],
  UPGRADER: [
    "0x1234567890123456789012345678901234567890",  // Governance
  ],
  BLACKLISTER: [
    "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",  // Compliance Team
  ],
  ADMIN: [
    "0x1234567890123456789012345678901234567890",  // Multi-sig Wallet
  ],
};
```

### Run Role Grant Script

```bash
npx hardhat run scripts/grant_roles.ts --network sepolia
```

### Verify Role Assignment

```bash
npx hardhat run scripts/check_roles.ts --network sepolia
```

---

## Step 5: Production Checklist

Before mainnet deployment:

### Security
- [ ] Contracts audited by professional firm
- [ ] All tests passing (`pnpm test`)
- [ ] Code reviewed by team members
- [ ] Security audit results addressed

### Configuration
- [ ] Admin address is a multi-sig wallet (3-of-5 minimum)
- [ ] All roles distributed correctly
- [ ] Upgrade timelock planned or implemented
- [ ] Private keys stored securely (hardware wallet)

### Documentation
- [ ] Deployment record created
- [ ] Role assignments documented
- [ ] Emergency procedures documented
- [ ] Monitoring alerts configured

### Verification
- [ ] Contracts verified on Etherscan
- [ ] Token verified on Etherscan
- [ ] Role assignments verified via script
- [ ] Proxy address tested with transfers

---

## Step 6: Testing on Testnet First

### Perform Test Deployment

```bash
# Deploy factory
pnpm hardhat run scripts/deploy_factory.ts --network sepolia

# Update .env with factory address
echo "FACTORY_ADDRESS=0x..." >> .env

# Deploy token
pnpm hardhat run scripts/deploy_deterministic.ts --network sepolia

# Test operations
npx hardhat run scripts/grant_roles.ts --network sepolia
npx hardhat run scripts/check_roles.ts --network sepolia
```

### Test Role Management

Using Hardhat console:

```bash
npx hardhat console --network sepolia

const token = await ethers.getContractAt("BalboaToken", "YOUR_PROXY_ADDRESS")
const minterRole = await token.MINTER_ROLE()
await token.grantRole(minterRole, "0xTestAddress")
```

### Test Minting

```javascript
const token = await ethers.getContractAt("BalboaToken", "YOUR_PROXY_ADDRESS")
await token.mint("0xRecipient", ethers.parseEther("1000"))
```

---

## Troubleshooting

### "Deployer does not have DEFAULT_ADMIN_ROLE"

You're using the implementation address instead of the proxy address.

**Solution:**
```bash
npx hardhat run scripts/find_proxy.ts --network sepolia
# Use the returned PROXY address
```

### "Transaction reverted"

Check:
1. You're using the proxy address (not implementation)
2. You have the required role
3. The token isn't paused
4. You have enough ETH for gas

### "Factory address not found"

Add to `.env`:
```bash
FACTORY_ADDRESS=0x616a1721ff0783FF6ED4ee8EfC7752aF91260Fa3
```

Or deploy a new factory:
```bash
pnpm hardhat run scripts/deploy_factory.ts --network sepolia
```

---

## Mainnet Deployment

### Pre-Mainnet Checklist

- [ ] All testnet tests passed
- [ ] Role distribution plan finalized
- [ ] Multi-sig wallet created and tested
- [ ] Etherscan verification plan ready
- [ ] Communication plan prepared

### Deploy to Mainnet

```bash
# Update .env for mainnet
export MAINNET_RPC=your_mainnet_rpc
export DEPLOYER_KEY=your_key_from_hardware_wallet

# Deploy factory
pnpm hardhat run scripts/deploy_factory.ts --network mainnet

# Deploy token
pnpm hardhat run scripts/deploy_deterministic.ts --network mainnet

# Distribute roles
npx hardhat run scripts/grant_roles.ts --network mainnet
```

### Post-Deployment

1. Verify contracts on Etherscan
2. Verify role assignments
3. Document all addresses
4. Update team with proxy address
5. Monitor contract for issues

---

See [ROLES.md](ROLES.md) for detailed role management information.
