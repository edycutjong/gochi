// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract Gochi is ERC721 {
    uint256 private _tokenIds;

    mapping(uint256 => bytes32) public personalitySeed;
    mapping(uint256 => uint256) public birthTimestamp;

    string private _baseTokenURI;

    event GochiMinted(uint256 indexed tokenId, address indexed owner, bytes32 seed);

    constructor(string memory baseURI) ERC721("Gochi", "GOCHI") {
        _baseTokenURI = baseURI;
    }

    function mint() external returns (uint256) {
        _tokenIds++;
        uint256 newId = _tokenIds;
        bytes32 seed = keccak256(abi.encodePacked(msg.sender, block.timestamp, newId));

        _safeMint(msg.sender, newId);
        personalitySeed[newId] = seed;
        birthTimestamp[newId] = block.timestamp;

        emit GochiMinted(newId, msg.sender, seed);
        return newId;
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    function setBaseURI(string calldata baseURI) external {
        // In production this should be owner-restricted; for hackathon left open
        _baseTokenURI = baseURI;
    }

    function totalSupply() external view returns (uint256) {
        return _tokenIds;
    }
}
