# ECI Secure Vote - Backend API

Production-ready backend for the ECI Online Voting System with military-grade security, real-time OTP verification, and comprehensive audit logging.

## 🚀 Quick Start

### Prerequisites
- Node.js >= 16.x
- MongoDB >= 5.0
- Redis >= 6.0
- npm or yarn

### Installation

```bash
# Navigate to backend directory
cd App/backend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your credentials
nano .env

# Start MongoDB (if not running)
mongod --dbpath /path/to/data

# Start Redis (if not running)
redis-server

# Run database seed (optional)
npm run seed

# Start development server
npm run dev

# Or start production server
npm start
```

## 📁 Complete Directory Structure

```
App/backend/
├── index.js                 # Main server file
├── package.json
├── .env.example
├── .env                     # (git-ignored)
│
├── routes/
│   ├── auth.js             # Authentication endpoints
│   ├── voting.js           # Voting endpoints
│   ├── security.js         # Security & anomaly endpoints
│   └── admin.js            # Admin dashboard endpoints
│
├── services/
│   ├── otpService.js       # OTP generation & verification
│   ├── aadhaarService.js   # Aadhaar integration
│   ├── uploadService.js    # File upload (S3/Cloudinary)
│   ├── emailService.js     # Email notifications
│   └── aptosService.js     # Blockchain integration (existing)
│
├── models/
│   ├── User.js             # User/Voter model
│   ├── Vote.js             # Vote record model
│   ├── Session.js          # Session tracking model
│   └── AnomalyReport.js    # Security anomaly model
│
├── middleware/
│   ├── auth.js             # JWT authentication
│   ├── errorHandler.js     # Global error handling
│   ├── logger.js           # Request logging
│   └── validation.js       # Input validation helpers
│
├── utils/
│   ├── logger.js           # Winston logger configuration
│   ├── crypto.js           # Cryptographic utilities
│   └── helpers.js          # Common helper functions
│
├── scripts/
│   ├── seed.js             # Database seeding
│   └── cleanup.js          # Cleanup test data
│
└── logs/
    └── app.log             # Application logs
```

## 🔑 Environment Variables Setup

### Critical Variables (Required)

```bash
# Database
MONGODB_URI=mongodb://localhost:27017/voting_system

# Redis for OTP
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT Secret (MUST be 32+ characters)
JWT_SECRET=your-super-secret-key-min-32-characters

# OTP Provider (Choose ONE)
# Option 1: Twilio
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=+1234567890

# Option 2: MSG91 (India)
MSG91_AUTH_KEY=your_key
MSG91_SENDER_ID=ECIVOT
```

### Optional but Recommended

```bash
# File Storage (Choose ONE)
# Option 1: AWS S3
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_S3_BUCKET=your-bucket
STORAGE_PROVIDER=s3

# Option 2: Cloudinary
CLOUDINARY_CLOUD_NAME=your_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
STORAGE_PROVIDER=cloudinary

# Email (Choose ONE)
# Option 1: SendGrid
SENDGRID_API_KEY=your_key
EMAIL_PROVIDER=sendgrid

# Option 2: SMTP
SMTP_HOST=smtp.gmail.com
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
EMAIL_PROVIDER=smtp
```

## 📡 API Endpoints

### Base URL: `http://localhost:3000/api`

### Authentication Endpoints

#### 1. Check Eligibility
```http
POST /api/auth/check-eligibility
Content-Type: application/json

{
  "epicNumber": "ABC1234567",
  "category": "nri"
}

Response 200:
{
  "eligible": true,
  "message": "User eligible for registration"
}
```

#### 2. Request OTP
```http
POST /api/auth/request-otp
Content-Type: application/json

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

#### 3. Verify OTP
```http
POST /api/auth/verify-otp
Content-Type: application/json

{
  "epicNumber": "ABC1234567",
  "otp1": "123456",
  "otp2": "654321"
}

Response 200:
{
  "success": true,
  "message": "OTP verified successfully"
}
```

#### 4. Complete Registration
```http
POST /api/auth/register
Content-Type: application/json

{
  "epicNumber": "ABC1234567",
  "aadhaar": "123456789012",
  "category": "nri",
  "mobileEpic": "+919876543210",
  "mobileAadhaar": "+919876543210",
  "biometricData": {
    "embeddingHash": "hash_string"
  },
  "documentBase64": "data:image/png;base64,...",
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
  "registrationId": "user_id",
  "token": "jwt_token"
}
```

#### 5. Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "epicNumber": "ABC1234567"
}

Response 200:
{
  "success": true,
  "message": "OTPs sent",
  "expiresIn": 150
}
```

#### 6. Verify Liveness
```http
POST /api/auth/verify-liveness
Authorization: Bearer <token>
Content-Type: application/json

{
  "embeddingHash": "current_hash",
  "similarity": 0.92
}

Response 200:
{
  "success": true,
  "message": "Liveness verified"
}
```

### Voting Endpoints

#### 1. Cast Vote
```http
POST /api/vote/cast
Authorization: Bearer <token>
Content-Type: application/json

{
  "encryptedVote": "encrypted_ballot_data",
  "constituency": "Mumbai North",
  "electionId": "election_2025"
}

Response 200:
{
  "success": true,
  "trackingCode": "A7R-4GT-P9K",
  "message": "Vote cast successfully",
  "castAt": "2025-01-15T10:30:00Z"
}
```

#### 2. Verify Vote (Public)
```http
GET /api/vote/verify/A7R-4GT-P9K

Response 200:
{
  "found": true,
  "castAt": "2025-01-15T10:30:00Z",
  "verified": true,
  "constituency": "Mumbai North"
}
```

#### 3. Get Vote Statistics (Public)
```http
GET /api/vote/statistics?electionId=election_2025

Response 200:
{
  "totalVotes": 45234,
  "verifiedVotes": 45180,
  "votesByConstituency": [
    { "_id": "Mumbai North", "count": 1234 }
  ],
  "lastUpdated": "2025-01-15T11:00:00Z"
}
```

### Security Endpoints

#### 1. Report Anomaly
```http
POST /api/security/anomaly
Content-Type: application/json

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
  "autoBlocked": true,
  "ipAddress": "1.2.3.4"
}

Response 200:
{
  "success": true,
  "reportId": "report_id",
  "message": "Anomaly reported"
}
```

#### 2. Check User Blocked Status
```http
GET /api/security/check-blocked/ABC1234567

Response 200:
{
  "isBlocked": false,
  "reason": null
}
```

### Admin Endpoints (Requires Admin Auth)

#### 1. Get Dashboard Stats
```http
GET /api/admin/stats
Authorization: Bearer <admin_token>

Response 200:
{
  "totalUsers": 10000,
  "totalVotes": 8500,
  "blockedUsers": 15,
  "anomalyReports": 42
}
```

## 🔒 Security Features

### 1. OTP Security
- Cryptographically secure random generation
- SHA-256 hashing before storage
- 150-second expiry (2.5 minutes)
- Max 3 verification attempts
- Rate limiting: 5 OTPs per hour

### 2. Data Protection
- Aadhaar numbers hashed with bcrypt (12 rounds)
- JWT tokens with 1-hour expiry
- Encrypted biometric data
- Voter identity separated from ballot data

### 3. Rate Limiting
- Global: 100 requests/15 min per IP
- Auth endpoints: 5 requests/15 min
- OTP requests: 5 per hour

### 4. Input Validation
- express-validator on all endpoints
- Sanitization of user inputs
- XSS protection via helmet

## 📊 Logging

All critical operations are logged with Winston:

```javascript
// Log levels: error, warn, info, debug
logger.info('Vote cast successfully', { epicNumber, trackingCode });
logger.error('Database error', { error: err.message });
```

Logs are stored in:
- Console (development)
- `logs/app.log` (production)
- MongoDB collection (optional)

## 🧪 Testing

### Seed Test Data
```bash
npm run seed
```

### Mock OTP Mode
In development, OTPs are logged to console instead of SMS:
```
📱 [DEV] OTP for +919876543210: 123456
```

### Test Endpoints (Postman/Thunder Client)
Import the provided Postman collection from `docs/postman_collection.json`

## 🚀 Production Deployment

### 1. Environment Setup
```bash
# Set production environment
NODE_ENV=production

# Use strong secrets (32+ characters)
JWT_SECRET=$(openssl rand -base64 32)
SESSION_SECRET=$(openssl rand -base64 32)

# Configure production database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/voting_system

# Enable Redis with password
REDIS_PASSWORD=your_redis_password

# Configure real SMS/Email providers
TWILIO_ACCOUNT_SID=actual_sid
SENDGRID_API_KEY=actual_key
```

### 2. PM2 Configuration
```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start index.js --name eci-backend -i max

# Save process list
pm2 save

# Setup startup script
pm2 startup
```

### 3. Nginx Reverse Proxy
```nginx
server {
    listen 443 ssl http2;
    server_name api.ecivote.gov.in;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

## 📞 Support

For issues or questions:
- Email: support@ecivote.gov.in
- Docs: https://docs.ecivote.gov.in
- GitHub Issues: [Create Issue]

## 📄 License

Copyright © 2025 Election Commission of India. All rights reserved.