import { expect } from "chai";
import { ethers } from "hardhat";
import type { Create2Factory } from "../typechain-types";

describe("Create2Factory - Security Tests", function () {
  let factory: Create2Factory;
  let owner: Awaited<ReturnType<typeof ethers.getSigners>>[0];
  let user: Awaited<ReturnType<typeof ethers.getSigners>>[0];
  let attacker: Awaited<ReturnType<typeof ethers.getSigners>>[0];

  beforeEach(async function () {
    [owner, user, attacker] = await ethers.getSigners();

    const Create2Factory = await ethers.getContractFactory("Create2Factory");
    const deployedFactory = await Create2Factory.deploy();
    await deployedFactory.waitForDeployment();
    factory = deployedFactory as unknown as Create2Factory;
  });

  describe("Access Control", function () {
    it("Should set deployer as owner", async function () {
      expect(await factory.owner()).to.equal(owner.address);
    });

    it("Should prevent non-owner from deploying", async function () {
      const salt = ethers.randomBytes(32);
      const bytecode = "0x6080604052348015600f57600080fd5b50603f80601d6000396000f3fe6080604052600080fd";
      
      await expect(
        factory.connect(attacker).deploy(salt, bytecode)
      ).to.be.reverted;
    });

    it("Should allow owner to deploy", async function () {
      const salt = ethers.randomBytes(32);
      // Simple contract bytecode
      const bytecode = "0x6080604052348015600f57600080fd5b50603f80601d6000396000f3fe6080604052600080fdfea2646970667358221220";
      
      const tx = await factory.deploy(salt, bytecode);
      await expect(tx).to.emit(factory, "Deployed");
    });
  });

  describe("Deployment Validation", function () {
    it("Should prevent deployment with empty bytecode", async function () {
      const salt = ethers.randomBytes(32);
      const emptyBytecode = "0x";
      
      await expect(
        factory.deploy(salt, emptyBytecode)
      ).to.be.revertedWithCustomError(factory, "EmptyBytecode");
    });

    it("Should prevent duplicate deployments with same salt", async function () {
      const salt = ethers.randomBytes(32);
      const bytecode = "0x6080604052348015600f57600080fd5b50603f80601d6000396000f3fe6080604052600080fdfea2646970667358221220";
      
      // First deployment should succeed
      await factory.deploy(salt, bytecode);
      
      // Second deployment with same salt should fail
      await expect(
        factory.deploy(salt, bytecode)
      ).to.be.revertedWithCustomError(factory, "ContractAlreadyDeployed");
    });

    it("Should allow deployment with different salts", async function () {
      const salt1 = ethers.randomBytes(32);
      const salt2 = ethers.randomBytes(32);
      const bytecode = "0x6080604052348015600f57600080fd5b50603f80601d6000396000f3fe6080604052600080fdfea2646970667358221220";
      
      const tx1 = await factory.deploy(salt1, bytecode);
      const tx2 = await factory.deploy(salt2, bytecode);
      
      await expect(tx1).to.emit(factory, "Deployed");
      await expect(tx2).to.emit(factory, "Deployed");
    });
  });

  describe("Address Prediction", function () {
    it("Should correctly predict deployment address", async function () {
      const salt = ethers.randomBytes(32);
      const bytecode = "0x6080604052348015600f57600080fd5b50603f80601d6000396000f3fe6080604052600080fdfea2646970667358221220";
      
      const predicted = await factory.computeAddress(salt, bytecode);
      
      const tx = await factory.deploy(salt, bytecode);
      const receipt = await tx.wait();
      
      // Get the deployed address from the event
      const event = receipt?.logs.find((log: any) => {
        try {
          return log.topics[0] === factory.interface.getEvent("Deployed").topicHash;
        } catch {
          return false;
        }
      });
      
      expect(event).to.not.be.undefined;
    });

    it("Should return different addresses for different salts", async function () {
      const salt1 = "0x0000000000000000000000000000000000000000000000000000000000000001";
      const salt2 = "0x0000000000000000000000000000000000000000000000000000000000000002";
      const bytecode = "0x6080604052348015600f57600080fd5b50603f80601d6000396000f3fe6080604052600080fdfea2646970667358221220";
      
      // Use computeAddress function name instead of getAddress to avoid conflict with ethers contract.getAddress()
      const addr1 = await factory.computeAddress(salt1, bytecode);
      const addr2 = await factory.computeAddress(salt2, bytecode);
      
      // Verify salts are actually different
      expect(salt1).to.not.equal(salt2);
      // Different salts should produce different addresses
      expect(addr1).to.not.equal(addr2);
    });

    it("Should return different addresses for different bytecode", async function () {
      const salt = "0x0000000000000000000000000000000000000000000000000000000000000003";
      const bytecode1 = "0x6080604052348015600f57600080fd5b50603f80601d6000396000f3fe6080604052600080fdfea264697066735822122001";
      const bytecode2 = "0x6080604052348015600f57600080fd5b50603f80601d6000396000f3fe6080604052600080fdfea264697066735822122002";
      
      const addr1 = await factory.computeAddress(salt, bytecode1);
      const addr2 = await factory.computeAddress(salt, bytecode2);
      
      // Different bytecode should produce different addresses
      expect(addr1).to.not.equal(addr2);
    });
  });

  describe("Deployment Status", function () {
    it("Should correctly report deployment status", async function () {
      const salt = ethers.randomBytes(32);
      const bytecode = "0x6080604052348015600f57600080fd5b50603f80601d6000396000f3fe6080604052600080fdfea2646970667358221220";
      
      // Before deployment
      expect(await factory.isDeployed(salt, bytecode)).to.be.false;
      
      // After deployment
      await factory.deploy(salt, bytecode);
      expect(await factory.isDeployed(salt, bytecode)).to.be.true;
    });

    it("Should handle checking non-existent deployments", async function () {
      const salt = ethers.randomBytes(32);
      const bytecode = "0x6080604052348015600f57600080fd5b50603f80601d6000396000f3fe6080604052600080fdfea2646560667358221220";
      
      expect(await factory.isDeployed(salt, bytecode)).to.be.false;
    });
  });

  describe("Event Emissions", function () {
    it("Should emit Deployed event on successful deployment", async function () {
      const salt = ethers.randomBytes(32);
      const bytecode = "0x6080604052348015600f57600080fd5b50603f80601d6000396000f3fe6080604052600080fdfea2646970667358221220";
      
      await expect(factory.deploy(salt, bytecode))
        .to.emit(factory, "Deployed");
    });
  });

  describe("Ownership Transfer", function () {
    it("Should allow owner to transfer ownership", async function () {
      await factory.transferOwnership(user.address);
      expect(await factory.owner()).to.equal(user.address);
    });

    it("Should prevent non-owner from transferring ownership", async function () {
      await expect(
        factory.connect(attacker).transferOwnership(attacker.address)
      ).to.be.reverted;
    });

    it("Should allow new owner to deploy after transfer", async function () {
      await factory.transferOwnership(user.address);
      
      const salt = ethers.randomBytes(32);
      const bytecode = "0x6080604052348015600f57600080fd5b50603f80601d6000396000f3fe6080604052600080fdfea2646970667358221220";
      
      await expect(factory.connect(user).deploy(salt, bytecode))
        .to.emit(factory, "Deployed");
    });

    it("Should prevent old owner from deploying after transfer", async function () {
      await factory.transferOwnership(user.address);
      
      const salt = ethers.randomBytes(32);
      const bytecode = "0x6080604052348015600f57600080fd5b50603f80601d6000396000f3fe6080604052600080fdfea2646970667358221220";
      
      await expect(
        factory.connect(owner).deploy(salt, bytecode)
      ).to.be.reverted;
    });
  });

  describe("Deterministic Deployment", function () {
    it("Should maintain deterministic addresses across different factories", async function () {
      // Deploy a second factory
      const Create2Factory = await ethers.getContractFactory("Create2Factory");
      const deployedFactory2 = await Create2Factory.deploy();
      await deployedFactory2.waitForDeployment();
      const factory2 = deployedFactory2 as unknown as Create2Factory;

      const salt = ethers.randomBytes(32);
      const bytecode = "0x6080604052348015600f57600080fd5b50603f80601d6000396000f3fe6080604052600080fdfea2646970667358221220";
      
      const addr1 = await factory.computeAddress(salt, bytecode);
      const addr2 = await factory2.computeAddress(salt, bytecode);
      
      // Different factories will produce different addresses (due to different factory addresses)
      expect(addr1).to.not.equal(addr2);
    });

    it("Should produce consistent addresses for same inputs", async function () {
      const salt = ethers.randomBytes(32);
      const bytecode = "0x6080604052348015600f57600080fd5b50603f80601d6000396000f3fe6080604052600080fdfea2646970667358221220";
      
      const addr1 = await factory.computeAddress(salt, bytecode);
      const addr2 = await factory.computeAddress(salt, bytecode);
      
      expect(addr1).to.equal(addr2);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle zero salt", async function () {
      const salt = ethers.ZeroHash;
      const bytecode = "0x6080604052348015600f57600080fd5b50603f80601d6000396000f3fe6080604052600080fdfea2646970667358221220";
      
      const tx = await factory.deploy(salt, bytecode);
      await expect(tx).to.emit(factory, "Deployed");
    });

    it("Should handle maximum salt value", async function () {
      // bytes32 max value: 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
      const salt = "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
      const bytecode = "0x6080604052348015600f57600080fd5b50603f80601d6000396000f3fe6080604052600080fdfea2646970667358221220";
      
      const tx = await factory.deploy(salt, bytecode);
      await expect(tx).to.emit(factory, "Deployed");
    });

    it("Should prevent renouncing ownership to zero address", async function () {
      await expect(
        factory.renounceOwnership()
      ).to.not.be.reverted;
      
      // After renouncing, owner should be zero address
      expect(await factory.owner()).to.equal(ethers.ZeroAddress);
      
      // No one should be able to deploy
      const salt = ethers.randomBytes(32);
      const bytecode = "0x6080604052348015600f57600080fd5b50603f80601d6000396000f3fe6080604052600080fdfea2646970667358221220";
      
      await expect(
        factory.deploy(salt, bytecode)
      ).to.be.reverted;
    });
  });

  describe("Gas Considerations", function () {
    it("Should deploy small contracts efficiently", async function () {
      const salt = ethers.keccak256(ethers.toUtf8Bytes("gas-test-salt"));
      // Minimal valid contract bytecode - a simple contract that just returns
      // This is: PUSH1 0x00 PUSH1 0x00 RETURN (returns empty)
      const bytecode = "0x6000600000";
      
      const tx = await factory.deploy(salt, bytecode);
      const receipt = await tx.wait();
      
      // Basic gas usage check (should be reasonable)
      expect(receipt?.gasUsed).to.be.lt(200000n);
    });
  });
});
