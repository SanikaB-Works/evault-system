// SPDX-License-Identifier: MIT
pragma solidity 0.8.0;

contract SimpleIPFSContract {
    // Structure to store document information
    struct Document {
        string ipfsHash;
        string fileName;
        uint256 timestamp;
        address uploader;
    }
    
    // Array to store all documents
    Document[] public documents;
    
    // Event emitted when a document is added
    event DocumentAdded(string ipfsHash, string fileName, address uploader, uint256 timestamp);
    
    // Add a new document
    function addDocument(string memory ipfsHash, string memory fileName) public {
        documents.push(Document({
            ipfsHash: ipfsHash,
            fileName: fileName,
            timestamp: block.timestamp,
            uploader: msg.sender
        }));
        
        emit DocumentAdded(ipfsHash, fileName, msg.sender, block.timestamp);
    }
    
    // Get the number of documents
    function getDocumentCount() public view returns (uint256) {
        return documents.length;
    }
    
    // Get document details by index
    function getDocument(uint256 index) public view returns (string memory, string memory, uint256, address) {
        require(index < documents.length, "Index out of bounds");
        Document memory doc = documents[index];
        return (doc.ipfsHash, doc.fileName, doc.timestamp, doc.uploader);
    }
    
    // Verify if a document exists
    function verifyDocument(string memory ipfsHash) public view returns (bool, uint256, address) {
        for (uint i = 0; i < documents.length; i++) {
            // Compare the hash strings
            if (keccak256(bytes(documents[i].ipfsHash)) == keccak256(bytes(ipfsHash))) {
                return (true, documents[i].timestamp, documents[i].uploader);
            }
        }
        return (false, 0, address(0));
    }
} 