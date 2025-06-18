const fs = require('fs');
const path = require('path');
const Web3 = require('web3');

// Connect to Ganache
const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));

// Contract ABI
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

// Contract bytecode (this is the compiled bytecode of a simple storage contract)
const bytecode = "0x608060405234801561001057600080fd5b50610771806100206000396000f3fe608060405234801561001057600080fd5b50600436106100575760003560e01c80632e64cec11461005c5780636057361d1461007a578063767800de146100965780639e7a13ad146100b4578063aa0b7db9146100e9575b600080fd5b610064610105565b60405161007191906104bc565b60405180910390f35b610094600480360381019061008f91906103e9565b61010e565b005b61009e610118565b6040516100ab91906104d7565b60405180910390f35b6100ce60048036038101906100c991906103e9565b61013e565b6040516100e0969594939291906105df565b60405180910390f35b61010360048036038101906100fe91906102d5565b6102a3565b005b60008054905090565b8060008190555050565b60008060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16905090565b6001818154811061014e57600080fd5b90600052602060002090600602016000915090508060000180546101719061069e565b80601f016020809104026020016040519081016040528092919081815260200182805461019d9061069e565b80156101ea5780601f106101bf576101008083540402835291602001916101ea565b820191906000526020600020905b8154815290600101906020018083116101cd57829003601f168201915b5050505050908060010180546101ff9061069e565b80601f016020809104026020016040519081016040528092919081815260200182805461022b9061069e565b80156102785780601f1061024d57610100808354040283529160200191610278565b820191906000526020600020905b81548152906001019060200180831161025b57829003601f168201915b5050505050908060020154908060030154908060040154908060050154905086565b60006001604051806060016040528085815260200184815260200142815250908060018154018082558091505060019003906000526020600020906006020160009091909190915060008201518160000190816102ff91906106f2565b5060208201518160010190816103159190610789565b5060408201518160020155505050505056fe608060405234801561001057600080fd5b506107bf806100206000396000f3fe608060405234801561001057600080fd5b506004361061004c5760003560e01c80632e64cec11461005157806360fe47b11461006f5780636f760f41146100a1578063707129391461011f575b600080fd5b61005961013b565b60405161006691906104b0565b60405180910390f35b61008960048036038101906100849190610395565b610145565b60405161009893929190610628565b60405180910390f35b6100a96101c3565b6040516100b6919061054d565b60405180910390f35b61012961042f565b6040516101369190610447565b60405180910390f35b60006001905090565b60006000600183815481106101615761016061073a565b5b9060005260206000209060020201600001546001848154811061018757610186610769565b5b90600052602060002090600202016001015442925092509250909192565b6000600180549050905090565b600082823560208401925080838360005b838110156101d7578082015181840152602081019050610172565b50505050905001935050505060405160208101016040528060f081526020016100c160f0913960f01b8152836000908060018154018082558091505060019003906000526020600020906002020160009091909190915060008201518160000155600182015181600101556002820151816002015550505050565b6040518060400160405280600290602082028036833780820191505090505090565b6000815190506103a6816104a9565b92915050565b6000813590506103bb816104c2565b92915050565b6000604051905062000043601f19601f8301602001604051610269565b9250505090565b6000604051905090565b600080fd5b600080fd5b6000601f19601f8301169050919050565b610363838261035a565b8160200280845260208301816000600187013f19601f85011660105286604052505050565b61038f816101f9565b810181811067ffffffffffffffff821117156103ae576103ad6102d4565b5b91905051945050505050565b6103c281610483565b81146103cd57600080fd5b50565b6000813590506103df816103b9565b92915050565b6000608083016103fa86610298565b905061040a838285610363565b9150509250925092565b61041d81610483565b82525050565b6000602082019050610438600083018461037c565b6000602082019050610453600083018461046d565b61045e3660008301610452565b505060006004820190508190509190505660a365627a7a723058209ee9c8da45ed35e1ce4fffb70772aa3c8da5b5e7f807cc7c90cb4db91c3e9f2d6c6578706572696d656e74616cf564736f6c63430008000033";

async function deployContract() {
  try {
    console.log("Getting accounts from Ganache...");
    const accounts = await web3.eth.getAccounts();
    console.log(`Using account ${accounts[0]} for deployment`);

    // Create contract instance
    const contract = new web3.eth.Contract(contractABI);
    
    console.log("Deploying contract...");
    const deployedContract = await contract.deploy({
      data: bytecode
    }).send({
      from: accounts[0],
      gas: 3000000
    });

    console.log("Contract deployed at address:", deployedContract.options.address);
    
    // Save contract data to files
    fs.writeFileSync(
      path.join(__dirname, 'contract-abi.json'),
      JSON.stringify(contractABI, null, 2)
    );
    
    fs.writeFileSync(
      path.join(__dirname, 'contract-address.json'),
      JSON.stringify({ address: deployedContract.options.address }, null, 2)
    );
    
    console.log("Deployment successful! Contract data saved.");
    return deployedContract;
  } catch (error) {
    console.error("Error deploying contract:", error);
    process.exit(1);
  }
}

// Execute deployment
deployContract(); 