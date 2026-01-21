# Documentation Index

## Getting Started

1. **[QUICK_START.md](QUICK_START.md)** - Start here!
   - Installation and setup
   - First-time deployment
   - Role configuration
   - Common commands

2. **[DEPLOYMENT.md](DEPLOYMENT.md)** - Detailed deployment guide
   - Step-by-step instructions
   - Factory deployment
   - Token deployment
   - Verification on Etherscan
   - Production checklist
   - Mainnet deployment
   - Troubleshooting

## Core Topics

3. **[ROLES.md](ROLES.md)** - Access control and permissions
   - Role descriptions and responsibilities
   - Grant/revoke roles via scripts
   - Grant/revoke roles via console
   - Grant/revoke roles via Etherscan
   - Production role distribution
   - Verification procedures
   - Emergency procedures
   - Security best practices

4. **[SECURITY.md](SECURITY.md)** - Architecture and security
   - Architecture overview
   - Implemented security features
   - Security considerations
   - Testing strategy
   - Pre-deployment checklist
   - Emergency procedures
   - Monitoring and alerting
   - Best practices

## Quick Reference

### Most Common Tasks

#### Deploy for the first time
→ [QUICK_START.md](QUICK_START.md)

#### Deploy to production
→ [DEPLOYMENT.md](DEPLOYMENT.md) + [DEPLOYMENT.md#Step-5-Production-Checklist](DEPLOYMENT.md)

#### Manage token roles
→ [ROLES.md](ROLES.md)

#### Understand security
→ [SECURITY.md](SECURITY.md)

#### Emergency procedures
→ [SECURITY.md#-Emergency-Procedures](SECURITY.md)

### Critical Reminders

⚠️ **Always use the PROXY address, never the implementation address**
- Proxy address: Your token (use this!)
- Implementation: Logic contract (don't use this)

⚠️ **Admin must be multi-sig in production**
- Never use single EOA
- Recommended: 3-of-5 multi-sig

⚠️ **Test on testnet first**
- Always deploy to sepolia before mainnet
- Verify all operations work
- Test role distribution
- Test upgrade procedure

⚠️ **Roles must be distributed**
- Don't leave all roles with deployer
- Each role to appropriate address/multi-sig
- Document all assignments
- Verify after distribution

---

## Document Summaries

### QUICK_START.md
- Installation with pnpm
- Environment setup
- Compile and test
- Deploy factory
- Deploy token
- Save proxy address
- Set up roles
- Common commands and mistakes

### DEPLOYMENT.md
- Prerequisites and configuration
- Deploy factory step by step
- Deploy token with proper validation
- Verify on Etherscan
- Distribute roles with scripts
- Production checklist
- Testnet testing procedures
- Mainnet deployment
- Troubleshooting common issues

### ROLES.md
- Role descriptions and purposes
- Role hash constants
- Grant roles via scripts (recommended)
- Revoke roles via scripts
- Manage via Hardhat console
- Manage via Etherscan UI
- Production role distribution setup
- Role responsibilities
- Verification procedures
- Emergency role revocation
- Security best practices
- Change history template

### SECURITY.md
- Architecture overview
- Security features implemented
- Security considerations (with mitigations)
- Testing strategy and coverage
- Pre-deployment checklist
- Emergency procedures (pause, upgrade, revoke)
- Monitoring and alerting setup
- Code review checklist
- Private key management
- Upgrade strategy
- Role management best practices
- Additional resources

---

## Getting Help

### If you encounter an issue:

1. Check the **Troubleshooting** section in [DEPLOYMENT.md](DEPLOYMENT.md)
2. Review the relevant document above
3. Check [SECURITY.md](SECURITY.md) for emergency procedures
4. Verify you're using the **PROXY address**, not implementation

### If you need to:

- Deploy the token → [QUICK_START.md](QUICK_START.md)
- Manage roles → [ROLES.md](ROLES.md)
- Understand contracts → [SECURITY.md](SECURITY.md)
- Handle emergencies → [SECURITY.md#-Emergency-Procedures](SECURITY.md)

---

## File Organization

```
docs/
├── index.md             # This file
├── QUICK_START.md       # Start here
├── DEPLOYMENT.md        # Deployment instructions
├── ROLES.md             # Access control
└── SECURITY.md          # Architecture & security
```

---

Last updated: January 2026
