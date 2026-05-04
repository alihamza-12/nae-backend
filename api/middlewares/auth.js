const jwt = require("jsonwebtoken");
const Admin = require("../models/admin");

const protect = async (req, res, next) => {
  // console.log("=== protect middleware hit ===");
  console.log("req.cookies:", req.cookies);
  // console.log("req.headers.authorization:", req.headers.authorization);

  let token;

  // 1. Check Authorization header (Bearer)
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
    console.log("Token from header:", token);
  }
  // 2. Fallback to cookie
  else if (req.cookies && req.cookies.adminToken) {
    token = req.cookies.adminToken;
    console.log("Token from cookie:", token);
  }

  // 3. No token found
  if (!token) {
    console.log("No token found");
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get admin from token
    req.admin = await Admin.findById(decoded.id).select("-password");

    console.log("Admin authenticated:", req.admin?.email);
    next();
  } catch (error) {
    console.error("JWT Error:", error.message);
    res.status(401).json({ message: "Not authorized, invalid token" });
  }
};

module.exports = { protect };
