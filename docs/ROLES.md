# Role Management Guide

## 🔐 Access Control Roles

The BALBOA token uses OpenZeppelin's AccessControl for granular permissions:

| Role | Description | Critical Operations |
|------|-------------|---------------------|
| `DEFAULT_ADMIN_ROLE` | Master admin role | Manages all other roles |
| `MINTER_ROLE` | Can create tokens | `mint()` |
| `BURNER_ROLE` | Can destroy tokens | `burn()` |
| `PAUSER_ROLE` | Emergency controls | `pause()`, `unpause()` |
| `UPGRADER_ROLE` | Can upgrade contract | `upgradeTo()` |
| `BLACKLISTER_ROLE` | Compliance officer | `blacklist()`, `unBlacklist()` |

---

## Role Hashes

For manual role management:

```solidity
DEFAULT_ADMIN_ROLE = 0x0000000000000000000000000000000000000000000000000000000000000000
MINTER_ROLE        = 0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6
BURNER_ROLE        = 0x3c11d16cbaffd01df69ce1c404f6340ee057498f5f00246190ea54220576a848
PAUSER_ROLE        = 0x65d7a28e3265b37a6474929f336521b332c1681b933f6cb9f3376673440d862a
UPGRADER_ROLE      = 0x189ab7a9244df0848122154315af71fe140ab3f0a4b666dcd7645381f37d7974
BLACKLISTER_ROLE   = 0x4a06a1d58f3fb1a9a3b99b961a1ee56a87a6b35a1d4c3c2f9c3e8d4e8f4a5b6c
```

---

## Managing Roles Using Scripts

### Option 1: Bulk Grant Roles (Recommended)

Edit `scripts/grant_roles.ts`:

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

Run:
```bash
npx hardhat run scripts/grant_roles.ts --network sepolia
```

### Option 2: Revoke Roles

Edit `scripts/revoke_roles.ts` to remove roles:

```bash
npx hardhat run scripts/revoke_roles.ts --network sepolia
```

---

## Managing Roles Using Hardhat Console

### Connect to Network

```bash
npx hardhat console --network sepolia
```

### Get Role Hashes

```javascript
const token = await ethers.getContractAt("BalboaToken", "0xYourProxyAddress")
const MINTER_ROLE = await token.MINTER_ROLE()
const BURNER_ROLE = await token.BURNER_ROLE()
const PAUSER_ROLE = await token.PAUSER_ROLE()
const UPGRADER_ROLE = await token.UPGRADER_ROLE()
const BLACKLISTER_ROLE = await token.BLACKLISTER_ROLE()
const DEFAULT_ADMIN_ROLE = await token.DEFAULT_ADMIN_ROLE()
```

### Grant a Role

```javascript
await token.grantRole(MINTER_ROLE, "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb")
```

### Revoke a Role

```javascript
await token.revokeRole(MINTER_ROLE, "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb")
```

### Check Role Membership

```javascript
const hasMinter = await token.hasRole(MINTER_ROLE, "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb")
console.log("Has MINTER_ROLE:", hasMinter)
```

### Renounce Your Own Role

```javascript
await token.renounceRole(MINTER_ROLE, "0xYourAddress")
```

**⚠️ WARNING:** Be very careful with DEFAULT_ADMIN_ROLE renunciation!

---

## Managing Roles via Etherscan

### Prerequisites

- Contract verified on Etherscan
- Connected with wallet that has the required role

### Grant Role

1. Go to your token contract on Etherscan
2. Click "Contract" → "Write Contract"
3. Connect your wallet
4. Find `grantRole` function
5. Enter:
   - `role`: Role hash (copy from Role Hashes section above)
   - `account`: Address to grant role to
6. Click "Write" and confirm transaction

### Example: Grant MINTER_ROLE

- Role: `0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6`
- Account: `0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb`

---

## Production Role Distribution

### Recommended Setup

```
DEFAULT_ADMIN_ROLE → Multi-sig Wallet (3-of-5)
    ↓
    ├── MINTER_ROLE → Treasury Contract or EOA
    ├── BURNER_ROLE → Compliance Officer (2-of-3 multi-sig)
    ├── PAUSER_ROLE → Security Team (2-of-2 multi-sig)
    ├── UPGRADER_ROLE → Governance or Timelock
    └── BLACKLISTER_ROLE → Compliance Team
```

### Implementation Steps

1. **Create Multi-Sig Wallets**
   - Admin Multi-sig (3-of-5)
   - Pauser Multi-sig (2-of-2)
   - Burner Multi-sig (2-of-3)

2. **Grant Roles**
   ```bash
   npx hardhat run scripts/grant_roles.ts --network mainnet
   ```

3. **Verify Assignments**
   ```bash
   npx hardhat run scripts/check_roles.ts --network mainnet
   ```

4. **Revoke Deployer Roles**
   ```bash
   npx hardhat run scripts/revoke_roles.ts --network mainnet
   ```

---

## Role Responsibilities

### MINTER_ROLE (Trusted)

**Responsibilities:**
- Create new tokens
- Monitor mint requests
- Document all minting

**Recommended Address:**
- Treasury contract (automated)
- Or multi-sig with clear governance

### BURNER_ROLE (Trusted)

**Responsibilities:**
- Burn tokens for compliance
- Maintain audit trail
- Follow regulatory requirements

**Note:** Can burn tokens from any address (by design)

### PAUSER_ROLE (Critical)

**Responsibilities:**
- Emergency pause if hacked
- Unpause after resolution
- Monitor for suspicious activity

**Recommended:** Security team multi-sig

### UPGRADER_ROLE (Critical)

**Responsibilities:**
- Deploy upgrades
- Test upgrades thoroughly
- Coordinate with governance

**Recommended:** Governance contract or timelock

### BLACKLISTER_ROLE (Trusted)

**Responsibilities:**
- Block stolen addresses
- Block sanctioned addresses
- Maintain compliance records

**Recommended:** Compliance team

### DEFAULT_ADMIN_ROLE (Critical)

**Responsibilities:**
- Manage all roles
- Emergency access
- Only used if needed

**Recommended:** Multi-sig wallet (never EOA in production)

---

## Verification Procedures

### Check All Role Members

```bash
npx hardhat run scripts/check_roles.ts --network sepolia
```

### Manual Verification

```javascript
const token = await ethers.getContractAt("BalboaToken", "0xYourProxyAddress")

// Check if address has role
await token.hasRole(MINTER_ROLE, "0xAddress")

// Get all admins
const adminFilter = token.filters.RoleGranted(DEFAULT_ADMIN_ROLE)
const admins = await token.queryFilter(adminFilter)
```

---

## Emergency Procedures

### Emergency Pause

If token is compromised:

```javascript
const token = await ethers.getContractAt("BalboaToken", "0xYourProxyAddress")
const signer = await ethers.getSigner()
await token.pause()
// Token is now frozen
```

### Emergency Upgrade

```bash
npx hardhat run scripts/upgrade.ts --network sepolia
```

### Emergency Role Revocation

```javascript
await token.revokeRole(MINTER_ROLE, "0xCompromisedAddress")
```

---

## Security Best Practices

✅ **DO:**
- Use multi-sig for admin and critical roles
- Distribute roles to different addresses
- Maintain audit trail of role changes
- Test role changes on testnet first
- Document role holders and purposes
- Monitor role-based transactions

❌ **DON'T:**
- Use same address for multiple roles
- Give admin to EOA (use multi-sig)
- Forget to revoke deployer roles
- Give all roles to one entity
- Share private keys
- Skip verification steps

---

## Role Change History Template

Keep record of role assignments:

```markdown
## Role Assignment Log

### 2026-01-21 - Initial Deployment

**MINTER_ROLE**
- Granted to: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb (Treasury)
- Reason: Token supply management
- Approved by: Team

**PAUSER_ROLE**
- Granted to: 0x1234567890123456789012345678901234567890 (Security Multi-sig)
- Reason: Emergency pause capability
- Approved by: Team

**DEFAULT_ADMIN_ROLE**
- Granted to: 0xMultisigAddress (3-of-5 multi-sig)
- Reason: Administrative control
- Approved by: Team
- Deployer revoked: Yes
```

---

## Troubleshooting

### "Insufficient permissions"

You don't have the required role. Check:
```javascript
const token = await ethers.getContractAt("BalboaToken", "0xYourProxyAddress")
const MINTER_ROLE = await token.MINTER_ROLE()
await token.hasRole(MINTER_ROLE, "0xYourAddress")
```

### "Role not found"

Using wrong role hash. Get correct one:
```javascript
const MINTER_ROLE = await token.MINTER_ROLE()
console.log(MINTER_ROLE)
```

### "Cannot revoke admin from self"

Use `renounceRole` instead:
```javascript
await token.renounceRole(DEFAULT_ADMIN_ROLE, "0xYourAddress")
```

---

See [DEPLOYMENT.md](DEPLOYMENT.md) for deployment instructions.
