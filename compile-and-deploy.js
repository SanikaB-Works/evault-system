const fs = require('fs');
const path = require('path');
const solc = require('solc');
const Web3 = require('web3');

// Connect to Ganache
const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));

async function compileAndDeploy() {
  try {
    // Read the Solidity contract source code
    const contractPath = path.resolve(__dirname, 'SimpleIPFSContract.sol');
    const source = fs.readFileSync(contractPath, 'UTF-8');

    // Prepare input for solc compiler
    const input = {
      language: 'Solidity',
      sources: {
        'SimpleIPFSContract.sol': {
          content: source
        }
      },
      settings: {
        outputSelection: {
          '*': {
            '*': ['*']
          }
        }
      }
    };

    console.log('Compiling contract...');
    const output = JSON.parse(solc.compile(JSON.stringify(input)));

    // Check for errors
    if (output.errors) {
      output.errors.forEach(error => {
        console.log(error.formattedMessage);
      });
      
      // Only exit on severe errors
      if (output.errors.some(error => error.severity === 'error')) {
        throw new Error('Compilation failed');
      }
    }

    // Get contract details
    const contractName = 'SimpleIPFSContract';
    const contract = output.contracts['SimpleIPFSContract.sol'][contractName];
    
    if (!contract) {
      throw new Error(`Contract ${contractName} not found in compiled output`);
    }
    
    // Extract ABI and bytecode
    const abi = contract.abi;
    const bytecode = contract.evm.bytecode.object;
    
    // Log contract size (useful for debugging deployment issues)
    console.log(`Contract bytecode size: ${bytecode.length / 2} bytes`);
    
    // Save ABI to file
    fs.writeFileSync(
      path.resolve(__dirname, 'contract-abi.json'),
      JSON.stringify(abi, null, 2)
    );
    console.log('Contract ABI saved to contract-abi.json');

    // Get first account for deployment
    const accounts = await web3.eth.getAccounts();
    const deployer = accounts[0];
    console.log(`Deploying from account: ${deployer}`);

    // Create contract instance
    const deployContract = new web3.eth.Contract(abi);
    
    // Deploy contract
    console.log('Deploying contract...');
    const deployedContract = await deployContract
      .deploy({
        data: '0x' + bytecode
      })
      .send({
        from: deployer,
        gas: 3000000
      });
    
    console.log(`Contract deployed at address: ${deployedContract.options.address}`);
    
    // Save contract address to file
    fs.writeFileSync(
      path.resolve(__dirname, 'contract-address.json'),
      JSON.stringify({ address: deployedContract.options.address }, null, 2)
    );
    console.log('Contract address saved to contract-address.json');
    
    // Test the contract
    console.log('\nTesting contract:');
    console.log('Adding a document...');
    
    await deployedContract.methods
      .addDocument('QmTestHash123', 'test-document.pdf')
      .send({ from: deployer, gas: 200000 });
    
    const count = await deployedContract.methods.getDocumentCount().call();
    console.log(`Document count: ${count}`);
    
    if (count > 0) {
      const doc = await deployedContract.methods.getDocument(0).call();
      console.log('Document details:');
      console.log(`IPFS Hash: ${doc[0]}`);
      console.log(`File Name: ${doc[1]}`);
      console.log(`Timestamp: ${new Date(doc[2] * 1000).toISOString()}`);
      console.log(`Uploader: ${doc[3]}`);
    }
    
    // Test document verification
    const verification = await deployedContract.methods.verifyDocument('QmTestHash123').call();
    console.log('\nVerification result:', verification[0] ? 'Document verified' : 'Document not found');
    
    console.log('\nContract deployed and tested successfully!');
    
    return {
      address: deployedContract.options.address,
      abi: abi
    };
  } catch (error) {
    console.error('Error:');
    console.error(error);
    process.exit(1);
  }
}

// Run the function
compileAndDeploy();

/*
To use this contract with your eVault application:

1. Make sure Ganache is running on http://localhost:8545
2. Run this script to compile and deploy the contract: node compile-and-deploy.js
3. The script will save the contract ABI and address in files for your application
4. Start your application: npm start
*/ 