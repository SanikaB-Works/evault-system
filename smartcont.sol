// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

contract IPFSContract {
    address public owner;
    
    struct Document {
        string ipfsHash;
        string fileName;
        uint256 timestamp;
        address uploader;
    }
    
    Document[] public documents;
    mapping(address => bool) public allowedAddresses; // Mapping to store allowed wallet addresses

    // Events
    event DocumentAdded(string ipfsHash, string fileName, address uploader, uint256 timestamp);
    event AddressStatusChanged(address walletAddress, bool isAllowed);

    constructor() {
        owner = msg.sender;
        // Add owner as allowed by default
        allowedAddresses[msg.sender] = true;
    }

    // Modifier to restrict access to allowed addresses
    modifier onlyAllowed() {
        require(allowedAddresses[msg.sender], "Not an allowed address");
        _;
    }
    
    // Modifier to restrict access to owner
    modifier onlyOwner() {
        require(msg.sender == owner, "Not the contract owner");
        _;
    }

    function addDocument(string memory ipfsHash, string memory fileName) public onlyAllowed {
        documents.push(Document({
            ipfsHash: ipfsHash,
            fileName: fileName,
            timestamp: block.timestamp,
            uploader: msg.sender
        }));
        
        emit DocumentAdded(ipfsHash, fileName, msg.sender, block.timestamp);
    }

    function getDocumentCount() public view returns (uint256) {
        return documents.length;
    }

    function getDocument(uint256 index) public view returns (string memory, string memory, uint256, address) {
        require(index < documents.length, "Index out of bounds");
        Document memory doc = documents[index];
        return (doc.ipfsHash, doc.fileName, doc.timestamp, doc.uploader);
    }
    
    function verifyDocument(string memory ipfsHash) public view returns (bool, uint256, address) {
        for (uint i = 0; i < documents.length; i++) {
            if (keccak256(abi.encodePacked(documents[i].ipfsHash)) == keccak256(abi.encodePacked(ipfsHash))) {
                return (true, documents[i].timestamp, documents[i].uploader);
            }
        }
        return (false, 0, address(0));
    }

    // Function to add or remove allowed addresses (only callable by the owner)
    function toggleAddress(address walletAddress, bool allowed) public onlyOwner {
        allowedAddresses[walletAddress] = allowed;
        emit AddressStatusChanged(walletAddress, allowed);
    }
    
    // Transfer ownership
    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "New owner cannot be zero address");
        owner = newOwner;
    }
}
