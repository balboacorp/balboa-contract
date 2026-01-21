# BALBOA Token

A production-ready UUPS upgradeable ERC20 token with deterministic cross-chain deployment using CREATE2.

## 🌟 Features

- **UUPS Upgradeable**: Gas-efficient proxy pattern with upgradeable logic
- **Deterministic Deployment**: Identical address across all chains via CREATE2
- **Role-Based Access Control**: Granular permissions for different operations
- **Pausable**: Emergency stop mechanism for all transfers
- **Blacklist**: Compliance feature to block malicious addresses
- **Reentrancy Protection**: Safe from reentrancy attacks
- **Battle-Tested**: Built with OpenZeppelin's audited contracts

---

## 📦 Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Set up environment variables
cp .env.example .env
# Edit .env with your values

# 3. Compile contracts
pnpm compile

# 4. Run tests
pnpm test

# 5. Deploy factory (first time only)
pnpm hardhat run scripts/deploy_factory.ts --network sepolia
# pnpm hardhat run scripts/deploy_factory.ts --network mainnet

# 6. Update .env with FACTORY_ADDRESS from step 5

# 7. Deploy token
pnpm hardhat run scripts/deploy_deterministic.ts --network sepolia
# pnpm hardhat run scripts/deploy_deterministic.ts --network mainnet
```

---

## 🚀 Deployment

### 1. Configure Environment

Fill in your `.env` file with required values:

```bash
# Required for deployment
DEPLOYER_KEY=your_private_key_here          # Get from MetaMask
SEPOLIA_RPC=https://1rpc.io/sepolia         # Or use Alchemy/Infura
FACTORY_ADDRESS=                             # Set after deploying factory

# Optional but recommended
ETHERSCAN_API_KEY=your_etherscan_api_key    # For contract verification
```

### 2. Deploy Factory (First Time Only)

```bash
# Deploy the CREATE2 factory
pnpm hardhat run scripts/deploy_factory.ts --network sepolia

# Copy the factory address to FACTORY_ADDRESS in .env
# Factory address: 0x616a1721ff0783FF6ED4ee8EfC7752aF91260Fa3
```

### 3. Verify Factory (Optional)

```bash
npx hardhat verify --network sepolia <FACTORY_ADDRESS>
```

### 4. Deploy Token

```bash
# Deploy BalboaToken using the factory
pnpm hardhat run scripts/deploy_deterministic.ts --network sepolia

# ⚠️ IMPORTANT: Save the PROXY address from the output!
# The script outputs two addresses:
#   - Implementation: 0x... (don't use this!)
#   - Proxy (Token): 0x... (USE THIS ONE!)
```

**🔴 Critical: Use the PROXY address, not the Implementation!**

The deployment creates TWO contracts:
- **Implementation**: Contains the logic (never use this address)
- **Proxy**: Your actual token (use this for all interactions)

Add the PROXY address to your `.env`:
```bash
TOKEN_ADDRESS=0xYourProxyAddressHere
```

### 5. Verify Your Deployment

If you're unsure which address to use, run:

```bash
npx hardhat run scripts/find_proxy.ts --network sepolia
```

This will show you:
- ✅ The correct proxy address
- ✅ Whether you have admin rights
- ✅ Token name and symbol verification

Or check roles manually:

```bash
npx hardhat run scripts/check_roles.ts --network sepolia
```

### 6. Verify Contracts on Etherscan

```bash
# Verify implementation
npx hardhat verify --network sepolia <IMPLEMENTATION_ADDRESS>
Make sure TOKEN_ADDRESS in .env is the PROXY address (not implementation!)
# Run this to verify: npx hardhat run scripts/find_proxy.ts --network sepolia
npx hardhat verify --network sepolia <PROXY_ADDRESS> <IMPLEMENTATION_ADDRESS> <INIT_DATA>
```

### 7. Upgrade Contract (When Needed)

```bash
pnpm hardhat run scripts/upgrade.ts --network sepolia
```

**Note**: The deployer account automatically becomes the admin with all roles on the PROXY. For production, transfer roles to a multi-sig wallet after deployment.

---

## 🔐 Access Control Roles

| Role | Description | Critical Operations |
|------|-------------|---------------------|
| `DEFAULT_ADMIN_ROLE` | Master admin role | Manages all other roles |
| `MINTER_ROLE` | Can create tokens | `mint()` |
| `BURNER_ROLE` | Can destroy tokens | `burn()` |
| `PAUSER_ROLE` | Emergency controls | `pause()`, `unpause()` |
| `UPGRADER_ROLE` | Can upgrade contract | `upgradeTo()` |
| `BLACKLISTER_ROLE` | Compliance officer | `blacklist()`, `unBlacklist()` |

### Managing Roles

After deployment, the deployer account has all roles. You should distribute these roles to appropriate addresses:

#### Using Scripts (Recommended)

The easiest way to manage roles in bulk:

```bash
# 1. Add TOKEN_ADDRESS to .env
echo "TOKEN_ADDRESS=0xYourProxyAddress" >> .env

# 2. Edit scripts/grant_roles.ts with your addresses
nano scripts/grant_roles.ts

# 3. Run the grant script
npx hardhat run scripts/grant_roles.ts --network sepolia

# 4. (Optional) Revoke roles from deployer
# Edit scripts/revoke_roles.ts then run:
npx hardhat run scripts/revoke_roles.ts --network sepolia
```

**Example configuration in grant_roles.ts:**
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

#### Using Hardhat Console

```bash
# Connect to the network
npx hardhat console --network sepolia

# Get the token contract
const token = await ethers.getContractAt("BalboaToken", "YOUR_PROXY_ADDRESS")

# Get role hashes
const MINTER_ROLE = await token.MINTER_ROLE()
const BURNER_ROLE = await token.BURNER_ROLE()
const PAUSER_ROLE = await token.PAUSER_ROLE()
const UPGRADER_ROLE = await token.UPGRADER_ROLE()
const BLACKLISTER_ROLE = await token.BLACKLISTER_ROLE()

# Grant role to an address
await token.grantRole(MINTER_ROLE, "0xNewMinterAddress")

# Revoke role from an address
await token.revokeRole(MINTER_ROLE, "0xOldMinterAddress")

# Check if address has role
await token.hasRole(MINTER_ROLE, "0xAddressToCheck")

# Renounce your own role (be careful with DEFAULT_ADMIN_ROLE!)
await token.renounceRole(MINTER_ROLE, "YOUR_ADDRESS")
```

#### Using Etherscan (After Verification)

1. Go to your contract on Etherscan
2. Navigate to "Contract" → "Write Contract"
3. Connect your wallet (must have DEFAULT_ADMIN_ROLE)
4. Use `grantRole` function:
   - `role`: Use the role hash (e.g., for MINTER_ROLE: `0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6`)
   - `account`: Address to grant the role to
5. Confirm the transaction

#### Role Hashes (Constants)

```solidity
DEFAULT_ADMIN_ROLE = 0x0000000000000000000000000000000000000000000000000000000000000000
MINTER_ROLE        = keccak256("MINTER_ROLE")
BURNER_ROLE        = keccak256("BURNER_ROLE")
PAUSER_ROLE        = keccak256("PAUSER_ROLE")
UPGRADER_ROLE      = keccak256("UPGRADER_ROLE")
BLACKLISTER_ROLE   = keccak256("BLACKLISTER_ROLE")
```

#### Production Best Practices

**⚠️ Critical Steps After Deployment:**

1. **Transfer Admin to Multi-Sig**: 
   ```javascript
   await token.grantRole(DEFAULT_ADMIN_ROLE, MULTISIG_ADDRESS)
   await token.renounceRole(DEFAULT_ADMIN_ROLE, DEPLOYER_ADDRESS)
   ```

2. **Distribute Roles Separately**:
   - MINTER_ROLE → Treasury or mint controller
   - BURNER_ROLE → Compliance officer
   - PAUSER_ROLE → Security team multi-sig
   - UPGRADER_ROLE → Governance or timelock controller
   - BLACKLISTER_ROLE → Compliance team

3. **Verify Role Assignment**:
   ```javascript
   // Check all roles are assigned correctly
   await token.hasRole(MINTER_ROLE, TREASURY_ADDRESS)
   await token.hasRole(DEFAULT_ADMIN_ROLE, MULTISIG_ADDRESS)
   ```

4. **Document All Role Holders**:
   Keep a secure record of which addresses hold which roles and why.

---

## 🏗️ Architecture

### Contracts

#### BalboaToken.sol
Main UUPS upgradeable ERC20 token with:
- Standard ERC20 functionality
- Role-based access control
- Pausable transfers
- Blacklist mechanism
- Self-burning capability

#### Create2Factory.sol
Deterministic deployment factory:
- Deploys contracts to same address on all chains
- Owner-controlled deployment
- Prevents duplicate deployments
- Emits deployment events

---

## 🧪 Testing

### Test Coverage

#### BalboaToken Tests
✅ **Initialization**: Verify proper setup and role assignment  
✅ **Minting**: Only MINTER_ROLE can mint, zero address checks  
✅ **Burning**: Only BURNER_ROLE can burn, self-burn functionality  
✅ **Pausing**: Emergency pause/unpause controls  
✅ **Blacklist**: Block/unblock addresses, prevent transfers  
✅ **Upgradability**: UUPS upgrade authorization  
✅ **Access Control**: Role management and permissions  
✅ **Security**: Reentrancy, zero amount checks

#### Create2Factory Tests
✅ **Deterministic Deployment**: Same address with same salt  
✅ **Duplicate Prevention**: Cannot deploy twice with same salt  
✅ **Owner Controls**: Only owner can deploy  
✅ **Event Emission**: Proper event logging

### Run Tests

```bash
# Run all tests
pnpm hardhat test

# Run with coverage
pnpm hardhat coverage

# Run with gas reporting
REPORT_GAS=true pnpm hardhat test
```

---

## 🔒 Security Considerations

### Risk Assessment: **LOW-MEDIUM**

The contracts follow security best practices but require proper configuration:

### ✅ Security Features Implemented

| Feature | Status | Notes |
|---------|--------|-------|
| Reentrancy Protection | ✅ | `nonReentrant` on all state-changing functions |
| Access Control | ✅ | OpenZeppelin's AccessControl pattern |
| Pausable | ✅ | Emergency stop for all transfers |
| Input Validation | ✅ | Zero address/amount checks |
| Safe Math | ✅ | Solidity 0.8+ built-in overflow protection |
| UUPS Pattern | ✅ | Storage-safe upgrades |
| Storage Gap | ✅ | 49 slots reserved for future upgrades |

### ⚠️ Important Security Considerations

#### 1. Burn Function Design (HIGH - By Design)
The `burn(address from, uint256 amount)` function allows BURNER_ROLE to burn tokens from any address without approval. This is intentional for regulatory compliance but requires:
- ✅ BURNER_ROLE held by trusted multi-sig or governance
- ✅ Clear documentation of this behavior
- ⚠️ Consider adding rate limits or timelock

#### 2. Centralization Risk (MEDIUM)
Single admin receives all roles during initialization:
- 🔴 **Critical**: Use multi-sig wallet (Gnosis Safe) as admin in production
- 🔴 **Critical**: Distribute roles to different addresses
- ⚠️ Recommended: 3-of-5 or 2-of-3 multi-sig setup

#### 3. No Upgrade Timelock (MEDIUM)
Upgrades can happen immediately:
- ⚠️ **Before Mainnet**: Implement 48-hour timelock for upgrades
- ⚠️ **Before Mainnet**: Add community notification mechanism
- ⚠️ Consider using OpenZeppelin's TimelockController

#### 4. No Mint Rate Limiting (MEDIUM)
Unlimited minting possible with MINTER_ROLE:
- ⚠️ Consider adding per-transaction limits
- ⚠️ Consider adding daily/weekly limits
- ⚠️ Implement monitoring and alerts

---

## 📋 Pre-Deployment Checklist

Before deploying to mainnet:

### Critical
- [ ] Admin address is a multi-sig wallet (3-of-5 minimum)
- [ ] All roles distributed to appropriate addresses
- [ ] Upgrade timelock implemented or planned
- [ ] DEPLOYER_KEY stored securely (hardware wallet preferred)
- [ ] .env file never committed to git (.gitignore verified)

### Important  
- [ ] Contracts audited by professional third party
- [ ] Emergency response plan documented
- [ ] Monitoring and alerting configured
- [ ] Team training on emergency procedures
- [ ] Contract verified on Etherscan
- [ ] Documentation published

### Recommended
- [ ] Testnet deployment completed and tested
- [ ] Upgrade procedure tested on testnet
- [ ] Role management procedures documented
- [ ] Communication plan for upgrades
- [ ] Bug bounty program established

---

## 📚 Key Functions

### For Token Holders

```solidity
// Transfer tokens
transfer(address to, uint256 amount)

// Approve spending
approve(address spender, uint256 amount)

// Burn your own tokens
burnSelf(uint256 amount)
```

### For Admins

```solidity
// Minting (MINTER_ROLE)
mint(address to, uint256 amount)

// Burning (BURNER_ROLE)
burn(address from, uint256 amount)

// Pause controls (PAUSER_ROLE)
pause()
unpause()

// Blacklist (BLACKLISTER_ROLE)
blacklist(address account)
unBlacklist(address account)

// Upgrades (UPGRADER_ROLE)
upgradeTo(address newImplementation)
```

---

## 🛠️ Development

### Project Structure

```
balboa-contract-2/
├── contracts/
│   ├── BalboaToken.sol              # Main UUPS upgradeable ERC20
│   └── Create2Factory.sol           # CREATE2 deployment factory
├── scripts/
│   ├── deploy_factory.ts            # Deploy factory first
│   ├── deploy_deterministic.ts      # Deploy token via factory
│   ├── upgrade.ts                   # Upgrade implementation
│   ├── grant_roles.ts               # Grant roles to addresses
│   ├── revoke_roles.ts              # Revoke roles from addresses
│   ├── find_proxy.ts                # Find correct proxy address
│   ├── check_roles.ts               # Check role assignments
│   └── run-security-audit.sh        # Security audit script
├── test/
│   ├── BalboaToken.complete.test.ts # Comprehensive token tests
│   └── Create2Factory.security.test.ts  # Factory security tests
├── .env                             # Your private configuration
├── .env.example                     # Example configuration
├── hardhat.config.ts                # Hardhat configuration
├── package.json                     # Dependencies and scripts
└── README.md                        # This file
```

### Available Scripts

```bash
pnpm compile      # Compile contracts
pnpm test         # Run tests
pnpm deploy       # Deploy token (requires factory)
pnpm upgrade      # Upgrade implementation
pnpm lint         # Lint Solidity files
pnpm lint:fix     # Lint and auto-fix Solidity files
pnpm format       # Format all code (contracts, tests, scripts)

# Role management scripts (add TOKEN_ADDRESS to .env first)
npx hardhat run scripts/grant_roles.ts --network sepolia
npx hardhat run scripts/revoke_roles.ts --network sepolia

# Diagnostic/utility scripts
npx hardhat run scripts/find_proxy.ts --network sepolia
npx hardhat run scripts/check_roles.ts --network sepolia
```

---

## 🔧 Troubleshooting

### "Deployer does not have DEFAULT_ADMIN_ROLE"

**Problem**: You're using the implementation address instead of the proxy address.

**Solution**:
```bash
# Find the correct proxy address
npx hardhat run scripts/find_proxy.ts --network sepolia

# Update TOKEN_ADDRESS in .env with the PROXY address
```

**Why this happens**: UUPS upgradeable tokens have two addresses:
- **Implementation** (0x41d0ae...): Contains code, NOT initialized, NO roles
- **Proxy** (0xABCDEF...): Your actual token, initialized with YOUR roles

Always use the **PROXY** address for interactions!

### "Token name/symbol is empty"

This confirms you're using the implementation address. See solution above.

### "Cannot find admin address"

```bash
# Check who has roles
npx hardhat run scripts/check_roles.ts --network sepolia

# Find your proxy address
npx hardhat run scripts/find_proxy.ts --network sepolia
```

### "Transaction reverted without a reason"

- Make sure you're using the proxy address
- Verify you have the required role for the operation
- Check that the token isn't paused

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## ⚖️ License

MIT License - see LICENSE file for details

---

## 📞 Support

For security issues, please contact the team privately before public disclosure.

---

## ⚠️ Disclaimer

This code is provided as-is. Conduct thorough testing and professional audits before mainnet deployment. The developers assume no liability for any losses incurred through the use of this software.

