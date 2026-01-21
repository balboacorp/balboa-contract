// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";

/**
 * @title BalboaToken
 * @notice UUPS Upgradeable ERC20 token with access control and pausable features
 * @dev Implements role-based access control for minting, burning, pausing, and upgrading
 * 
 * Security Features:
 * - Pausable: Can pause transfers in emergency
 * - Blacklist: Can block malicious addresses
 * - Role-based access control: Separate roles for different operations
 * - Reentrancy protection: Guards against reentrancy attacks
 * - Zero address checks: Prevents accidental burns/mints to zero address
 */
contract BalboaToken is 
    Initializable, 
    ERC20Upgradeable, 
    AccessControlUpgradeable, 
    UUPSUpgradeable,
    PausableUpgradeable,
    ReentrancyGuardUpgradeable
{
    // Roles
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant BLACKLISTER_ROLE = keccak256("BLACKLISTER_ROLE");

    // Blacklist mapping
    mapping(address => bool) private _blacklisted;

    // Events
    event Blacklisted(address indexed account);
    event UnBlacklisted(address indexed account);
    event TokensBurned(address indexed from, uint256 amount);
    event TokensMinted(address indexed to, uint256 amount);

    // Errors
    error ZeroAddress();
    error ZeroAmount();
    error AccountBlacklisted(address account);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() { 
        _disableInitializers(); 
    }

    /**
     * @notice Initialize the token
     * @param admin Address that will receive all roles
     */
    function initialize(address admin) public initializer {
        if (admin == address(0)) revert ZeroAddress();

        __ERC20_init("BALBOA", "BALBOA");
        __AccessControl_init();
        __UUPSUpgradeable_init();
        __Pausable_init();
        __ReentrancyGuard_init();

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(UPGRADER_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
        _grantRole(BURNER_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
        _grantRole(BLACKLISTER_ROLE, admin);
    }

    /**
     * @notice Mint new tokens
     * @param to Address to receive tokens
     * @param amount Amount to mint
     */
    function mint(address to, uint256 amount) 
        external 
        onlyRole(MINTER_ROLE)
        whenNotPaused 
        nonReentrant 
    {
        if (to == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        if (_blacklisted[to]) revert AccountBlacklisted(to);

        _mint(to, amount);
        emit TokensMinted(to, amount);
    }

    /**
     * @notice Burn tokens from an address
     * @param from Address to burn from
     * @param amount Amount to burn
     */
    function burn(address from, uint256 amount) 
        external 
        onlyRole(BURNER_ROLE)
        nonReentrant 
    {
        if (from == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();

        _burn(from, amount);
        emit TokensBurned(from, amount);
    }

    /**
     * @notice Burn tokens from caller's balance
     * @param amount Amount to burn
     */
    function burnSelf(uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        
        _burn(msg.sender, amount);
        emit TokensBurned(msg.sender, amount);
    }

    /**
     * @notice Pause all token transfers
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @notice Unpause token transfers
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /**
     * @notice Add address to blacklist
     * @param account Address to blacklist
     */
    function blacklist(address account) external onlyRole(BLACKLISTER_ROLE) {
        if (account == address(0)) revert ZeroAddress();
        if (!_blacklisted[account]) {
            _blacklisted[account] = true;
            emit Blacklisted(account);
        }
    }

    /**
     * @notice Remove address from blacklist
     * @param account Address to unblacklist
     */
    function unBlacklist(address account) external onlyRole(BLACKLISTER_ROLE) {
        if (_blacklisted[account]) {
            _blacklisted[account] = false;
            emit UnBlacklisted(account);
        }
    }

    /**
     * @notice Check if address is blacklisted
     * @param account Address to check
     * @return bool True if blacklisted
     */
    function isBlacklisted(address account) external view returns (bool) {
        return _blacklisted[account];
    }

    /**
     * @dev Override to add pause and blacklist checks
     * Note: Blacklisted addresses can still burn their own tokens (to == address(0))
     */
    function _update(address from, address to, uint256 value)
        internal
        override
        whenNotPaused
    {
        // Check blacklist - allow burns (to == address(0)) even if from is blacklisted
        if (to != address(0) && _blacklisted[from]) revert AccountBlacklisted(from);
        if (_blacklisted[to]) revert AccountBlacklisted(to);

        super._update(from, to, value);
    }

    /**
     * @dev Authorize upgrade - only UPGRADER_ROLE can upgrade
     */
    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyRole(UPGRADER_ROLE)
    {
        // Additional upgrade validation can be added here
        // e.g., timelock checks, multi-sig requirements
    }

    /**
     * @dev This empty reserved space is put in place to allow future versions
     * to add new variables without shifting down storage in the inheritance chain.
     */
    uint256[49] private __gap;
}
