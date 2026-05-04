// Creating a Express server
const express = require("express");
const { connectDB } = require('../src/config/database')
const dotenv = require("dotenv");
const cors = require("cors");


const app = express();

// Middleware
app.use(express.json());
const cookieParser = require("cookie-parser");
app.use(cookieParser());

dotenv.config();
// ✅ ADD THIS (VERY IMPORTANT)
app.use(cors({
  origin: "http://localhost:5173", // React frontend
  credentials: true               // allow cookies (JWT auth)
}));


const adminAuth = require("../src/routes/adminAuth");

// Routes
app.use("/", adminAuth);

app.use('/health', (req, res) => {
  res.send('ok')
})

// Error handling middleware - ensure JSON responses
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

//Server Start when and only DataBase is connected
connectDB()
  .then(() => {
    app.listen(3000, () => {
      console.log("Server is successfully Listening to Port:3000");
    });
  })
  .catch((err) => {
    console.log("DB connection failed ", err);
  });


module.exports = app