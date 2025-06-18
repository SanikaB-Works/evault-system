const express = require("express");
const multer = require("multer");
const fs = require("fs");
require("dotenv").config();
const path = require("path");
const axios = require("axios");
const FormData = require("form-data");
const bodyParser = require("body-parser");
const Web3 = require("web3");

const app = express();
const port = 3000;

// File to store document hashes
const DOCUMENTS_FILE = path.join(__dirname, "documents.json");

// Initialize documents file if it doesn't exist
if (!fs.existsSync(DOCUMENTS_FILE)) {
    fs.writeFileSync(DOCUMENTS_FILE, JSON.stringify({
        documents: []
    }));
}

// Initialize Web3 - connect to local Ethereum node by default
// For production, use a provider like Infura
let web3;
let contract;
let contractAddress;

try {
    // Setup Web3 and contract
    web3 = new Web3(new Web3.providers.HttpProvider(process.env.ETH_PROVIDER || 'http://localhost:8545'));
    
    // Load contract ABI and address
    if (fs.existsSync(path.join(__dirname, "contract-abi.json")) && 
        fs.existsSync(path.join(__dirname, "contract-address.json"))) {
        
        const contractABI = JSON.parse(fs.readFileSync(path.join(__dirname, "contract-abi.json"), 'utf8'));
        const contractData = JSON.parse(fs.readFileSync(path.join(__dirname, "contract-address.json"), 'utf8'));
        contractAddress = contractData.address;
        
        // Create contract instance
        contract = new web3.eth.Contract(contractABI, contractAddress);
        console.log("Ethereum contract loaded at address:", contractAddress);
    } else {
        console.log("Contract ABI or address not found. Blockchain features will be disabled.");
    }
} catch (error) {
    console.error("Error initializing Web3:", error);
    console.log("Continuing without blockchain functionality");
}

const upload = multer({ dest: "uploads/" });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Check if login_page.html exists
const loginPath = path.join(__dirname, 'public', 'login_page.html');
if (!fs.existsSync(loginPath)) {
    console.error(`login_page.html not found at ${loginPath}`);
    process.exit(1); // Exit the process with an error code
}

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(loginPath);
});

// Handle login
app.post('/api/login', (req, res) => {
    const { username, password, userType } = req.body;
    
    // Simple authentication for demo purposes
    if (username === "demo" && password === "demo") {
        if (userType === "lawyer" || userType === "judge") {
            res.json({ 
                success: true, 
                redirectUrl: `/${userType}_dashboard.html`,
                userType: userType
            });
        } else {
            res.status(400).json({ success: false, message: "Invalid user type" });
        }
    } else {
        res.status(401).json({ success: false, message: "Invalid credentials" });
    }
});

// Upload document to IPFS and store the hash
app.post("/uploadToIpfs", upload.single("file"), async (req, res) => {
    const file = req.file;

    if (!file) {
        return res.status(400).send("No file uploaded.");
    }

    const filePath = file.path;
    
    try {
        // Create a form data object
        const formData = new FormData();
        // Add the file to the form data
        const fileStream = fs.createReadStream(filePath);
        formData.append('file', fileStream, { filename: file.originalname });

        // Get Pinata API keys from environment variables
        const pinataApiKey ='74eacb6a0a3aeed0263f';
        const pinataSecretApiKey = 'cee707ecdb13d3812cf90082f0910d10df2705a0c377894cfe618681b077dc4b';

        if (!pinataApiKey || !pinataSecretApiKey) {
            return res.status(500).send("Pinata API keys not configured");
        }

        // Make request to Pinata API
        const response = await axios.post(
            "https://api.pinata.cloud/pinning/pinFileToIPFS",
            formData,
            {
                headers: {
                    'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
                    'pinata_api_key': pinataApiKey,
                    'pinata_secret_api_key': pinataSecretApiKey
                }
            }
        );

        // Get the IPFS hash from the response
        const ipfsHash = response.data.IpfsHash;

        // Store document info in the JSON file
        const documentData = {
            fileName: file.originalname,
            ipfsHash: ipfsHash,
            uploadDate: new Date().toISOString(),
            fileSize: file.size,
            mimeType: file.mimetype,
            verifiedOnBlockchain: false, // New field
            blockchainTxHash: null       // New field
        };

        // Read the current documents
        let documentsData = JSON.parse(fs.readFileSync(DOCUMENTS_FILE));
        documentsData.documents.push(documentData);
        
        // Write back to the file
        fs.writeFileSync(DOCUMENTS_FILE, JSON.stringify(documentsData, null, 2));

        // Add to blockchain if contract is available
        if (contract) {
            try {
                // Get the first account to use for the transaction
                const accounts = await web3.eth.getAccounts();
                const sender = accounts[0];

                // Add document hash to the blockchain
                const tx = await contract.methods.addDocument(ipfsHash, file.originalname)
                    .send({ from: sender, gas: 200000 });
                
                // Update the document data with blockchain info
                documentData.verifiedOnBlockchain = true;
                documentData.blockchainTxHash = tx.transactionHash;
                
                // Update the JSON file
                const documentsDataUpdated = JSON.parse(fs.readFileSync(DOCUMENTS_FILE));
                const docIndex = documentsDataUpdated.documents.length - 1;
                documentsDataUpdated.documents[docIndex] = documentData;
                fs.writeFileSync(DOCUMENTS_FILE, JSON.stringify(documentsDataUpdated, null, 2));
                
                console.log(`Document added to blockchain with transaction: ${tx.transactionHash}`);
            } catch (error) {
                console.error("Error adding document to blockchain:", error);
                // Continue without blockchain verification
            }
        }

        // Format the response to match what the front-end expects
        const result = [{
            path: ipfsHash
        }];

        res.json(result);
    } catch (error) {
        console.error("Error uploading to IPFS:", error);
        res.status(500).send("Error uploading to IPFS");
    } finally {
        fs.unlinkSync(filePath); // Clean up the uploaded file
    }
});

// Get all documents
app.get('/api/documents', (req, res) => {
    try {
        const documentsData = JSON.parse(fs.readFileSync(DOCUMENTS_FILE));
        res.json(documentsData);
    } catch (error) {
        console.error("Error reading documents:", error);
        res.status(500).send("Error retrieving documents");
    }
});

// Verify a document on the blockchain
app.get('/api/verify/:ipfsHash', async (req, res) => {
    const { ipfsHash } = req.params;
    
    if (!contract) {
        return res.status(503).json({ 
            verified: false, 
            message: "Blockchain verification not available" 
        });
    }
    
    try {
        const result = await contract.methods.verifyDocument(ipfsHash).call();
        const [verified, timestamp, uploader] = result;
        
        if (verified) {
            return res.json({
                verified: true,
                timestamp: new Date(timestamp * 1000).toISOString(),
                uploader: uploader,
                message: "Document verified on blockchain"
            });
        } else {
            return res.json({
                verified: false,
                message: "Document not found on blockchain"
            });
        }
    } catch (error) {
        console.error("Error verifying document:", error);
        return res.status(500).json({ 
            verified: false, 
            message: "Error verifying document on blockchain" 
        });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
    console.log(`Blockchain integration: ${contract ? "Enabled" : "Disabled"}`);
});
