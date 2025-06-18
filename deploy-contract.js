const fs = require('fs');
const path = require('path');
const Web3 = require('web3');

// Connect to Ganache
const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));

// Simple IPFS contract - using a more compatible, simpler version
const contractSource = `
// SPDX-License-Identifier: MIT
pragma solidity 0.8.0;

contract IPFSContract {
    address public owner;
    
    struct Document {
        string ipfsHash;
        string fileName;
        uint256 timestamp;
        address uploader;
    }
    
    Document[] public documents;
    mapping(address => bool) public allowedAddresses;

    event DocumentAdded(string ipfsHash, string fileName, address uploader, uint256 timestamp);
    
    constructor() {
        owner = msg.sender;
        allowedAddresses[msg.sender] = true;
    }
    
    modifier onlyAllowed() {
        require(allowedAddresses[msg.sender], "Not allowed");
        _;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
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

    function toggleAddress(address walletAddress, bool allowed) public onlyOwner {
        allowedAddresses[walletAddress] = allowed;
    }
}
`;

// Contract ABI and bytecode (manually included to avoid compilation issues)
const contractABI = [
    {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "string",
                "name": "ipfsHash",
                "type": "string"
            },
            {
                "indexed": false,
                "internalType": "string",
                "name": "fileName",
                "type": "string"
            },
            {
                "indexed": false,
                "internalType": "address",
                "name": "uploader",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "timestamp",
                "type": "uint256"
            }
        ],
        "name": "DocumentAdded",
        "type": "event"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "ipfsHash",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "fileName",
                "type": "string"
            }
        ],
        "name": "addDocument",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "name": "allowedAddresses",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "name": "documents",
        "outputs": [
            {
                "internalType": "string",
                "name": "ipfsHash",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "fileName",
                "type": "string"
            },
            {
                "internalType": "uint256",
                "name": "timestamp",
                "type": "uint256"
            },
            {
                "internalType": "address",
                "name": "uploader",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "index",
                "type": "uint256"
            }
        ],
        "name": "getDocument",
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            },
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            },
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getDocumentCount",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "owner",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "walletAddress",
                "type": "address"
            },
            {
                "internalType": "bool",
                "name": "allowed",
                "type": "bool"
            }
        ],
        "name": "toggleAddress",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "ipfsHash",
                "type": "string"
            }
        ],
        "name": "verifyDocument",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            },
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            },
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
];

// Contract bytecode (this is a placeholder - it will be replaced with the compiled bytecode)
const bytecode = "0x608060405234801561001057600080fd5b50336000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555060016001600060008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060006101000a81548160ff021916908315150217905550610c83806100cf6000396000f3fe608060405234801561001057600080fd5b50600436106100885760003560e01c80638da5cb5b1161005b5780638da5cb5b146101425780639a03d74514610160578063ddb7e4bf14610192578063f02435cb146101c257610088565b80636cc77fc31461008d5780636e1de818146100a957806377dae6c8146100dc5780638789d84d14610112575b600080fd5b6100a760048036038101906100a291906108b0565b6101f2565b005b6100c360048036038101906100be919061095e565b610407565b6040516100d394939291906109ba565b60405180910390f35b6100f660048036038101906100f1919061095e565b61051c565b60405161010997969594939291906109fb565b60405180910390f35b61012c60048036038101906101279190610a7b565b610623565b6040516101399190610adb565b60405180910390f35b61014a6106a3565b6040516101579190610b05565b60405180910390f35b61017a60048036038101906101759190610b20565b6106c7565b60405161018993929190610b8e565b60405180910390f35b6101ac60048036038101906101a79190610bd9565b610872565b6040516101b99190610c25565b60405180910390f35b6101dc60048036038101906101d79190610b20565b610892565b6040516101e99190610c25565b60405180910390f35b60008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff161461024a57600080fd5b80600160008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060006101000a81548160ff0219169083151502179055507f9a9e0518a728e06aca2d5998d10ccd81027c5c78af4b8f32cd6c48b5bd7dd8733383604051610402929190610c40565b60405180910390a15050565b6000818154811061041757600080fd5b906000526020600020906004020160009150905080600001805461043a90610c9f565b80601f016020809104026020016040519081016040528092919081815260200182805461046690610c9f565b80156104b35780601f10610488576101008083540402835291602001916104b3565b820191906000526020600020905b81548152906001019060200180831161049657829003601f168201915b5050505050908060010180546104c890610c9f565b80601f01602080910402602001604051908101604052809291908181526020018280546104f490610c9f565b80156105415780601f1061051657610100808354040283529160200191610541565b820191906000526020600020905b81548152906001019060200180831161052457829003601f168201915b5050505050908060020154908060030160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16905084565b6000818154811061052c57600080fd5b90600052602060002090600402016000915090508060000180546104c890610c9f565b600080828154811061055c57610561610cd0565b5b9060005260206000209060040201604051806080016040529081600082018054610588906108cf565b80601f01602080910402602001604051908101604052809291908181526020018280546105b4906108cf565b80156106015780601f106105d657610100808354040283529160200191610601565b820191906000526020600020905b8154815290600101906020018083116105e457829003601f168201915b50505050508152602001600182018054610618906108cf565b8060200260200160";

async function deployContract() {
  try {
    console.log("Getting accounts from Ganache...");
    const accounts = await web3.eth.getAccounts();
    console.log(`Found ${accounts.length} accounts, using ${accounts[0]} for deployment`);

    // Create new contract instance
    const contract = new web3.eth.Contract(contractABI);
    
    console.log("Deploying contract...");
    const deployTx = contract.deploy({
      data: bytecode
    });
    
    // Check gas estimate before deployment
    const gasEstimate = await deployTx.estimateGas();
    console.log(`Gas estimate for deployment: ${gasEstimate}`);
    
    // Deploy with higher gas limit to be safe
    const deployedContract = await deployTx.send({
      from: accounts[0],
      gas: Math.min(5000000, Math.floor(gasEstimate * 1.5)) // Use 150% of the estimated gas, max 5M
    });

    console.log(`Contract deployed successfully at address: ${deployedContract.options.address}`);
    
    // Save contract ABI to a file
    fs.writeFileSync(
      path.join(__dirname, 'contract-abi.json'),
      JSON.stringify(contractABI, null, 2)
    );
    console.log("Contract ABI saved to contract-abi.json");
    
    // Save contract address to a file
    fs.writeFileSync(
      path.join(__dirname, 'contract-address.json'),
      JSON.stringify({ address: deployedContract.options.address }, null, 2)
    );
    console.log("Contract address saved to contract-address.json");
    
    // Test the contract by adding a dummy document
    console.log("Testing contract by adding a document...");
    await deployedContract.methods
      .addDocument("QmTest123", "test.pdf")
      .send({ from: accounts[0], gas: 200000 });
    console.log("Test document added successfully!");
    
    // Get document count to verify
    const count = await deployedContract.methods.getDocumentCount().call();
    console.log(`Document count after test: ${count}`);
    
    console.log("Deployment and testing completed successfully!");
    return { address: deployedContract.options.address, abi: contractABI };
  } catch (error) {
    console.error("Error deploying contract:");
    console.error(error);
    process.exit(1);
  }
}

// Execute the deployment
deployContract(); 