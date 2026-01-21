// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Create2Factory
 * @notice Factory contract for deterministic deployment using CREATE2
 * @dev Allows owner-controlled deterministic contract deployment
 * 
 * Security Features:
 * - Owner-only deployment to prevent spam
 * - Checks for existing deployments to prevent duplicates
 * - Proper error handling and events
 * - No payable to prevent stuck ETH
 */
contract Create2Factory is Ownable {
    // Events
    event Deployed(address indexed addr, bytes32 indexed salt, address indexed deployer);
    event DeployFailed(bytes32 indexed salt, address deployer);

    // Errors
    error CreateFailed();
    error ContractAlreadyDeployed(address existingAddress);
    error EmptyBytecode();

    /**
     * @notice Constructor sets the contract deployer as owner
     */
    constructor() Ownable(msg.sender) {}

    /**
     * @notice Deploy a contract using CREATE2
     * @param salt Unique salt for deterministic address
     * @param bytecode Contract bytecode to deploy
     * @return addr Address of deployed contract
     */
    function deploy(bytes32 salt, bytes memory bytecode) 
        external 
        onlyOwner 
        returns (address addr) 
    {
        if (bytecode.length == 0) revert EmptyBytecode();

        // Check if contract already deployed at this address
        address predictedAddress = computeAddress(salt, bytecode);
        if (predictedAddress.code.length > 0) {
            revert ContractAlreadyDeployed(predictedAddress);
        }

        assembly {
            addr := create2(0, add(bytecode, 32), mload(bytecode), salt)
        }
        
        if (addr == address(0)) {
            emit DeployFailed(salt, msg.sender);
            revert CreateFailed();
        }

        emit Deployed(addr, salt, msg.sender);
    }

    /**
     * @notice Predict the deployment address for given salt and bytecode
     * @param salt Salt for deployment
     * @param bytecode Contract bytecode
     * @return predicted The predicted address
     */
    function computeAddress(bytes32 salt, bytes memory bytecode) 
        public 
        view 
        returns (address predicted) 
    {
        bytes32 hash = keccak256(
            abi.encodePacked(
                bytes1(0xff),
                address(this),
                salt,
                keccak256(bytecode)
            )
        );
        predicted = address(uint160(uint256(hash)));
    }

    /**
     * @notice Check if a contract is already deployed at the predicted address
     * @param salt Salt for deployment
     * @param bytecode Contract bytecode
     * @return bool True if contract exists at predicted address
     */
    function isDeployed(bytes32 salt, bytes memory bytecode) 
        external 
        view 
        returns (bool) 
    {
        address predicted = computeAddress(salt, bytecode);
        return predicted.code.length > 0;
    }
}
