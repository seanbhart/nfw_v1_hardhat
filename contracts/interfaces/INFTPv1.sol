// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

interface INFTPv1 {
    function status() external view returns (bool);
    function initialize(string memory _symbol, address _creator) external;

    function deposit() external;
    function withdraw(uint256 amount) external;
}
