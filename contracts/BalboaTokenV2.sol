// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./BalboaToken.sol";

/**
 * @title BalboaTokenV2
 * @notice Upgrade implementation that changes token symbol to BALBOA1
 * @dev Upgrade-safe: no storage layout changes; only overrides view behavior.
 */
contract BalboaTokenV2 is BalboaToken {
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() BalboaToken() {}

    function symbol() public view override returns (string memory) {
        return "BALBOA1";
    }
}
