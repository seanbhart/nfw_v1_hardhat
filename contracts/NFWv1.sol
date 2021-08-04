// // SPDX-License-Identifier: MIT
// pragma solidity ^0.8.0;

// import 'hardhat/console.sol';
// import '@openzeppelin/contracts/access/Ownable.sol';
// import '@openzeppelin/contracts/token/ERC721/presets/ERC721PresetMinterPauserAutoId.sol';


// contract NFWv1 is Ownable, ERC721PresetMinterPauserAutoId {
//     mapping(uint => mapping(address => uint)) public getScoreboard;
    
//     constructor(
//         string memory _name,
//         string memory _symbol,
//         string memory _baseURI
//     ) ERC721PresetMinterPauserAutoId(_name, _symbol, _baseURI) Ownable() {}

//     function updateScoreboard(
//         uint _tokenId,
//         address _user,
//         uint _score
//     ) public virtual onlyOwner() {
//         getScoreboard[_tokenId][_user] = _score;
//     }
// }
