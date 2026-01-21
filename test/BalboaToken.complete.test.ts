import { expect } from "chai";
import { ethers } from "hardhat";
import type { BalboaToken } from "../typechain-types";

describe("BalboaToken - Complete Test Suite", function () {
  let balboa: BalboaToken;
  let owner: Awaited<ReturnType<typeof ethers.getSigners>>[0];
  let admin: Awaited<ReturnType<typeof ethers.getSigners>>[0];
  let minter: Awaited<ReturnType<typeof ethers.getSigners>>[0];
  let burner: Awaited<ReturnType<typeof ethers.getSigners>>[0];
  let pauser: Awaited<ReturnType<typeof ethers.getSigners>>[0];
  let upgrader: Awaited<ReturnType<typeof ethers.getSigners>>[0];
  let blacklister: Awaited<ReturnType<typeof ethers.getSigners>>[0];
  let user1: Awaited<ReturnType<typeof ethers.getSigners>>[0];
  let user2: Awaited<ReturnType<typeof ethers.getSigners>>[0];
  let attacker: Awaited<ReturnType<typeof ethers.getSigners>>[0];

  beforeEach(async function () {
    [owner, admin, minter, burner, pauser, upgrader, blacklister, user1, user2, attacker] = await ethers.getSigners();

    const BalboaToken = await ethers.getContractFactory("BalboaToken");
    const implementation = await BalboaToken.deploy();
    await implementation.waitForDeployment();

    const implAddress = await implementation.getAddress();
    const initData = BalboaToken.interface.encodeFunctionData("initialize", [
      owner.address
    ]);
    
    const Proxy = await ethers.getContractFactory("ERC1967Proxy");
    const proxy = await Proxy.deploy(implAddress, initData);
    await proxy.waitForDeployment();

    balboa = BalboaToken.attach(await proxy.getAddress()) as unknown as BalboaToken;

    // Setup distributed roles for security testing
    const MINTER_ROLE = await balboa.MINTER_ROLE();
    const BURNER_ROLE = await balboa.BURNER_ROLE();
    const PAUSER_ROLE = await balboa.PAUSER_ROLE();
    const UPGRADER_ROLE = await balboa.UPGRADER_ROLE();
    const BLACKLISTER_ROLE = await balboa.BLACKLISTER_ROLE();

    await balboa.grantRole(MINTER_ROLE, minter.address);
    await balboa.grantRole(BURNER_ROLE, burner.address);
    await balboa.grantRole(PAUSER_ROLE, pauser.address);
    await balboa.grantRole(UPGRADER_ROLE, upgrader.address);
    await balboa.grantRole(BLACKLISTER_ROLE, blacklister.address);
  });

  // =============================================================================
  // DEPLOYMENT & INITIALIZATION
  // =============================================================================

  describe("1. Deployment & Initialization", function () {
    it("Should set correct token name and symbol", async function () {
      expect(await balboa.name()).to.equal("BALBOA");
      expect(await balboa.symbol()).to.equal("BALBOA");
    });

    it("Should upgrade and return new token symbol", async function () {
      const BalboaTokenV2 = await ethers.getContractFactory("BalboaTokenV2");
      const newImpl = await BalboaTokenV2.deploy();
      await newImpl.waitForDeployment();

      await balboa.connect(upgrader).upgradeToAndCall(await newImpl.getAddress(), "0x");

      expect(await balboa.name()).to.equal("BALBOA");
      expect(await balboa.symbol()).to.equal("BALBOA1");
    });

    it("Should have 18 decimals", async function () {
      expect(await balboa.decimals()).to.equal(18);
    });

    it("Should grant all roles to deployer initially", async function () {
      const DEFAULT_ADMIN_ROLE = await balboa.DEFAULT_ADMIN_ROLE();
      const MINTER_ROLE = await balboa.MINTER_ROLE();
      const BURNER_ROLE = await balboa.BURNER_ROLE();
      const PAUSER_ROLE = await balboa.PAUSER_ROLE();
      const UPGRADER_ROLE = await balboa.UPGRADER_ROLE();
      const BLACKLISTER_ROLE = await balboa.BLACKLISTER_ROLE();

      expect(await balboa.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
      expect(await balboa.hasRole(MINTER_ROLE, owner.address)).to.be.true;
      expect(await balboa.hasRole(BURNER_ROLE, owner.address)).to.be.true;
      expect(await balboa.hasRole(PAUSER_ROLE, owner.address)).to.be.true;
      expect(await balboa.hasRole(UPGRADER_ROLE, owner.address)).to.be.true;
      expect(await balboa.hasRole(BLACKLISTER_ROLE, owner.address)).to.be.true;
    });

    it("Should start with zero total supply", async function () {
      expect(await balboa.totalSupply()).to.equal(0);
    });

    it("Should prevent re-initialization", async function () {
      await expect(
        balboa.initialize(attacker.address)
      ).to.be.reverted;
    });

    it("Should prevent initialization with zero address", async function () {
      const BalboaToken = await ethers.getContractFactory("BalboaToken");
      const implementation = await BalboaToken.deploy();
      await implementation.waitForDeployment();

      const implAddress = await implementation.getAddress();
      const initData = BalboaToken.interface.encodeFunctionData("initialize", [
        ethers.ZeroAddress
      ]);
      
      const Proxy = await ethers.getContractFactory("ERC1967Proxy");
      await expect(
        Proxy.deploy(implAddress, initData)
      ).to.be.reverted;
    });
  });

  // =============================================================================
  // ACCESS CONTROL & ROLE MANAGEMENT
  // =============================================================================

  describe("2. Access Control & Role Management", function () {
    it("Should allow admin to grant roles", async function () {
      const MINTER_ROLE = await balboa.MINTER_ROLE();
      await balboa.grantRole(MINTER_ROLE, user1.address);
      expect(await balboa.hasRole(MINTER_ROLE, user1.address)).to.be.true;
    });

    it("Should allow admin to revoke roles", async function () {
      const MINTER_ROLE = await balboa.MINTER_ROLE();
      await balboa.revokeRole(MINTER_ROLE, minter.address);
      expect(await balboa.hasRole(MINTER_ROLE, minter.address)).to.be.false;
    });

    it("Should prevent non-admin from granting roles", async function () {
      const MINTER_ROLE = await balboa.MINTER_ROLE();
      await expect(
        balboa.connect(attacker).grantRole(MINTER_ROLE, attacker.address)
      ).to.be.reverted;
    });

    it("Should immediately stop role functionality after revocation", async function () {
      const MINTER_ROLE = await balboa.MINTER_ROLE();
      
      await balboa.connect(minter).mint(user1.address, ethers.parseEther("100"));
      await balboa.revokeRole(MINTER_ROLE, minter.address);
      
      await expect(
        balboa.connect(minter).mint(user1.address, ethers.parseEther("100"))
      ).to.be.reverted;
    });

    it("Should allow role re-grant after revocation", async function () {
      const MINTER_ROLE = await balboa.MINTER_ROLE();
      
      await balboa.revokeRole(MINTER_ROLE, minter.address);
      await balboa.grantRole(MINTER_ROLE, minter.address);
      
      await balboa.connect(minter).mint(user1.address, ethers.parseEther("100"));
      expect(await balboa.balanceOf(user1.address)).to.equal(ethers.parseEther("100"));
    });

    it("Should handle admin role transfer carefully", async function () {
      const DEFAULT_ADMIN_ROLE = await balboa.DEFAULT_ADMIN_ROLE();
      const MINTER_ROLE = await balboa.MINTER_ROLE();
      
      await balboa.grantRole(DEFAULT_ADMIN_ROLE, user1.address);
      await balboa.revokeRole(DEFAULT_ADMIN_ROLE, owner.address);
      
      await expect(
        balboa.connect(owner).grantRole(MINTER_ROLE, user2.address)
      ).to.be.reverted;
      
      await balboa.connect(user1).grantRole(MINTER_ROLE, user2.address);
      expect(await balboa.hasRole(MINTER_ROLE, user2.address)).to.be.true;
    });
  });

  // =============================================================================
  // ROLE SEPARATION & SECURITY
  // =============================================================================

  describe("3. Role Separation Security", function () {
    it("Should enforce role separation - minter cannot pause", async function () {
      await expect(
        balboa.connect(minter).pause()
      ).to.be.reverted;
    });

    it("Should enforce role separation - burner cannot mint", async function () {
      await expect(
        balboa.connect(burner).mint(user1.address, ethers.parseEther("1000"))
      ).to.be.reverted;
    });

    it("Should enforce role separation - pauser cannot blacklist", async function () {
      await expect(
        balboa.connect(pauser).blacklist(attacker.address)
      ).to.be.reverted;
    });

    it("Should enforce role separation - blacklister cannot upgrade", async function () {
      const BalboaToken = await ethers.getContractFactory("BalboaToken");
      const newImpl = await BalboaToken.deploy();
      await newImpl.waitForDeployment();

      await expect(
        balboa.connect(blacklister).upgradeToAndCall(await newImpl.getAddress(), "0x")
      ).to.be.reverted;
    });

    it("Should allow each role to perform only their designated function", async function () {
      await balboa.connect(minter).mint(user1.address, ethers.parseEther("100"));
      expect(await balboa.balanceOf(user1.address)).to.equal(ethers.parseEther("100"));

      await balboa.connect(burner).burn(user1.address, ethers.parseEther("50"));
      expect(await balboa.balanceOf(user1.address)).to.equal(ethers.parseEther("50"));

      await balboa.connect(pauser).pause();
      expect(await balboa.paused()).to.be.true;
      await balboa.connect(pauser).unpause();

      await balboa.connect(blacklister).blacklist(attacker.address);
      expect(await balboa.isBlacklisted(attacker.address)).to.be.true;
    });
  });

  // =============================================================================
  // MINTING
  // =============================================================================

  describe("4. Minting", function () {
    it("Should allow minter to mint tokens", async function () {
      await balboa.connect(minter).mint(user1.address, ethers.parseEther("1000"));
      expect(await balboa.balanceOf(user1.address)).to.equal(ethers.parseEther("1000"));
    });

    it("Should prevent non-minter from minting", async function () {
      await expect(
        balboa.connect(attacker).mint(attacker.address, ethers.parseEther("1000"))
      ).to.be.reverted;
    });

    it("Should prevent minting to zero address", async function () {
      await expect(
        balboa.connect(minter).mint(ethers.ZeroAddress, ethers.parseEther("1000"))
      ).to.be.revertedWithCustomError(balboa, "ZeroAddress");
    });

    it("Should prevent minting zero amount", async function () {
      await expect(
        balboa.connect(minter).mint(user1.address, 0)
      ).to.be.revertedWithCustomError(balboa, "ZeroAmount");
    });

    it("Should prevent minting when paused", async function () {
      await balboa.connect(pauser).pause();
      
      await expect(
        balboa.connect(minter).mint(user1.address, ethers.parseEther("100"))
      ).to.be.reverted;
    });

    it("Should prevent minting to blacklisted address", async function () {
      await balboa.connect(blacklister).blacklist(attacker.address);
      
      await expect(
        balboa.connect(minter).mint(attacker.address, ethers.parseEther("100"))
      ).to.be.revertedWithCustomError(balboa, "AccountBlacklisted");
    });

    it("Should emit TokensMinted event", async function () {
      await expect(balboa.connect(minter).mint(user1.address, ethers.parseEther("1000")))
        .to.emit(balboa, "TokensMinted")
        .withArgs(user1.address, ethers.parseEther("1000"));
    });

    it("Should emit Transfer event on mint", async function () {
      await expect(balboa.connect(minter).mint(user1.address, ethers.parseEther("1000")))
        .to.emit(balboa, "Transfer")
        .withArgs(ethers.ZeroAddress, user1.address, ethers.parseEther("1000"));
    });

    it("Should update total supply correctly", async function () {
      await balboa.connect(minter).mint(user1.address, ethers.parseEther("1000"));
      expect(await balboa.totalSupply()).to.equal(ethers.parseEther("1000"));
      
      await balboa.connect(minter).mint(user2.address, ethers.parseEther("500"));
      expect(await balboa.totalSupply()).to.equal(ethers.parseEther("1500"));
    });

    it("Should allow minting large amounts", async function () {
      const largeAmount = ethers.parseEther("1000000000");
      await balboa.connect(minter).mint(user1.address, largeAmount);
      expect(await balboa.balanceOf(user1.address)).to.equal(largeAmount);
    });
  });

  // =============================================================================
  // BURNING
  // =============================================================================

  describe("5. Burning", function () {
    beforeEach(async function () {
      await balboa.connect(minter).mint(user1.address, ethers.parseEther("1000"));
      await balboa.connect(minter).mint(user2.address, ethers.parseEther("500"));
    });

    it("Should allow burner to burn tokens from any address", async function () {
      await balboa.connect(burner).burn(user1.address, ethers.parseEther("500"));
      expect(await balboa.balanceOf(user1.address)).to.equal(ethers.parseEther("500"));
    });

    it("Should allow users to burn their own tokens", async function () {
      await balboa.connect(user1).burnSelf(ethers.parseEther("100"));
      expect(await balboa.balanceOf(user1.address)).to.equal(ethers.parseEther("900"));
    });

    it("Should prevent non-burner from burning others' tokens", async function () {
      await expect(
        balboa.connect(attacker).burn(user1.address, ethers.parseEther("100"))
      ).to.be.reverted;
    });

    it("Should prevent burning from zero address", async function () {
      await expect(
        balboa.connect(burner).burn(ethers.ZeroAddress, ethers.parseEther("100"))
      ).to.be.revertedWithCustomError(balboa, "ZeroAddress");
    });

    it("Should prevent burning zero amount", async function () {
      await expect(
        balboa.connect(burner).burn(user1.address, 0)
      ).to.be.revertedWithCustomError(balboa, "ZeroAmount");
      
      await expect(
        balboa.connect(user1).burnSelf(0)
      ).to.be.revertedWithCustomError(balboa, "ZeroAmount");
    });

    it("Should emit TokensBurned event", async function () {
      await expect(balboa.connect(burner).burn(user1.address, ethers.parseEther("100")))
        .to.emit(balboa, "TokensBurned")
        .withArgs(user1.address, ethers.parseEther("100"));
      
      await expect(balboa.connect(user1).burnSelf(ethers.parseEther("100")))
        .to.emit(balboa, "TokensBurned")
        .withArgs(user1.address, ethers.parseEther("100"));
    });

    it("Should update total supply correctly after burning", async function () {
      await balboa.connect(burner).burn(user1.address, ethers.parseEther("300"));
      expect(await balboa.totalSupply()).to.equal(ethers.parseEther("1200"));
      
      await balboa.connect(user2).burnSelf(ethers.parseEther("200"));
      expect(await balboa.totalSupply()).to.equal(ethers.parseEther("1000"));
    });

    it("Should allow burning even when blacklisted (burnSelf)", async function () {
      await balboa.connect(blacklister).blacklist(user1.address);
      
      await balboa.connect(user1).burnSelf(ethers.parseEther("100"));
      expect(await balboa.balanceOf(user1.address)).to.equal(ethers.parseEther("900"));
    });
  });

  // =============================================================================
  // PAUSE MECHANISM
  // =============================================================================

  describe("6. Pause Mechanism", function () {
    beforeEach(async function () {
      await balboa.connect(minter).mint(user1.address, ethers.parseEther("1000"));
    });

    it("Should allow pauser to pause transfers", async function () {
      await balboa.connect(pauser).pause();
      expect(await balboa.paused()).to.be.true;
    });

    it("Should allow pauser to unpause transfers", async function () {
      await balboa.connect(pauser).pause();
      await balboa.connect(pauser).unpause();
      expect(await balboa.paused()).to.be.false;
    });

    it("Should prevent non-pauser from pausing", async function () {
      await expect(
        balboa.connect(attacker).pause()
      ).to.be.reverted;
    });

    it("Should prevent non-pauser from unpausing", async function () {
      await balboa.connect(pauser).pause();
      
      await expect(
        balboa.connect(attacker).unpause()
      ).to.be.reverted;
    });

    it("Should prevent transfers when paused", async function () {
      await balboa.connect(pauser).pause();
      
      await expect(
        balboa.connect(user1).transfer(user2.address, ethers.parseEther("100"))
      ).to.be.reverted;
    });

    it("Should prevent minting when paused", async function () {
      await balboa.connect(pauser).pause();
      
      await expect(
        balboa.connect(minter).mint(user2.address, ethers.parseEther("100"))
      ).to.be.reverted;
    });

    it("Should allow transfers after unpause", async function () {
      await balboa.connect(pauser).pause();
      await balboa.connect(pauser).unpause();
      
      await balboa.connect(user1).transfer(user2.address, ethers.parseEther("100"));
      expect(await balboa.balanceOf(user2.address)).to.equal(ethers.parseEther("100"));
    });

    it("Should handle rapid pause/unpause cycles", async function () {
      for (let i = 0; i < 5; i++) {
        await balboa.connect(pauser).pause();
        expect(await balboa.paused()).to.be.true;
        
        await balboa.connect(pauser).unpause();
        expect(await balboa.paused()).to.be.false;
      }
    });

    it("Should prevent double pause", async function () {
      await balboa.connect(pauser).pause();
      await expect(balboa.connect(pauser).pause()).to.be.reverted;
    });

    it("Should prevent double unpause", async function () {
      await expect(balboa.connect(pauser).unpause()).to.be.reverted;
    });
  });

  // =============================================================================
  // BLACKLIST FUNCTIONALITY
  // =============================================================================

  describe("7. Blacklist", function () {
    beforeEach(async function () {
      await balboa.connect(minter).mint(user1.address, ethers.parseEther("1000"));
    });

    it("Should allow blacklister to blacklist address", async function () {
      await balboa.connect(blacklister).blacklist(attacker.address);
      expect(await balboa.isBlacklisted(attacker.address)).to.be.true;
    });

    it("Should allow blacklister to unblacklist address", async function () {
      await balboa.connect(blacklister).blacklist(attacker.address);
      await balboa.connect(blacklister).unBlacklist(attacker.address);
      expect(await balboa.isBlacklisted(attacker.address)).to.be.false;
    });

    it("Should prevent non-blacklister from blacklisting", async function () {
      await expect(
        balboa.connect(attacker).blacklist(user1.address)
      ).to.be.reverted;
    });

    it("Should prevent blacklisting zero address", async function () {
      await expect(
        balboa.connect(blacklister).blacklist(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(balboa, "ZeroAddress");
    });

    it("Should prevent blacklisted address from sending tokens", async function () {
      await balboa.connect(blacklister).blacklist(user1.address);
      
      await expect(
        balboa.connect(user1).transfer(user2.address, ethers.parseEther("100"))
      ).to.be.revertedWithCustomError(balboa, "AccountBlacklisted");
    });

    it("Should prevent blacklisted address from receiving tokens", async function () {
      await balboa.connect(blacklister).blacklist(attacker.address);
      
      await expect(
        balboa.connect(user1).transfer(attacker.address, ethers.parseEther("100"))
      ).to.be.revertedWithCustomError(balboa, "AccountBlacklisted");
    });

    it("Should allow transfers after unblacklisting", async function () {
      await balboa.connect(blacklister).blacklist(user1.address);
      await balboa.connect(blacklister).unBlacklist(user1.address);
      
      await balboa.connect(user1).transfer(user2.address, ethers.parseEther("100"));
      expect(await balboa.balanceOf(user2.address)).to.equal(ethers.parseEther("100"));
    });

    it("Should emit Blacklisted event", async function () {
      await expect(balboa.connect(blacklister).blacklist(attacker.address))
        .to.emit(balboa, "Blacklisted")
        .withArgs(attacker.address);
    });

    it("Should emit UnBlacklisted event", async function () {
      await balboa.connect(blacklister).blacklist(attacker.address);
      await expect(balboa.connect(blacklister).unBlacklist(attacker.address))
        .to.emit(balboa, "UnBlacklisted")
        .withArgs(attacker.address);
    });

    it("Should handle double blacklisting gracefully", async function () {
      await balboa.connect(blacklister).blacklist(attacker.address);
      await balboa.connect(blacklister).blacklist(attacker.address);
      expect(await balboa.isBlacklisted(attacker.address)).to.be.true;
    });

    it("Should handle double unblacklisting gracefully", async function () {
      await balboa.connect(blacklister).blacklist(attacker.address);
      await balboa.connect(blacklister).unBlacklist(attacker.address);
      await balboa.connect(blacklister).unBlacklist(attacker.address);
      expect(await balboa.isBlacklisted(attacker.address)).to.be.false;
    });

    it("Should prevent self-transfer when blacklisted", async function () {
      await balboa.connect(blacklister).blacklist(user1.address);
      
      await expect(
        balboa.connect(user1).transfer(user1.address, ethers.parseEther("100"))
      ).to.be.revertedWithCustomError(balboa, "AccountBlacklisted");
    });
  });

  // =============================================================================
  // ERC20 STANDARD FUNCTIONALITY
  // =============================================================================

  describe("8. ERC20 Standard", function () {
    beforeEach(async function () {
      await balboa.connect(minter).mint(user1.address, ethers.parseEther("1000"));
    });

    it("Should transfer tokens correctly", async function () {
      await balboa.connect(user1).transfer(user2.address, ethers.parseEther("100"));
      
      expect(await balboa.balanceOf(user2.address)).to.equal(ethers.parseEther("100"));
      expect(await balboa.balanceOf(user1.address)).to.equal(ethers.parseEther("900"));
    });

    it("Should approve allowance correctly", async function () {
      await balboa.connect(user1).approve(user2.address, ethers.parseEther("200"));
      expect(await balboa.allowance(user1.address, user2.address)).to.equal(ethers.parseEther("200"));
    });

    it("Should transferFrom correctly", async function () {
      await balboa.connect(user1).approve(user2.address, ethers.parseEther("200"));
      await balboa.connect(user2).transferFrom(user1.address, attacker.address, ethers.parseEther("100"));
      
      expect(await balboa.balanceOf(attacker.address)).to.equal(ethers.parseEther("100"));
      expect(await balboa.balanceOf(user1.address)).to.equal(ethers.parseEther("900"));
      expect(await balboa.allowance(user1.address, user2.address)).to.equal(ethers.parseEther("100"));
    });

    it("Should handle zero amount transfers gracefully", async function () {
      await balboa.connect(user1).transfer(user2.address, 0);
      expect(await balboa.balanceOf(user2.address)).to.equal(0);
    });

    it("Should handle self-transfers when not blacklisted", async function () {
      const balanceBefore = await balboa.balanceOf(user1.address);
      await balboa.connect(user1).transfer(user1.address, ethers.parseEther("100"));
      expect(await balboa.balanceOf(user1.address)).to.equal(balanceBefore);
    });

    it("Should prevent transfers that exceed balance", async function () {
      await expect(
        balboa.connect(user1).transfer(user2.address, ethers.parseEther("10000"))
      ).to.be.reverted;
    });

    it("Should emit Transfer event", async function () {
      await expect(balboa.connect(user1).transfer(user2.address, ethers.parseEther("100")))
        .to.emit(balboa, "Transfer")
        .withArgs(user1.address, user2.address, ethers.parseEther("100"));
    });

    it("Should emit Approval event", async function () {
      await expect(balboa.connect(user1).approve(user2.address, ethers.parseEther("200")))
        .to.emit(balboa, "Approval")
        .withArgs(user1.address, user2.address, ethers.parseEther("200"));
    });
  });

  // =============================================================================
  // UPGRADE FUNCTIONALITY
  // =============================================================================

  describe("9. Upgrades", function () {
    it("Should prevent upgrade without proper role", async function () {
      const BalboaToken = await ethers.getContractFactory("BalboaToken");
      const newImpl = await BalboaToken.deploy();
      await newImpl.waitForDeployment();

      await expect(
        balboa.connect(attacker).upgradeToAndCall(await newImpl.getAddress(), "0x")
      ).to.be.reverted;
    });

    it("Should allow upgrade with upgrader role", async function () {
      const BalboaToken = await ethers.getContractFactory("BalboaToken");
      const newImpl = await BalboaToken.deploy();
      await newImpl.waitForDeployment();

      await balboa.connect(upgrader).upgradeToAndCall(await newImpl.getAddress(), "0x");
      
      // Contract should still work
      await balboa.connect(minter).mint(user1.address, ethers.parseEther("100"));
      expect(await balboa.balanceOf(user1.address)).to.equal(ethers.parseEther("100"));
    });

    it("Should preserve state after upgrade", async function () {
      await balboa.connect(minter).mint(user1.address, ethers.parseEther("1000"));
      await balboa.connect(blacklister).blacklist(attacker.address);
      
      const balanceBefore = await balboa.balanceOf(user1.address);
      const isBlacklistedBefore = await balboa.isBlacklisted(attacker.address);
      
      const BalboaToken = await ethers.getContractFactory("BalboaToken");
      const newImpl = await BalboaToken.deploy();
      await newImpl.waitForDeployment();
      await balboa.connect(upgrader).upgradeToAndCall(await newImpl.getAddress(), "0x");
      
      expect(await balboa.balanceOf(user1.address)).to.equal(balanceBefore);
      expect(await balboa.isBlacklisted(attacker.address)).to.equal(isBlacklistedBefore);
    });
  });

  // =============================================================================
  // MULTI-STEP ATTACK SCENARIOS
  // =============================================================================

  describe("10. Multi-Step Attack Scenarios", function () {
    it("Should prevent mint-transfer-burn attack on blacklisted address", async function () {
      await balboa.connect(minter).mint(attacker.address, ethers.parseEther("1000"));
      await balboa.connect(blacklister).blacklist(attacker.address);
      
      await expect(
        balboa.connect(attacker).transfer(user1.address, ethers.parseEther("100"))
      ).to.be.revertedWithCustomError(balboa, "AccountBlacklisted");
      
      await expect(
        balboa.connect(minter).mint(attacker.address, ethers.parseEther("100"))
      ).to.be.revertedWithCustomError(balboa, "AccountBlacklisted");
      
      await balboa.connect(burner).burn(attacker.address, ethers.parseEther("500"));
      expect(await balboa.balanceOf(attacker.address)).to.equal(ethers.parseEther("500"));
    });

    it("Should handle pause during active blacklist", async function () {
      await balboa.connect(minter).mint(user1.address, ethers.parseEther("1000"));
      await balboa.connect(blacklister).blacklist(attacker.address);
      await balboa.connect(pauser).pause();
      
      await expect(
        balboa.connect(user1).transfer(user2.address, ethers.parseEther("100"))
      ).to.be.reverted;
    });
  });

  // =============================================================================
  // GAS LIMIT & EXTREME VALUES
  // =============================================================================

  describe("11. Extreme Values & Edge Cases", function () {
    it("Should handle large mint amounts", async function () {
      const largeAmount = ethers.parseEther("1000000000");
      await balboa.connect(minter).mint(user1.address, largeAmount);
      expect(await balboa.balanceOf(user1.address)).to.equal(largeAmount);
      
      const veryLargeAmount = ethers.parseEther("999999999999");
      await balboa.connect(minter).mint(user1.address, veryLargeAmount);
      expect(await balboa.balanceOf(user1.address)).to.equal(largeAmount + veryLargeAmount);
    });

    it("Should handle multiple sequential operations without gas issues", async function () {
      for (let i = 0; i < 10; i++) {
        await balboa.connect(minter).mint(user1.address, ethers.parseEther("100"));
      }
      expect(await balboa.balanceOf(user1.address)).to.equal(ethers.parseEther("1000"));
    });

    it("Should handle blacklist/unblacklist cycling", async function () {
      for (let i = 0; i < 5; i++) {
        await balboa.connect(blacklister).blacklist(attacker.address);
        await balboa.connect(blacklister).unBlacklist(attacker.address);
      }
      expect(await balboa.isBlacklisted(attacker.address)).to.be.false;
    });

    it("Should track total supply correctly across complex operations", async function () {
      await balboa.connect(minter).mint(user1.address, ethers.parseEther("1000"));
      expect(await balboa.totalSupply()).to.equal(ethers.parseEther("1000"));
      
      await balboa.connect(minter).mint(user2.address, ethers.parseEther("500"));
      expect(await balboa.totalSupply()).to.equal(ethers.parseEther("1500"));
      
      await balboa.connect(burner).burn(user1.address, ethers.parseEther("300"));
      expect(await balboa.totalSupply()).to.equal(ethers.parseEther("1200"));
      
      await balboa.connect(user2).burnSelf(ethers.parseEther("200"));
      expect(await balboa.totalSupply()).to.equal(ethers.parseEther("1000"));
    });
  });

});
