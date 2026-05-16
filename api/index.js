const express = require("express");
const { connectDB } = require("./config/database");
const dotenv = require("dotenv");
const cors = require("cors");

const app = express();

// Middleware
app.use(express.json());

const cookieParser = require("cookie-parser");

app.use(cookieParser());

dotenv.config();

app.use(cors());

// ADD THIS
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("DB Error:", err);

    return res.status(500).json({
      success: false,
      message: "Database connection failed",
    });
  }
});

const adminAuth = require("./routes/adminAuth");

// Routes
// app.use("/", adminAuth);

app.use("/health", async (req, res) => {
  res.send("ok");
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);

  res.status(500).json({
    message: "Something went wrong!",
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});

module.exports = app;

//Server Start when and only DataBase is connected
// connectDB()
//   .then(() => {
//     app.listen(3000, () => {
//       console.log("Server is successfully Listening to Port:3000");
//     });
//   })
//   .catch((err) => {
//     console.log("DB connection failed ", err);
//   });
