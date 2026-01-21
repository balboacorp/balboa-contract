# BALBOA Token - Production-Ready Upgradeable ERC20

A battle-tested UUPS upgradeable ERC20 token with deterministic cross-chain deployment using CREATE2.

## 🌟 Key Features

- **UUPS Upgradeable** - Gas-efficient upgradeable proxy pattern
- **Deterministic Deployment** - Same address across all chains
- **Role-Based Access Control** - Granular permissions for all operations
- **Pausable** - Emergency stop mechanism
- **Blacklist** - Compliance and security feature
- **Self-Burning** - Allow users to burn their own tokens
- **Battle-Tested** - Built with OpenZeppelin's audited contracts

## 📚 Documentation

Start here based on your needs:

| Document | Purpose |
|----------|---------|
| **[QUICK_START.md](docs/QUICK_START.md)** | 5-minute setup and first deployment |
| **[DEPLOYMENT.md](docs/DEPLOYMENT.md)** | Detailed deployment instructions |
| **[ROLES.md](docs/ROLES.md)** | Role management and access control |
| **[SECURITY.md](docs/SECURITY.md)** | Architecture and security details |

## ⚡ Quick Start

```bash
# Install
pnpm install

# Setup
cp .env.example .env
# Edit .env with your settings

# Compile & Test
pnpm compile
pnpm test

# Deploy factory (first time only)
pnpm hardhat run scripts/deploy_factory.ts --network sepolia

# Deploy token
pnpm hardhat run scripts/deploy_deterministic.ts --network sepolia
```

## 📦 What's Inside

```
contracts/
├── BalboaToken.sol           # Main UUPS upgradeable ERC20
├── BalboaTokenV2.sol         # Example upgrade
└── Create2Factory.sol        # Deterministic deployment

scripts/
├── deploy_factory.ts         # Deploy factory
├── deploy_deterministic.ts   # Deploy token
├── upgrade.ts                # Upgrade implementation
├── grant_roles.ts            # Manage role permissions
├── revoke_roles.ts           # Revoke permissions
├── find_proxy.ts             # Find correct proxy address
├── check_roles.ts            # Verify role assignments
└── run-security-audit.sh     # Security checks

test/
├── BalboaToken.complete.test.ts      # Token tests
└── Create2Factory.security.test.ts    # Factory tests
```

## 🚀 Core Commands

```bash
pnpm compile          # Compile contracts
pnpm test             # Run all tests
pnpm test:coverage    # Test coverage report
pnpm lint             # Check code style
pnpm format           # Format code
```

## ⚠️ Critical Points

1. **Use Proxy Address, Not Implementation**
   - Proxy address: `0xABCD...` (your actual token)
   - Implementation: `0x1234...` (logic only)
   - Always use **Proxy** for interactions!

2. **Admin Should Be Multi-Sig in Production**
   - Never use single EOA for admin role in mainnet
   - Recommended: 3-of-5 multi-sig wallet

3. **Roles Must Be Distributed**
   - Don't leave all roles with deployer
   - Use role management scripts
   - Document all role assignments

4. **Test on Testnet First**
   - Always deploy to sepolia/testnet first
   - Verify role assignments work
   - Test upgrade procedure
   - Then deploy to mainnet

## 🔐 Access Control

Six critical roles control all operations:

- **DEFAULT_ADMIN_ROLE** - Master permissions
- **MINTER_ROLE** - Create new tokens
- **BURNER_ROLE** - Destroy tokens (from any address)
- **PAUSER_ROLE** - Freeze/unfreeze token
- **UPGRADER_ROLE** - Deploy upgrades
- **BLACKLISTER_ROLE** - Block addresses

See [ROLES.md](docs/ROLES.md) for detailed management.

## 🧪 Testing

```bash
# Run tests
pnpm test

# With coverage
pnpm hardhat coverage

# With gas reporting
REPORT_GAS=true pnpm test
```

Tests cover:
- ✅ Initialization and setup
- ✅ Minting and burning
- ✅ Pausing and unpausing
- ✅ Blacklist functionality
- ✅ Role management
- ✅ Contract upgrades
- ✅ Access control
- ✅ Security features

## 📋 Deployment Checklist

Before mainnet:
- [ ] All tests passing
- [ ] Contract audited
- [ ] Admin is multi-sig wallet
- [ ] Roles distributed
- [ ] Testnet deployment successful
- [ ] Contracts verified on Etherscan
- [ ] Emergency procedures documented
- [ ] Team trained on procedures

See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for full checklist.

## ⚙️ Network Configuration

Supports:
- Ethereum Mainnet
- Ethereum Sepolia (testnet)
- Polygon
- Arbitrum
- Optimism

Configure in `.env`:
```bash
DEPLOYER_KEY=your_private_key
MAINNET_RPC=your_rpc_endpoint
ETHERSCAN_API_KEY=your_api_key
```

## 🆘 Common Issues

### "Deployer does not have DEFAULT_ADMIN_ROLE"
- You're using the implementation address, not proxy
- Run: `npx hardhat run scripts/find_proxy.ts --network sepolia`
- Use the returned **PROXY** address

### "Transaction reverted without reason"
- Verify you're using the proxy address
- Check you have the required role
- Ensure token isn't paused
- Check you have enough gas

### "Factory address not found"
- Deploy factory first: `pnpm hardhat run scripts/deploy_factory.ts --network sepolia`
- Add to .env: `FACTORY_ADDRESS=0x...`

See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for more troubleshooting.

## 🔒 Security

This code is production-ready but requires:
- Professional audit before mainnet
- Proper key management
- Role distribution to multi-sig wallets
- Monitoring and alerting setup
- Incident response procedures

See [SECURITY.md](docs/SECURITY.md) for detailed security information.

## 📄 License

MIT License - See LICENSE file

## ⚠️ Disclaimer

This code is provided as-is. Conduct thorough testing, professional audits, and proper security procedures before mainnet deployment. The developers assume no liability for losses incurred through use of this software.

---

**Ready to deploy?** Start with [QUICK_START.md](docs/QUICK_START.md)

