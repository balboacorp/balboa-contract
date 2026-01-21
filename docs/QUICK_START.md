# Quick Start Guide

## 📦 Installation & Setup

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
```

## 🚀 First-Time Deployment

### Step 1: Deploy Factory (One-time only)
```bash
pnpm hardhat run scripts/deploy_factory.ts --network sepolia
```
Save the factory address and add to `.env`:
```bash
FACTORY_ADDRESS=0x...
```

### Step 2: Deploy Token
```bash
pnpm hardhat run scripts/deploy_deterministic.ts --network sepolia
```

**🔴 IMPORTANT:** The output shows TWO addresses:
- **Implementation**: Don't use this!
- **Proxy (Token)**: USE THIS ONE!

Save the PROXY address:
```bash
TOKEN_ADDRESS=0xYourProxyAddressHere
```

### Step 3: Verify Your Deployment
```bash
npx hardhat run scripts/find_proxy.ts --network sepolia
```

---

## 🔐 Setting Up Roles

After deployment, distribute roles to appropriate addresses:

```bash
# 1. Edit grant_roles.ts with your addresses
nano scripts/grant_roles.ts

# 2. Run the grant script
npx hardhat run scripts/grant_roles.ts --network sepolia

# 3. Revoke deployer roles (optional but recommended)
npx hardhat run scripts/revoke_roles.ts --network sepolia
```

---

## 📋 Available Commands

```bash
pnpm compile      # Compile contracts
pnpm test         # Run tests
pnpm deploy       # Deploy token
pnpm upgrade      # Upgrade implementation
pnpm lint         # Check code style
pnpm format       # Format code
```

---

## ⚠️ Common Mistakes

1. **Using Implementation address instead of Proxy**
   - Solution: Run `npx hardhat run scripts/find_proxy.ts --network sepolia`

2. **Forgetting to set FACTORY_ADDRESS**
   - Solution: Add to `.env` after factory deployment

3. **Committing .env file to git**
   - Solution: Verify `.gitignore` includes `.env`

---

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.
