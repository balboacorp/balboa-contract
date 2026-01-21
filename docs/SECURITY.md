# Security & Architecture Guide

## 🏗️ Architecture Overview

### Contract Structure

```
BalboaToken (UUPS Upgradeable ERC20)
├── ERC20 Upgradeable (OpenZeppelin)
├── AccessControl (Role-based permissions)
├── Pausable (Emergency stop)
├── ReentrancyGuard (Protection)
└── Storage Gap (51 slots for future upgrades)

Create2Factory (Deterministic Deployment)
├── CREATE2 Opcode
├── Owner-only deployment
└── Prevents duplicates
```

### Deployment Model

```
Proxy (Your Token Address)
└── Implementation (Logic Contract)
    └── Can be upgraded
```

**Key Point:** Always use the **Proxy** address for interactions, never the Implementation!

---

## 🔒 Security Features

### Implemented Protections

| Feature | Purpose | Status |
|---------|---------|--------|
| **Reentrancy Guard** | Prevent recursive calls | ✅ Enabled |
| **Access Control** | Role-based permissions | ✅ Implemented |
| **Pausable** | Emergency freeze | ✅ Enabled |
| **Safe Math** | Overflow protection | ✅ Solidity 0.8+ |
| **Input Validation** | Zero address/amount checks | ✅ Implemented |
| **UUPS Pattern** | Storage-safe upgrades | ✅ Implemented |
| **Storage Gap** | Reserve space for upgrades | ✅ 51 slots |

---

## ⚠️ Security Considerations

### Critical Design Decisions

#### 1. Burn Function (HIGH IMPACT - By Design)

The `burn(address from, uint256 amount)` function allows BURNER_ROLE to burn tokens from **any address** without approval.

**Why:** Regulatory compliance requirement

**Security Implications:**
- BURNER_ROLE must be a trusted multi-sig or governance
- Can cause token loss for users
- Requires clear communication

**Mitigation:**
- Use multi-sig for BURNER_ROLE
- Document this behavior clearly
- Consider implementing rate limits
- Monitor all burn transactions

#### 2. Centralization Risk (MEDIUM)

Deployer initially receives all roles.

**Why:** Required for initialization

**Security Implications:**
- Single point of failure
- Potential for misuse if key compromised

**Mitigation:**
- Transfer to multi-sig immediately after deployment
- Distribute roles to different addresses
- Use hardware wallet for deployment key
- Never commit private keys to git

#### 3. No Upgrade Timelock (MEDIUM)

Upgrades happen immediately upon `upgradeTo()` call.

**Why:** Flexibility during development

**Security Implications:**
- No time for users to exit if malicious
- Breaking changes could affect integrations

**Mitigation (Pre-Mainnet):**
- Implement 48-hour timelock
- Use governance contract for upgrades
- Announce upgrades in advance
- Extensive testnet testing

#### 4. Unlimited Minting (MEDIUM)

No per-transaction or rate limits on minting.

**Why:** Flexibility for token supply management

**Security Implications:**
- Hyperinflation if MINTER compromised
- Market manipulation possible

**Mitigation:**
- MINTER_ROLE to trusted addresses only
- Consider governance approval for large mints
- Monitor mint transactions
- Implement off-chain rate limits
- Document mint schedule

---

## 🧪 Testing Strategy

### Unit Tests Coverage

```bash
pnpm test
```

Tests included:

✅ **Initialization**
- Proper role assignment
- Token metadata correct
- Proxy correctly initialized

✅ **Minting**
- Only MINTER_ROLE can mint
- Correct amount assigned
- Zero address protection

✅ **Burning**
- Only BURNER_ROLE can burn
- Can burn from any address
- Correct amount removed

✅ **Pausing**
- Only PAUSER_ROLE can pause/unpause
- Transfers blocked when paused
- Other functions work when paused

✅ **Blacklist**
- Only BLACKLISTER_ROLE can blacklist
- Blocked addresses can't transfer
- Can unblacklist

✅ **Access Control**
- Role management works
- Only admins can grant/revoke
- Events emitted correctly

✅ **Upgradability**
- Only UPGRADER_ROLE can upgrade
- Implementation changes
- Storage preserved
- Events emitted

✅ **Security**
- Reentrancy protected
- Zero amount checks
- Zero address checks

### Run Tests

```bash
# Run all tests
pnpm test

# Run with coverage report
pnpm hardhat coverage

# Run with gas reporting
REPORT_GAS=true pnpm test
```

---

## 🔐 Production Deployment Checklist

### Pre-Deployment (1-2 weeks before)

#### Code & Security
- [ ] All tests passing (100% coverage)
- [ ] Contract audited by professional firm
- [ ] Security issues addressed and documented
- [ ] Code reviewed by 2+ team members
- [ ] No console.log or debug code
- [ ] Comments updated and clear

#### Configuration
- [ ] Multi-sig wallet created and tested
- [ ] All role addresses identified
- [ ] .env template prepared
- [ ] Deployment sequence documented
- [ ] Rollback plan documented

#### Team Preparation
- [ ] Deployment guide reviewed
- [ ] Emergency procedures documented
- [ ] Team trained on procedures
- [ ] Contact list prepared
- [ ] On-call rotation established

### Pre-Deployment (Day before)

- [ ] Deploy to testnet successfully
- [ ] Verify on Etherscan
- [ ] Test all operations on testnet
- [ ] Confirm all team members ready
- [ ] Double-check all addresses
- [ ] Backup private keys securely

### Deployment Day

- [ ] Deploy factory
- [ ] Deploy token
- [ ] Verify on Etherscan
- [ ] Distribute roles
- [ ] Verify role assignments
- [ ] Document all addresses
- [ ] Update team

### Post-Deployment

- [ ] Monitor for 24 hours continuously
- [ ] Verify role assignments work
- [ ] Test transfers work
- [ ] Update external documentation
- [ ] Announce to community
- [ ] Monitor ongoing

---

## 🚨 Emergency Procedures

### Token Compromised - Immediate Actions

1. **Pause the token** (PAUSER_ROLE)
   ```javascript
   await token.pause()
   ```

2. **Identify the issue**
   - Check logs for unauthorized transactions
   - Identify compromised roles
   - Assess damage

3. **Revoke compromised roles**
   ```javascript
   await token.revokeRole(MINTER_ROLE, "0xCompromisedAddress")
   ```

4. **Deploy upgrade** if needed (UPGRADER_ROLE)
   ```bash
   npx hardhat run scripts/upgrade.ts --network mainnet
   ```

5. **Unpause** when resolved
   ```javascript
   await token.unpause()
   ```

6. **Post-incident analysis**
   - Determine root cause
   - Plan prevention measures
   - Update procedures

### Lost Admin Role

If admin somehow lost:

1. Deploy new implementation with transferred admin
2. Upgrade to new implementation
3. Verify new admin has role
4. Document incident

---

## 📊 Monitoring & Alerting

### Critical Transactions to Monitor

- [ ] All role changes
- [ ] Pausable state changes
- [ ] Upgrade transactions
- [ ] Large mint transactions
- [ ] Blacklist operations
- [ ] Unusual transfer patterns

### Recommended Alerting

Set up alerts for:
```
CRITICAL: Pause/Unpause
CRITICAL: Role changes
CRITICAL: Upgrade detected
WARNING: Large mint > 1M tokens
WARNING: Multiple blacklists
```

### Monitoring Tools

- Tenderly.co - Transaction monitoring
- Forta - Real-time alerts
- Etherscan - Block explorer
- Custom bot - Off-chain monitoring

---

## 🔍 Code Review Checklist

Before each deployment or upgrade:

- [ ] No hardcoded addresses
- [ ] No private keys in code
- [ ] All error messages present
- [ ] Events emitted correctly
- [ ] Access control properly checked
- [ ] Integer overflow handled
- [ ] Array bounds checked
- [ ] Proper use of OpenZeppelin contracts
- [ ] Storage layout compatible
- [ ] No selfdestruct() calls

---

## 🛡️ Best Practices

### Private Key Management

✅ **DO:**
- Use hardware wallets (Ledger, Trezor)
- Store in secure location
- Use access controls (1Password, Vault)
- Rotate after mainnet deployment
- Use different keys for different networks

❌ **DON'T:**
- Share private keys
- Commit to git (ever!)
- Use unsecured environment variables
- Reuse across projects
- Leave on personal computers

### Upgrade Strategy

✅ **DO:**
- Test upgrades thoroughly on testnet
- Announce upgrades in advance
- Use timelock for mainnet
- Have rollback plan
- Monitor after deployment

❌ **DON'T:**
- Upgrade hastily
- Make breaking changes
- Lose admin access
- Upgrade without testing
- Change storage layout incompatibly

### Role Management

✅ **DO:**
- Use multi-sig for critical roles
- Distribute roles widely
- Monitor role usage
- Maintain audit trail
- Review periodically

❌ **DON'T:**
- Concentrate all roles
- Give admin to EOA
- Share role addresses
- Forget to revoke deployer
- Give roles without documentation

---

## 📚 Additional Resources

### Security Standards
- [OpenZeppelin Security](https://docs.openzeppelin.com/contracts/4.x/upgradeable)
- [ERC20 Best Practices](https://eips.ethereum.org/EIPS/eip-20)
- [UUPS Pattern](https://docs.openzeppelin.com/contracts/4.x/api/proxy#UUPSUpgradeable)

### Auditing
- [Trail of Bits](https://www.trailofbits.com/)
- [ConsenSys Diligence](https://consensys.net/diligence/)
- [Verifié](https://www.verified.network/)

### Tools
- [Mythril](https://github.com/ConsenSys/mythril) - Static analysis
- [Slither](https://github.com/crytic/slither) - Security linter
- [Hardhat](https://hardhat.org/) - Development environment

---

## 📞 Security Incident Reporting

**Do not open public issues for security vulnerabilities!**

Instead, report privately to: security@[yourcompany].com

Provide:
- Description of vulnerability
- Impact assessment
- Proof of concept (if applicable)
- Suggested fix (if you have one)

---

See [DEPLOYMENT.md](DEPLOYMENT.md) for deployment procedures and [ROLES.md](ROLES.md) for role management.
