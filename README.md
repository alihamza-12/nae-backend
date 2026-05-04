# Armeco Electronics - LCD Repair Management System 🚀

## 📖 Project Description

**new-armeco-electronics** is a robust **Node.js/Express/MongoDB backend API** designed for **Armeco Electronics**, an LCD repair service shop.

This system allows **admin users** to:

- Securely login and manage repair jobs
- Create detailed repair records with auto-generated job numbers
- Track job progress through status workflow (Pending → In Progress → Completed → Delivered)
- Calculate remaining payments automatically (virtual `leftMoney` field)
- Search/filter jobs by customer name, phone, job number, or status
- Full CRUD operations on repair records

Built with production-ready security (JWT auth with httpOnly cookies), input validation, error handling, and optimized MongoDB queries.

## ✨ Key Features

- **Admin Authentication**: JWT-based login/logout with secure httpOnly cookies (1-day expiry)
- **Repair Job Management**:
  - Auto-generate unique `jobNo` (e.g., `JOB-1728000000-1234`)
  - Track customer details, device info (model/serial/brand), pricing, advance payments
  - Status workflow: `Pending` | `In Progress` | `Completed` | `Delivered`
  - Virtual computed field: `leftMoney = repairingPrice - advance`
- **Search & Filter**: By customer name, phone number, jobNo, or status
- **Validation**: Comprehensive input validation (phone format, prices ≥ 0, valid status enum)
- **Security**: Protected routes, bcrypt password hashing, JWT verification
- **Performance**: MongoDB indexes on `phoneNo` and `customerName` for fast searches

## 🛠️ Tech Stack

| Category       | Technologies          |
| -------------- | --------------------- |
| **Backend**    | Node.js, Express.js 5 |
| **Database**   | MongoDB, Mongoose 9   |
| **Auth**       | JWT 9, bcrypt 6       |
| **Middleware** | cookie-parser, dotenv |
| **Dev Tools**  | nodemon 3             |

### Dependencies

```bash
bcrypt@^6.0.0
cookie-parser@^1.4.7
dotenv@^17.4.2
express@^5.2.1
jsonwebtoken@^9.0.3
mongoose@^9.5.0
nodemon@^3.1.14
```

## 📁 Project Structure

```
new-armeco-electronics/
├── package.json          # Dependencies & scripts
├── .gitignore
├── src/
│   ├── app.js            # Express server entry point
│   ├── config/
│   │   └── database.js   # MongoDB connection
│   ├── middlewares/
│   │   └── auth.js       # JWT protect middleware
│   ├── models/
│   │   ├── admin.js      # Admin schema (email, password)
│   │   └── LcdRepair.js  # Repair schema w/ virtuals & indexes
│   └── routes/
│       └── adminAuth.js  # All API routes (auth + repairs)
└── TODO.md              # Implementation tracking
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Git

### Setup

```bash
# Clone & Install
git clone https://github.com/alihamza-12/NAE-Store-Backend-/tree/main
cd new-armeco-electronics
npm install

# Create .env file
cp .env.example .env  # (create manually if no example)
```

### Environment Variables (`.env`)

```env
MONGO_DB_URL=mongodb://localhost:27017/armeco_electronics
# or MongoDB Atlas: mongodb+srv://user:pass@cluster.mongodb.net/armeco_electronics

JWT_SECRET=your-super-secret-jwt-key-minimum-32-chars-long-change-in-production
NODE_ENV=development  # Optional: production
```

### Run Development Server

```bash
npm run dev
# Server starts on http://localhost:3000
# Database connects automatically
```

## 📚 API Documentation

**Base URL**: `http://localhost:3000`

### Authentication

| Method | Endpoint         | Description           | Auth     | Body/Example                                                                                                |
| ------ | ---------------- | --------------------- | -------- | ----------------------------------------------------------------------------------------------------------- |
| `POST` | `/admin/login`   | Admin login           | None     | `{"email":"admin@armeco.com","password":"pass123"}`<br>**Response**: `{token, admin: {id, email}}` + cookie |
| `GET`  | `/admin/profile` | Get logged-in admin   | Required | -                                                                                                           |
| `POST` | `/admin/logout`  | Logout (clear cookie) | Required | -                                                                                                           |

### LCD Repair Management

| Method  | Endpoint              | Description                          | Auth     | Query/Params/Body                                                                                                                                                                                        |
| ------- | --------------------- | ------------------------------------ | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST`  | `/lcd-repairs`        | Create new repair                    | Required | `{"modelNo":"ABC123","serialNo":"SN456","brand":"Samsung","customerName":"John Doe","phoneNo":"9876543210","repairingPrice":5000,"advance":1000,"issueDescription":"Screen flicker","status":"Pending"}` |
| `GET`   | `/lcd-repairs`        | List all/filter by status            | Required | `?status=Pending` → `[{jobNo, customerName, leftMoney, status, ...}]`                                                                                                                                    |
| `PATCH` | `/lcd-repairs/:id`    | Update repair (status/price/advance) | Required | `{:id} = 507f1f77bcf86cd799439011`<br>`{"status":"Completed","advance":2000}`                                                                                                                            |
| `GET`   | `/lcd-repairs/search` | Search jobs                          | Required | `?query=John` or `?query=9876543210` or `?query=JOB-1728`                                                                                                                                                |

**Sample Responses**:

```json
// Create Repair
{
  "message": "Repair record created successfully",
  "repair": {
    "_id": "...",
    "jobNo": "JOB-1728234567-8923",
    "customerName": "John Doe",
    "leftMoney": 4000,
    "status": "Pending"
  }
}
```

## 🗄️ Database Schemas

### Admin

```javascript
{
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }  // Hashed with bcrypt
}
```

### LcdRepair (Key Fields)

```javascript
{
  jobNo: String,           // Auto: JOB-timestamp-random4digits (unique)
  modelNo: String (req),   // Device model
  serialNo: String (req),  // Device serial
  brand: String (req),
  customerName: String (req),
  phoneNo: String (req),   // Indexed
  repairingPrice: Number (req, ≥0),
  advance: Number (default:0, ≥0),
  leftMoney: Virtual,      // repairingPrice - advance
  issueDescription: String (req),
  receivedDate: Date (default:now),
  status: { enum: ["Pending","In Progress","Completed","Delivered"], default:"Pending" }
}
```

**Indexes**: `phoneNo`, `customerName`  
**Timestamps**: `createdAt`, `updatedAt` auto-enabled.

## 🧪 Testing with cURL/Postman

```bash
# 1. Login (save cookie jar)
curl -X POST http://localhost:3000/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@armeco.com","password":"pass123"}' \
  -c cookies.txt

# 2. Create repair (use cookie)
curl -X POST http://localhost:3000/lcd-repairs \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"modelNo":"SM-A52","serialNo":"SN123456",...}'
```

## 🔮 Future Enhancements

- [ ] Frontend Dashboard (React/Vue)
- [ ] SMS/Email notifications
- [ ] Reports/ Analytics (daily jobs, revenue)
- [ ] Multi-admin roles
- [ ] File uploads (photos of damage)
- [ ] Backup/Export jobs to Excel/PDF
- [ ] Unit/Integration tests (Jest)
- [ ] Docker deployment
- [ ] Rate limiting/Logging (Winston)

## 📞 Support

For issues, create GitHub issue or contact maintainer.

---

**Built with ❤️ for Armeco Electronics** | License: ISC
