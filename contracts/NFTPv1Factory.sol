// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/access/Ownable.sol';
import './interfaces/INFTPv1.sol';
import './NFTPv1.sol';


contract NFTPv1Factory is Ownable {
    address public feeRecipient;
    address public feeRecipientSetter;

    mapping(string => address) public getToken;
    mapping(string => mapping(address => address)) public getAccountToken;
    string[] public tokenList;

    event TokenCreated(
        address indexed creator_,
        string symbol_,
        address tokenAddress_,
        uint tokenCount_
    );

    constructor(address _feeRecipientSetter) Ownable() {
        feeRecipientSetter = _feeRecipientSetter;
    }

    function tokenListLength() external view returns (uint) {
        return tokenList.length;
    }

    function createToken(string memory _symbol) external {
        require(getToken[_symbol] == address(0), 'NFTPv1: TOKEN_EXISTS');

        address token;
        bytes memory bytecode = type(NFTPv1).creationCode;
        bytes32 salt = keccak256(abi.encodePacked('NFTPv1', _symbol));
        assembly {
            token := create2(0, add(bytecode, 32), mload(bytecode), salt)
        }
        INFTPv1(token).initialize(_symbol, msg.sender);
        getToken[_symbol] = token;
        getAccountToken[_symbol][msg.sender] = token;
        tokenList.push(_symbol);

        emit TokenCreated(msg.sender, _symbol, token, tokenList.length);
    }

    function setFeeRecipient(address _feeRecipient) external {
        require(msg.sender == feeRecipient, 'NFTPv1: FORBIDDEN');
        feeRecipient = _feeRecipient;
    }

    function setFeeRecipientSetter(address _feeRecipientSetter) external {
        require(msg.sender == feeRecipient, 'NFTPv1: FORBIDDEN');
        feeRecipient = _feeRecipientSetter;
    }
}
