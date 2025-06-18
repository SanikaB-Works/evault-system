# 🛡️ eVault System

A blockchain-based platform for secure legal document verification and storage. It integrates Ethereum smart contracts and IPFS to ensure tamper-proof access and decentralized storage.

---

## 📚 Modules Overview

### 1. 🔐 User Authentication & Role Management Module
Handles secure user registration, login, and access control based on user roles like Lawyer, Judge, and Admin.

- Secure login/signup using JWT and bcrypt
- Role-based access control (Lawyer, Judge)
- Middleware for route protection
- Session handling with JSON Web Tokens

---

### 2. 📄 Document Upload & IPFS Storage Module
Securely uploads legal documents and stores them on IPFS via Pinata.

- Accepts PDFs, scanned images, and legal documents
- Uploads documents to IPFS using Pinata API
- Returns unique IPFS hash (CID)
- Stores CID temporarily for blockchain use

---

### 3. ⛓️ Blockchain Transaction Module
Stores and verifies document metadata on the Ethereum blockchain using smart contracts.

- Uses Web3.js to interact with deployed contracts
- Saves CID, uploader's wallet address, and timestamp
- Enables document verification through blockchain queries
- Tested using Ganache (local Ethereum network)

---

### 4. 📜 Smart Contract (Solidity) Module
The heart of the system – handles document registration and verification with access control.

- Stores metadata (CID, timestamp, uploader)
- Allows only authorized Ethereum addresses to upload
- Admin can manage authorized addresses
- Emits events for operations like upload and verify

---

### 5. 🧾 Metadata & Audit Log Module *(Optional)*
Maintains a lightweight local JSON log for development and quick reference.

- Records CID, uploader, timestamp, transaction hash
- Used during debugging and simplified offline verification

---

### 6. 🌐 Web Interface Module
Frontend interface for user interaction.

- Document upload interface
- View document verification status
- Displays role, timestamp, CID, and transaction hash
- Built using HTML, CSS, JavaScript

---

### 7. 🔍 Blockchain Monitor Module
Provides real-time blockchain visibility for developers and admins.

- Uses Ganache for transaction tracking
- Smart contract testing with Remix IDE
- Web3 logs in frontend/backend for debug and traceability

---

## 🏗️ Architecture Design

- **Ethereum Blockchain**: Stores immutable metadata (CID, timestamp, uploader address)
- **Solidity Smart Contract**: Manages document metadata, access control, verification
- **IPFS + Pinata**: Decentralized file storage (returns persistent CID)
- **Node.js + Express.js**: Backend REST API for auth, upload, verification
- **Web3.js**: Handles all Ethereum blockchain interactions
- **Ganache**: Local Ethereum blockchain for development
- **Frontend**: Clean, responsive UI for uploading, verifying, and viewing status

---

## 💡 Tech Stack

| Layer         | Tech                              |
|---------------|-----------------------------------|
| Frontend      | HTML, CSS, JavaScript             |
| Backend       | Node.js, Express.js, Web3.js      |
| Smart Contract| Solidity                          |
| Blockchain    | Ethereum (via Ganache)            |
| Storage       | IPFS with Pinata                  |

---

## 🚀 How to Run

### Prerequisites:
- Node.js & npm
- Ganache (for local Ethereum)
- Pinata API credentials

### Steps:
```bash
# Clone repo
git clone https://github.com/SanikaB-Works/evault-system.git
cd evault-system

# Install dependencies
npm install

# Start Ganache and deploy smart contract in Remix

# Add Pinata API keys in .env

# Start server
node server.js

# Open frontend HTML in browser
