# ECI Secure Vote - Online Voting System

<div align="center">

![Online Voting System](docs/images/home.png)
![AI Verification](docs/images/AI.png)
![ECI Secure Vote](docs/images/voting.png)

**Secure, Anonymous, and Verifiable Online Voting Platform**

*Empowering democracy for Non-Resident Indians and Armed Forces personnel worldwide*

[Features](#features) • [Architecture](#architecture) • [Installation](#installation) • [Documentation](#documentation) • [Security](#security)

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Installation](#installation)
- [Configuration](#configuration)
- [Complete Workflow](#complete-workflow)
- [API Documentation](#api-documentation)
- [Blockchain Integration](#blockchain-integration)
- [AI-Powered Security](#ai-powered-security)
- [Security Mechanisms](#security-mechanisms)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

**ECI Secure Vote** is a next-generation online voting platform developed for the Election Commission of India, enabling **13.5+ million NRIs** and **1.4+ million Armed Forces personnel** to participate in democratic processes from anywhere in the world.

The system combines **military-grade cryptography**, **AI-powered security**, and **blockchain verifiability** to create a voting experience that is:

- **🔒 Secure**: Multi-layer authentication, biometric verification, homomorphic encryption
- **🎭 Anonymous**: Zero-knowledge proofs separate voter identity from ballot choice
- **✅ Verifiable**: End-to-end verifiable with public bulletin board
- **🛡️ Tamper-Proof**: Immutable blockchain records with distributed consensus
- **🤖 AI-Monitored**: Real-time coercion detection and anomaly prevention

---

## 🌟 Key Features

### For Voters
- **Remote Voting**: Cast your vote securely from any location worldwide
- **Biometric Authentication**: Face and voice verification for identity confirmation
- **Anonymous Ballots**: Your vote cannot be traced back to you
- **Re-voting**: Vote multiple times; only your last vote counts (anti-coercion)
- **Public Verification**: Verify your vote was counted using a tracking code
- **Multi-Device Support**: Vote from phone, tablet, or computer

### Security Features
- **Dual OTP Authentication**: Aadhaar + Voter ID linked mobile verification
- **AI Liveness Detection**: Random challenges prevent spoofing and deepfakes
- **Coercion Detection**: AI monitors for signs of voter intimidation
- **Homomorphic Encryption**: Votes counted while still encrypted
- **Blockchain Immutability**: Tamper-proof record on Aptos blockchain
- **Threshold Cryptography**: Multi-party computation for tally

### Administrative Features
- **Real-Time Monitoring**: Anomaly detection dashboard
- **Audit Trail**: Complete cryptographic logging
- **Fraud Prevention**: IP clustering, bulk registration, temporal anomaly detection
- **Accessibility**: Screen reader support, voice navigation, keyboard controls

---

## 🏗️ Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND LAYER                          │
│                    (React + TypeScript + Vite)                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │  Login   │ │ Register │ │ Liveness │ │   Vote   │            │
│  │  Page    │ │  Flow    │ │  Verify  │ │  Ballot  │            │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS/WSS
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API GATEWAY                             │
│                    (Node.js + Express)                          │
│                         Port: 3000                              │
│  ┌──────────────────────────────────────────────────┐           │
│  │  Rate Limiting │ JWT Auth │ Request Validation  │            │
│  └──────────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────────┘
          │                    │                    │
          ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Auth Service │    │ AI Service   │    │   Voting     │
│  Port: 3001  │    │  Port: 8000  │    │   Service    │
│              │    │              │    │  Port: 3002  │
│ • Dual OTP   │    │ • Liveness   │    │ • Ballot     │
│ • Aadhaar    │    │ • Coercion   │    │ • Tracking   │
│ • Biometric  │    │ • Anomaly    │    │ • Counting   │
└──────────────┘    └──────────────┘    └──────────────┘
          │                    │                    │
          └────────────────────┴────────────────────┘
                              │
          ┌───────────────────┴───────────────────┐
          │                                       │
          ▼                                       ▼
┌──────────────────┐                   ┌──────────────────┐
│   PostgreSQL     │                   │    MongoDB       │
│   Port: 5432     │                   │   Port: 27017    │
│                  │                   │                  │
│ • User Records   │                   │ • Security Events│
│ • Audit Logs     │                   │ • AI Analysis    │
│ • Voter Registry │                   │ • Anomaly Reports│
└──────────────────┘                   └──────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     APTOS BLOCKCHAIN                            │
│                   (Decentralized Layer)                         │
│  ┌──────────────────────────────────────────────────┐           │
│  │ voter_registry.move │ encrypted_ballot.move      │           │
│  │ bulletin_board.move │ tally_validator.move       │           │
│  └──────────────────────────────────────────────────┘           │
│                                                                 │
│  • Voter Registration Commitments                               │
│  • Encrypted Vote Storage (IPFS Hash)                           │
│  • Public Bulletin Board                                        │
│  • Merkle Tree Verification                                     │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow Architecture

```
USER JOURNEY: Registration → Login → Liveness → Vote → Receipt

┌─────────────┐
│   BROWSER   │
│  (User PC)  │
└──────┬──────┘
       │ 1. Register (EPIC + Aadhaar + Docs)
       ▼
┌─────────────┐
│ API Gateway │ ──→ 2. Forward to Auth Service
└──────┬──────┘
       │
       ▼
┌─────────────┐
│Auth Service │ ──→ 3. Generate & Send OTPs
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Redis     │ ──→ 4. Store OTP (TTL: 150s)
└─────────────┘
       │
       ▼ 5. OTP Verified
┌─────────────┐
│  BROWSER    │ ──→ 6. Start Video Recording
└──────┬──────┘       (15-20 seconds)
       │
       ▼ 7. Upload Video (multipart/form-data)
┌─────────────┐
│ API Gateway │ ──→ 8. Forward Video to Auth Service
└──────┬──────┘
       │
       ▼ 9. Forward to AI Service
┌─────────────┐
│ AI Service  │ ──→ 10. AI Analysis (6 Layers)
│ (Python)    │      • Facial Expression
└──────┬──────┘      • Eye Movement
       │             • Voice Stress
       │             • Environment
       │             • Behavioral
       │             • Claude AI (Final Decision)
       │
       ▼ 11. Return AI Result
┌─────────────┐
│Auth Service │ ──→ 12. Decision Logic
└──────┬──────┘      
       │
       ├──→ If Coercion Detected (Risk > 75%)
       │    └─→ REJECT & Log to MongoDB
       │
       └──→ If Safe (Risk < 50%)
            └─→ ACCEPT → Store Baseline
                │
                ▼
         ┌─────────────┐
         │ PostgreSQL  │ ← Save Biometric Hash
         └─────────────┘
                │
                ▼
         ┌─────────────┐
         │   Aptos     │ ← Register on Blockchain
         │ Blockchain  │    (Hashed EPIC + Biometric)
         └─────────────┘
```

---

## 💻 Technology Stack

### Frontend
- **Framework**: React 18.3 + TypeScript
- **Build Tool**: Vite 5.4
- **UI Library**: shadcn/ui + Tailwind CSS 3.4
- **State Management**: React Query + Context API
- **Routing**: React Router v6
- **Forms**: React Hook Form + Zod validation
- **Biometrics**: MediaPipe Face Mesh, TensorFlow.js
- **Notifications**: Sonner toasts

### Backend
- **Runtime**: Node.js 16+ (Express 5.1)
- **Languages**: JavaScript (API), Python 3.9+ (AI)
- **Authentication**: JWT + bcrypt
- **Rate Limiting**: Express Rate Limit
- **Validation**: express-validator

### Databases
- **PostgreSQL 5.0+**: User records, audit logs
- **MongoDB 27017**: Security events, AI analysis
- **Redis 6.0+**: OTP storage, session management

### Blockchain
- **Network**: Aptos Devnet/Testnet
- **Language**: Move
- **SDK**: Aptos SDK (Node.js)
- **Storage**: IPFS/Arweave (off-chain encrypted votes)

### AI/ML
- **Face Detection**: MediaPipe, face-api.js
- **Coercion Detection**: Custom CNN models
- **Voice Analysis**: Web Audio API
- **Final Decision**: Claude AI (Anthropic API)

### DevOps
- **Containerization**: Docker + Docker Compose
- **Process Manager**: PM2
- **Reverse Proxy**: Nginx
- **Monitoring**: Winston logger
- **CI/CD**: GitHub Actions (recommended)

---

## 🚀 Installation

### Prerequisites

Ensure you have the following installed:

```bash
# Check Node.js version
node --version  # Should be >= 16.0.0

# Check npm version
npm --version   # Should be >= 8.0.0

# Check MongoDB
mongod --version  # Should be >= 5.0

# Check Redis
redis-server --version  # Should be >= 6.0

# Check PostgreSQL
psql --version  # Should be >= 12.0

# Check Python (for AI services)
python3 --version  # Should be >= 3.9
```

### Quick Start

#### 1. Clone the Repository

```bash
git clone https://github.com/your-org/eci-secure-vote.git
cd eci-secure-vote
```

#### 2. Backend Setup

```bash
# Navigate to backend
cd App/backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your credentials
nano .env
```

**Required Environment Variables:**

```env
# Server
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/voting_system
POSTGRESQL_URI=postgresql://user:password@localhost:5432/eci_vote
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-super-secret-key-min-32-characters

# OTP Provider (Choose ONE)
# Option 1: Twilio
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=+1234567890

# Option 2: MSG91 (India)
MSG91_AUTH_KEY=your_key
MSG91_SENDER_ID=ECIVOT

# Aptos Blockchain
MODULE_ADDRESS=0x<YOUR_DEPLOYED_ADDRESS>
APTOS_NODE_URL=https://fullnode.devnet.aptoslabs.com/v1
APTOS_PRIVATE_KEY=0x<YOUR_PRIVATE_KEY>

# AI Services
ANTHROPIC_API_KEY=your_claude_api_key
```

#### 3. Database Setup

```bash
# Start MongoDB
mongod --dbpath /path/to/data

# Start Redis
redis-server

# Create PostgreSQL database
psql -U postgres
CREATE DATABASE eci_vote;
\q

# Run migrations (if using a migration tool)
npm run migrate
```

#### 4. Blockchain Setup

```bash
# Navigate to contracts
cd aptos-contracts

# Install Aptos CLI (if not installed)
curl -fsSL "https://aptos.dev/scripts/install_cli.py" | python3

# Initialize Aptos account
aptos init

# Compile contracts
aptos move compile

# Deploy to devnet
aptos move publish --named-addresses voting=<YOUR_ADDRESS>

# Initialize contracts
aptos move run --function-id 'voting::voter_registry::initialize'
aptos move run --function-id 'voting::encrypted_ballot::initialize'
```

#### 5. Frontend Setup

```bash
# Navigate to frontend
cd ../frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit with your backend URL
nano .env
```

**Frontend Environment Variables:**

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_MODULE_ADDRESS=0x<YOUR_DEPLOYED_ADDRESS>
VITE_APTOS_NODE_URL=https://fullnode.devnet.aptoslabs.com/v1
VITE_APTOS_NETWORK=devnet
```

#### 6. Start Development Servers

```bash
# Terminal 1: Start Backend
cd App/backend
npm run dev

# Terminal 2: Start Frontend
cd App/frontend
npm run dev


#### 7. Access Application

```
Frontend: http://localhost:8080
Backend API: http://localhost:3000
```

---

## ⚙️ Configuration

### OTP Configuration

The system supports multiple SMS providers:

**Twilio** (International):
```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

**MSG91** (India):
```env
MSG91_AUTH_KEY=your_msg91_key
MSG91_SENDER_ID=ECIVOT
MSG91_ROUTE=4
```

### File Storage

Choose between AWS S3 or Cloudinary:

**AWS S3**:
```env
STORAGE_PROVIDER=s3
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_S3_BUCKET=eci-vote-docs
AWS_REGION=ap-south-1
```

**Cloudinary**:
```env
STORAGE_PROVIDER=cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
```

### Email Notifications

**SendGrid**:
```env
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.xxxxxxx
SENDGRID_FROM_EMAIL=noreply@ecivote.gov.in
```

**SMTP**:
```env
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

---

## 📊 Complete Workflow

### Phase I: Pre-Election Registration (One-Time Setup)

#### Step 1: Eligibility Check
```
User → Enters EPIC Number + Category (NRI/Armed Forces)
  ↓
Backend → Validates EPIC format
  ↓
Database → Checks if already registered
  ↓
Response → Eligible / Already Registered / Blocked
```

#### Step 2: Multi-Document Verification
```
User → Submits:
  • EPIC Number
  • Aadhaar Number
  • Mobile (EPIC-registered)
  • Mobile (Aadhaar-linked)
  • Documents (Passport/Service ID)
  ↓
Backend → Generates Dual OTP
  ↓
SMS Gateway → Sends OTP to both mobiles
  ↓
User → Enters Both OTPs
  ↓
Backend → Verifies OTPs (150-second window)
```

#### Step 3: AI-Powered Biometric Verification

```
┌──────────────────────────────────────────────────────────────┐
│                    VIDEO RECORDING                           │
│                   (15-20 seconds)                            │
│                                                              │
│  1. Face Camera Directly                                     │
│  2. Ensure Good Lighting                                     │
│  3. Read Aloud: "DELTA-7-ECHO-9"                             │
│  4. Turn Head Left Slowly                                    │
│  5. Turn Head Right Slowly                                   │
└──────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                  AI COERCION DETECTION                       │
│                    (6-Layer Analysis)                        │
│                                                              │
│  Layer 1: Facial Expression Analysis                         │
│    • Detect fear, distress, stress indicators                │
│    • Micro-expression detection (70ms window)                │
│    • Model: micro_expressions.h5                             │
│                                                              │
│  Layer 2: Eye Movement Tracking                              │
│    • Gaze direction analysis                                 │
│    • Off-camera glance detection                             │
│    • Model: eye_gaze.h5                                      │
│                                                              │
│  Layer 3: Voice Stress Analysis                             │
│    • Audio trembling detection                              │
│    • Pitch variation analysis                               │
│    • Model: voice_stress.h5                                 │
│                                                              │
│  Layer 4: Environment Detection                             │
│    • Multiple person detection                              │
│    • Background analysis                                    │
│    • Model: person_detection.h5                             │
│                                                              │
│  Layer 5: Behavioral Analysis                               │
│    • Movement pattern analysis                              │
│    • Optical flow analysis                                  │
│    • Unnatural behavior detection                           │
│                                                              │
│  Layer 6: Claude AI Analysis                                │
│    • Contextual reasoning                                   │
│    • Advanced pattern recognition                           │
│    • Final decision making                                  │
└──────────────────────────────────────────────────────────────┘
                         │
           ┌─────────────┴─────────────┐
           │                           │
           ▼                           ▼
    Risk Score < 50%            Risk Score > 75%
    ✅ APPROVED                 ❌ BLOCKED
           │                           │
           │                           ▼
           │                   Log Security Event
           │                   Notify Admin
           │                   Reject Registration
           │
           ▼
┌──────────────────────────────────────────────────────────────┐
│              BIOMETRIC BASELINE STORAGE                      │
│                                                              │
│  • Generate Face Embedding (128D vector)                    │
│  • Hash Biometric Data (SHA-256)                            │
│  • Store in PostgreSQL (encrypted)                          │
│  • Timestamp + Device Info                                  │
└──────────────────────────────────────────────────────────────┘
```

#### Step 4: Blockchain Registration

```
Auth Service → Prepares Registration Data
  ↓
Data = {
  epicHash: SHA256(epicNumber),
  aadhaarHash: SHA256(aadhaar),
  biometricHash: SHA256(embedding),
  timestamp: NOW(),
  isActive: true
}
  ↓
Aptos Smart Contract → voter_registry.move
  ↓
function register_voter(
  epic_hash: vector<u8>,
  aadhaar_hash: vector<u8>,
  biometric_hash: vector<u8>
)
  ↓
Blockchain Confirmation → Transaction Hash
  ↓
Update PostgreSQL → registration_status = 'ACTIVE'
  ↓
Strike Off Physical Voter Roll
  ↓
Send Confirmation Email/SMS
```

**Registration Complete! User receives:**
- ✅ Registration ID: `REG-2025-XXXXX`
- ✅ Blockchain Transaction Hash
- ✅ Digital Certificate (PDF)

---

### Phase II: Polling Day Voting

#### Step 1: Login & Dual Authentication

```
User → Enters EPIC Number
  ↓
Backend → Sends OTP 1 (EPIC Mobile)
  ↓
Backend → Sends OTP 2 (Aadhaar Mobile)
  ↓
User → Enters Both OTPs (150-second window)
  ↓
Backend → Verifies OTPs
  ↓
Backend → Checks Blockchain Eligibility
  ↓
Aptos Contract → is_voter_eligible(epic_hash)
  ↓
✅ Voter Authenticated
```

#### Step 2: Liveness Verification

```
┌──────────────────────────────────────────────────────────────┐
│             REAL-TIME LIVENESS CHALLENGES                    │
│             (Randomized to Prevent Replay)                   │
│                                                              │
│  Challenge 1: Turn Head Left                                │
│    • Target Angle: -45°                                     │
│    • Duration: 4 seconds                                    │
│    • Verify: headPose.yaw ≈ -45° ± 10°                    │
│                                                              │
│  Challenge 2: Say "7-3-9-2"                                 │
│    • Audio capture + Voice verification                     │
│    • Duration: 3 seconds                                    │
│                                                              │
│  Challenge 3: Blink 3 Times                                 │
│    • Eye Aspect Ratio monitoring                            │
│    • Detect closure + reopening                             │
│    • Duration: 3 seconds                                    │
└──────────────────────────────────────────────────────────────┘
                         │
                         ▼
            Compare with Baseline
                         │
           ┌─────────────┴─────────────┐
           │                           │
           ▼                           ▼
    Similarity > 85%            Similarity < 85%
    ✅ PASS                     ❌ FAIL
           │                           │
           │                           ▼
           │                   Increment Failed Attempts
           │                   (Max 3 attempts)
           │                           │
           │                   3rd Fail → Lock Account (30 min)
           │
           ▼
┌──────────────────────────────────────────────────────────────┐
│              PROCEED TO BALLOT                               │
└──────────────────────────────────────────────────────────────┘
```

#### Step 3: Anonymous Ballot Generation

```
┌──────────────────────────────────────────────────────────────┐
│           CRYPTOGRAPHIC BALLOT SEPARATION                    │
│                                                              │
│  Authorization Server                                        │
│    "Voter-XYZ cleared to vote" ──→ Log: User voted at T    │
│                                                              │
│  Ballot Server (Separate)                                    │
│    Issues Ballot-123 ──→ BLIND ISSUE (no link to voter)    │
│                                                              │
│  🔒 CRYPTOGRAPHIC SEVERANCE:                                │
│    • System knows: Voter-XYZ voted                          │
│    • System CANNOT see: Which ballot they received          │
│    • Zero-Knowledge Proof ensures unlinkability             │
└──────────────────────────────────────────────────────────────┘
```

#### Step 4: Vote Casting

```
User → Sees Ballot with Candidates
  ↓
User → Selects Candidate
  ↓
Review Screen → "You selected [Party X]. Confirm?"
  ↓
User → Presses CONFIRM
  ↓
┌──────────────────────────────────────────────────────────────┐
│            CLIENT-SIDE ENCRYPTION                            │
│                                                              │
│  vote = {                                                    │
│    candidateId: "candidate_123",                            │
│    timestamp: NOW()                                          │
│  }                                                           │
│    ↓                                                         │
│  encryptedVote = encrypt(vote, publicKey)                   │
│    ↓                                                         │
│  voteHash = SHA256(encryptedVote)                           │
│    ↓                                                         │
│  trackingCode = generateCode() // "A7R-4GT-P9K"            │
│    ↓                                                         │
│  Upload to IPFS                                              │
│    ipfsHash = "QmX7f9kj2h3..."                              │
└──────────────────────────────────────────────────────────────┘
  ↓
┌──────────────────────────────────────────────────────────────┐
│         BLOCKCHAIN COMMITMENT STORAGE                        │
│                                                              │
│  Aptos Smart Contract → encrypted_ballot.move               │
│                                                              │
│  function cast_vote(                                         │
│    epic_hash: vector<u8>,                                   │
│    vote_commitment: vector<u8>,                             │
│    ipfs_hash: String,                                       │
│    tracking_code_hash: vector<u8>                           │
│  )                                                           │
│                                                              │
│  Stored On-Chain:                                            │
│    ✓ Vote Commitment (hash)                                 │
│    ✓ IPFS Hash (encrypted vote location)                    │
│    ✓ Tracking Code Hash                                     │
│    ✓ Timestamp                                               │
│    ✗ Voter Identity (NOT stored)                            │
│    ✗ Vote Content (NOT stored)                              │
└──────────────────────────────────────────────────────────────┘
```

#### Step 5: Verifiable Receipt

```
Backend → Generates Receipt
  ↓
receipt = {
  trackingCode: "A7R-4GT-P9K",
  castAt: "2025-01-15T10:30:00Z",
  electionId: "2025-general-election",
  blockchainTxHash: "0x7f83b1657ff1..."
}
  ↓
User Receives Receipt (Does NOT show candidate)
  ↓
User Can Verify on Public Bulletin Board
```

---

### Phase III: Public Verification

```
User → Enters Tracking Code on Bulletin Board
  ↓
Query Aptos Blockchain
  ↓
bulletin_board::get_vote_record(tracking_code_hash)
  ↓
Result = {
  commitment: "0x4a7f9c3d...",
  timestamp: "2025-01-15T10:30:00Z",
  isValid: true,
  inMerkleTree: true
}
  ↓
Display to User:
  ✅ Your vote was counted
  ✅ Cast on: 2025-01-15 10:30 AM
  ✅ Verified in Merkle Tree
  ✅ Transaction: View on Aptos Explorer
```

**Merkle Tree Verification:**
```
All Vote Commitments
  ↓
Build Merkle Tree
  ↓
Root Hash Published On-Chain
  ↓
User Downloads Merkle Proof
  ↓
Verifies: hash(commitment + proof) == root
  ↓
✅ Cryptographically Proven: Vote Included in Tally
```

---

## 📡 API Documentation

### Base URL
```
Production: https://api.ecivote.gov.in/api
Development: http://localhost:3000/api
```

### Authentication Endpoints

#### 1. Check Eligibility
```http
POST /api/auth/check-eligibility
Content-Type: application/json

Request:
{
  "epicNumber": "ABC1234567",
  "category": "nri"
}

Response 200:
{
  "eligible": true,
  "message": "User eligible for registration"
}

Response 400:
{
  "error": "User already registered",
  "code": "ALREADY_REGISTERED"
}
```

#### 2. Request OTP
```http
POST /api/auth/request-otp
Content-Type: application/json

Request:
{
  "epicNumber": "ABC1234567",
  "aadhaar": "123456789012",
  "mobileEpic": "+919876543210",
  "mobileAadhaar": "+919876543210"
}

Response 200:
{
  "success": true,
  "message": "OTPs sent successfully",
  "expiresIn": 150
}
```

#### 3. Complete Registration
```http
POST /api/auth/register
Content-Type: application/json
Authorization: Bearer <token>

Request:
{
  "epicNumber": "ABC1234567",
  "aadhaar": "123456789012",
  "category": "nri",
  "mobileEpic": "+919876543210",
  "mobileAadhaar": "+919876543210",
  "biometricData": {
    "embeddingHash": "sha256_hash_string"
  },
  "ipAddress": "1.2.3.4",
  "location": {
    "latitude": 12.34,
    "longitude": 56.78,
    "country": "USA"
  }
}

Response 201:
{
  "success": true,
  "message": "Registration successful",
  "registrationId": "REG-2025-12345",
  "token": "jwt_token",
  "blockchainTxHash": "0x7f83b1657..."
}
```

### Voting Endpoints

#### 1. Cast Vote
```http
POST /api/vote/cast
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  "encryptedVote": "base64_encrypted_ballot",
  "constituency": "Mumbai North",
  "electionId": "2025-general-election"
}

Response 200:
{
  "success": true,
  "trackingCode": "A7R-4GT-P9K",
  "message": "Vote cast successfully",
  "castAt": "2025-01-15T10:30:00Z",
  "blockchainTxHash": "0x4a7f9c3d..."
}
```

#### 2. Verify Vote
```http
GET /api/vote/verify/:trackingCode

Response 200:
{
  "found": true,
  "castAt": "2025-01-15T10:30:00Z",
  "verified": true,
  "constituency": "Mumbai North",
  "blockchainTxHash": "0x4a7f9c3d..."
}
```

### Security Endpoints

#### 1. Report Anomaly
```http
POST /api/security/anomaly
Content-Type: application/json

Request:
{
  "epicNumber": "ABC1234567",
  "anomalyType": "voting",
  "riskLevel": "high",
  "riskScore": 85,
  "indicators": [
    {
      "type": "ip_clustering",
      "confidence": 0.9,
      "evidence": "10 votes from same IP"
    }
  ],
  "recommendedAction": "block",
  "autoBlocked": true
}

Response 200:
{
  "success": true,
  "reportId": "report_12345"
}
```

---

## ⛓️ Blockchain Integration

### Aptos Smart Contracts

#### 1. Voter Registry (`voter_registry.move`)

```move
module voting::voter_registry {
    struct VoterRecord has key {
        epic_hash: vector<u8>,
        aadhaar_hash: vector<u8>,
        biometric_hash: vector<u8>,
        registered_at: u64,
        is_active: bool,
        has_voted: bool,
        struck_off_physical_roll: bool
    }

    public entry fun register_voter(
        account: &signer,
        epic_hash: vector<u8>,
        aadhaar_hash: vector<u8>,
        biometric_hash: vector<u8>
    ) acquires VoterRegistry {
        // Validation & Registration Logic
    }

    public fun is_voter_eligible(epic_hash: vector<u8>): bool {
        // Eligibility Check
    }
}
```

#### 2. Encrypted Ballot (`encrypted_ballot.move`)

```move
module voting::encrypted_ballot {
    struct VoteRecord has key {
        tracking_code_hash: vector<u8>,
        vote_commitment: vector<u8>,
        ipfs_hash: String,
        cast_at: u64,
        is_final: bool
    }

    public entry fun cast_vote(
        account: &signer,
        epic_hash: vector<u8>,
        vote_commitment: vector<u8>,
        ipfs_hash: String,
        tracking_code_hash: vector<u8>
    ) {
        // Last Vote Counts: Mark previous as not final
        // Store new vote
    }
}
```

### Blockchain Workflow

```
1. Voter Registration
   ├─ Hash EPIC, Aadhaar, Biometric Data
   ├─ Call voter_registry::register_voter()
   ├─ Store commitments on-chain
   └─ Return transaction hash

2. Vote Casting
   ├─ Encrypt vote client-side
   ├─ Upload encrypted vote to IPFS
   ├─ Generate vote commitment = hash(voter + vote + timestamp)
   ├─ Call encrypted_ballot::cast_vote()
   ├─ Store commitment + IPFS hash on-chain
   └─ Issue tracking code

3. Public Verification
   ├─ User enters tracking code
   ├─ Query bulletin_board::get_vote_record()
   ├─ Retrieve commitment from blockchain
   ├─ Verify commitment in Merkle tree
   └─ Confirm vote counted

4. Tally Computation
   ├─ Election officials retrieve IPFS votes
   ├─ Decrypt using threshold cryptography
   ├─ Compute tally homomorphically
   ├─ Generate Merkle root
   ├─ Publish root on-chain
   └─ Multi-signature validation
```

---

## 🤖 AI-Powered Security

### Coercion Detection System

The AI service uses a 6-layer neural network architecture:

#### Layer 1: Facial Expression Analysis
```python
Model: micro_expressions.h5
Input: Video frames (30 fps)
Output: Fear/Stress probability

Detects:
- Raised eyebrows (surprise/fear)
- Tense mouth position
- Wide eyes (fear indicator)
- Micro-expressions (70ms window)
```

#### Layer 2: Eye Movement Tracking
```python
Model: eye_gaze.h5
Input: Eye landmark coordinates
Output: Gaze direction + off-camera glances

Monitors:
- Frequent off-camera glances (> 5 in 30s = suspicious)
- Gaze pattern consistency
- Visual attention span
```

#### Layer 3: Voice Stress Analysis
```python
Model: voice_stress.h5
Input: Audio waveform
Output: Stress indicators

Analyzes:
- Pitch variation (> 50Hz = stress)
- Speech rate (< 2 wps or > 4 wps = abnormal)
- Voice trembling
- Background voices
```

#### Layer 4: Environment Detection
```python
Model: person_detection.h5 (YOLO-based)
Input: Video frames
Output: Person count + positions

Flags:
- Multiple persons detected
- Background movement
- Unexpected objects
```

#### Layer 5: Behavioral Analysis
```python
Model: behavioral_analysis.h5
Input: Head pose sequence
Output: Movement naturalness score

Detects:
- Jerky/forced movements (acceleration > 150°/s²)
- Too-perfect coached behavior
- Unnatural stillness
```

#### Layer 6: Claude AI Final Decision
```python
API: Anthropic Claude Sonnet 4
Input: All layer results + contextual data
Output: Final risk assessment + reasoning

Process:
1. Aggregate all layer scores
2. Contextual reasoning
3. Pattern recognition
4. Generate explanation
5. Return: coercionDetected (true/false) + confidence
```

### Risk Scoring

```
Total Risk Score = Σ (Layer_Score × Layer_Weight)

Risk Levels:
- 0-30:   ✅ Low Risk (Allow)
- 31-60:  ⚠️  Medium Risk (Flag for review)
- 61-75:  🔶 High Risk (Manual verification required)
- 76-100: 🚨 Critical Risk (Auto-block + alert admin)

Auto-Block Threshold: Risk Score > 75
```

### Real-Time Monitoring

```
During Registration/Voting:
  ├─ Every 3 seconds: AI analysis
  ├─ Update risk score in real-time
  ├─ If risk > 50: Show warning to user
  ├─ If risk > 75: Block session immediately
  └─ Log all events to MongoDB
```

---

## 🛡️ Security Mechanisms

### 1. Multi-Layer Authentication

```
Layer 1: Knowledge (EPIC Number)
Layer 2: Possession (Dual OTP - 2 mobiles)
Layer 3: Inherence (Biometric - Face + Voice)
Layer 4: Behavior (AI Liveness Challenges)
Layer 5: Location (IP + Geolocation verification)
```

### 2. Cryptographic Security

**End-to-End Encryption:**
```
Client-Side Encryption
  ↓
Vote → AES-256-GCM (Public Key)
  ↓
Transport → TLS 1.3
  ↓
Storage → Encrypted at Rest (AES-256)
  ↓
Homomorphic Tallying (Never Decrypted)
  ↓
Final Tally → Threshold Decryption (M-of-N keys)
```

**Zero-Knowledge Proofs:**
```
Voter proves: "I am eligible"
WITHOUT revealing: EPIC number or identity

Ballot proves: "This is a valid encrypted vote"
WITHOUT revealing: Candidate choice
```

### 3. Blockchain Immutability

```
Every Vote Transaction:
  ├─ Timestamped
  ├─ Cryptographically signed
  ├─ Added to Merkle tree
  ├─ Root hash published
  ├─ Distributed consensus (100+ validators)
  └─ Permanent & Immutable
```

### 4. Anti-Coercion Measures

**"Last Vote Counts" Protocol:**
```
User can vote multiple times
  ↓
Each new vote marks previous as "not final"
  ↓
Only LAST vote is counted in tally
  ↓
Coercer cannot verify vote remained unchanged
```

**Receipt-Free Voting:**
```
Tracking Code proves: "Vote was counted"
Tracking Code DOES NOT prove: "I voted for X"
  ↓
Cannot be used as proof for vote-buying
```

### 5. Anomaly Detection

```python
Real-Time Monitors:
- IP Clustering: > 10 votes from same IP = Flag
- Temporal Patterns: Voting at 3 AM = Suspicious
- Bulk Registration: Sequential EPICs = Block
- Session Duration: < 30 seconds voting = Anomaly
- Geographic Mismatch: NRI claim but India IP = Review
```

---

## 🚀 Deployment

### Production Deployment (PM2 + Nginx)

#### 1. PM2 Process Manager

```bash
# Install PM2 globally
npm install -g pm2

# Start backend with clustering
pm2 start index.js --name eci-backend -i max

# Start with environment
pm2 start index.js --name eci-backend --env production -i 4

# Monitor
pm2 monit

# Logs
pm2 logs eci-backend

# Save process list
pm2 save

# Setup startup script
pm2 startup
```

**PM2 Ecosystem File (`ecosystem.config.js`):**
```javascript
module.exports = {
  apps: [{
    name: 'eci-backend',
    script: './index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
}
```

#### 2. Nginx Reverse Proxy

```nginx
# /etc/nginx/sites-available/ecivote

upstream backend {
    least_conn;
    server localhost:3000;
    server localhost:3001;
    server localhost:3002;
}

server {
    listen 443 ssl http2;
    server_name api.ecivote.gov.in;

    ssl_certificate /etc/letsencrypt/live/ecivote.gov.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ecivote.gov.in/privkey.pem;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;

    location /api {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}

# Frontend
server {
    listen 443 ssl http2;
    server_name ecivote.gov.in www.ecivote.gov.in;

    ssl_certificate /etc/letsencrypt/live/ecivote.gov.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ecivote.gov.in/privkey.pem;

    root /var/www/ecivote/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;
}
```

#### 3. Docker Deployment

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  frontend:
    build: ./App/frontend
    ports:
      - "8080:80"
    environment:
      - VITE_API_BASE_URL=https://api.ecivote.gov.in/api
    depends_on:
      - backend

  backend:
    build: ./App/backend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/voting_system
      - REDIS_HOST=redis
    depends_on:
      - mongo
      - redis
      - postgres

  mongo:
    image: mongo:5.0
    volumes:
      - mongo_data:/data/db
    ports:
      - "27017:27017"

  postgres:
    image: postgres:14
    environment:
      - POSTGRES_DB=eci_vote
      - POSTGRES_USER=admin
      - POSTGRES_PASSWORD=secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:6-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  mongo_data:
  postgres_data:
  redis_data:
```

---

## 📈 Monitoring & Logging

### Winston Logger Setup

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.MongoDB({
      db: process.env.MONGODB_URI,
      collection: 'logs',
      level: 'info'
    })
  ]
});
```

### Key Metrics to Monitor

```
✅ Registration Metrics:
- Total registrations per hour
- OTP failure rate
- Biometric verification success rate
- Coercion detection rate

✅ Voting Metrics:
- Votes cast per constituency
- Average voting session duration
- Liveness verification success rate
- Re-voting frequency

✅ Security Metrics:
- Failed authentication attempts
- Anomaly detection rate
- Blocked users count
- IP clustering incidents

✅ System Metrics:
- API response time
- Database query time
- Blockchain confirmation time
- Error rate
```

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md).

### Development Workflow

```bash
# 1. Fork the repository
# 2. Create feature branch
git checkout -b feature/amazing-feature

# 3. Make changes and commit
git commit -m "Add amazing feature"

# 4. Push to branch
git push origin feature/amazing-feature

# 5. Open Pull Request
```

### Code Standards

- **Frontend**: ESLint + Prettier
- **Backend**: StandardJS
- **Python**: PEP 8 + Black formatter
- **Move**: Aptos Move guidelines

---

## 📄 License

Copyright © 2025 Election Commission of India. All rights reserved.

This project is licensed under the ISC License.

---

## 📞 Support

### Contact Information

- **Email**: support@ecivote.gov.in
- **Phone**: 1950 (Toll-free, 24/7 during elections)
- **Website**: https://ecivote.gov.in
- **Documentation**: https://docs.ecivote.gov.in

### Office Hours

- **During Elections**: 24/7 Support
- **Regular Days**: Monday-Friday, 9 AM - 6 PM IST
- **Weekends**: 10 AM - 4 PM IST

---

## 🙏 Acknowledgments

- Election Commission of India
- Anthropic (Claude AI)
- Aptos Labs (Blockchain)
- MediaPipe Team (Face Detection)
- All open-source contributors

---

## 📚 Additional Resources

- [Technical Whitepaper](docs/whitepaper.pdf)
- [Security Audit Report](docs/security-audit.pdf)
- [API Documentation](https://docs.ecivote.gov.in/api)
- [User Guide](docs/user-guide.pdf)
- [Admin Manual](docs/admin-manual.pdf)

---

<div align="center">

**Built with ❤️ for Indian Democracy**

*"Democracy is the will of the people, not the privilege of proximity."*

⭐ Star this repo if you support secure online voting!

</div>