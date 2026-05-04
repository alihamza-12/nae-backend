const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Admin = require("../models/admin");
const LcdRepair = require("../models/LcdRepair");
const { protect } = require("../middlewares/auth");

const adminAuth = express.Router();

//Admin-login Api
adminAuth.post("/admin/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. find admin in DB
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(400).json({ message: "Invalid admin credentials." });
    }

    // 2. compare password
    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid admin credentials." });
    }

    // 3. success - generate JWT
    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    // Set httpOnly cookie for 1 day
    res.cookie("adminToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    res.json({
      message: "Admin login successful",
      token,
      admin: {
        id: admin._id,
        email: admin.email,
      },
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Server error");
  }
});

// LCD Repair Routes - Protected
// Create new repair record
adminAuth.post("/lcd-repairs", protect, async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({ message: "Request body is missing" });
    }
    const {
      // jobNo,
      modelNo,
      serialNo,
      brand,
      customerName,
      phoneNo,
      repairingPrice,
      advance,
      // leftMoney,
      issueDescription,
      receivedDate,
      status,
    } = req.body;

    // Validation
    if (!customerName) {
      return res.status(400).json({ message: "Customer name is required" });
    }
    if (phoneNo && !/^[0-9]{10,15}$/.test(phoneNo)) {
      return res.status(400).json({ message: "Invalid phone number" });
    }
    if (
      status &&
      !["Pending", "In Progress", "Completed", "Delivered"].includes(status)
    ) {
      return res.status(400).json({ message: "Invalid status" });
    }
    if (repairingPrice === undefined) {
      return res.status(400).json({ message: "Repairing price required" });
    }

    const repairingPriceNum = Number(repairingPrice);
    if (Number.isNaN(repairingPriceNum) || repairingPriceNum < 0) {
      return res.status(400).json({ message: "Invalid repairing price" });
    }

    const advanceNum = advance === undefined ? 0 : Number(advance);

    if (advance !== undefined && (isNaN(advanceNum) || advanceNum < 0)) {
      return res
        .status(400)
        .json({ message: "Advance must be a positive number" });
    }
    // leftMoney is virtual - auto-computed

    // Create repair
    const repair = new LcdRepair({
      modelNo,
      serialNo,
      brand,
      customerName,
      phoneNo,
      repairingPrice: repairingPriceNum,
      advance: advanceNum,
      issueDescription,
      receivedDate: receivedDate ? new Date(receivedDate) : new Date(),
      status: status || "Pending",
    });

    await repair.save();

    res.status(201).json({
      message: "Repair record created successfully",
      repair,
    });
  } catch (error) {
    console.error("LCD Repair creation failed:", error.message, error.stack);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get all repairs or filter by status
adminAuth.get("/lcd-repairs", protect, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    // console.log(filter)
    const repairs = await LcdRepair.find(filter).sort({ receivedDate: -1 });
    res.json({
      message: "Repairs fetched successfully",
      count: repairs.length,
      repairs,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update repair record (mainly status)
adminAuth.patch("/lcd-repairs/:id", protect, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Validate status if provided
    if (
      updateData.status &&
      !["Pending", "In Progress", "Completed", "Delivered"].includes(
        updateData.status,
      )
    ) {
      return res.status(400).json({ message: "Invalid status" });
    }

    // Number conversion & validation for numeric updates
    if (updateData.repairingPrice !== undefined) {
      const repairingPriceNum = Number(updateData.repairingPrice);
      if (isNaN(repairingPriceNum) || repairingPriceNum < 0) {
        return res
          .status(400)
          .json({ message: "Repairing price must be a positive number" });
      }
      updateData.repairingPrice = repairingPriceNum;
    }
    if (updateData.advance !== undefined) {
      const advanceNum = Number(updateData.advance);
      if (isNaN(advanceNum) || advanceNum < 0) {
        return res
          .status(400)
          .json({ message: "Advance must be a positive number" });
      }
      updateData.advance = advanceNum;
    }
    const existing = await LcdRepair.findById(id);

    if (!existing) {
      return res.status(404).json({ message: "Repair record not found" });
    }

    if (
      updateData.repairingPrice !== undefined ||
      updateData.advance !== undefined
    ) {
      const repairingPrice =
        updateData.repairingPrice ?? existing.repairingPrice;

      const advance = updateData.advance ?? existing.advance;

      // leftMoney is virtual - no need to set
    }

    const repair = await LcdRepair.findByIdAndUpdate(
      id,
      { $set: updateData },
      { returnDocument: "after", runValidators: true },
    );

    if (!repair) {
      return res.status(404).json({ message: "Repair record not found" });
    }

    res.json({
      message: "Repair record updated successfully",
      repair,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});
//Search repairs
adminAuth.get("/lcd-repairs/search", protect, async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ message: "Search query required" });
    }

    const isNumberOnly = /^\d+$/.test(query);
    const isJobLike = query.startsWith("JOB-");

    let filter;

    if (isNumberOnly) {
      filter = { phoneNo: query };
    } else if (isJobLike) {
      filter = { jobNo: { $regex: query, $options: "i" } };
    } else {
      filter = {
        $or: [
          { jobNo: { $regex: query, $options: "i" } },
          { customerName: { $regex: query, $options: "i" } },
        ],
      };
    }
    const repairs = await LcdRepair.find(filter);

    res.json(repairs);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Protected demo route
adminAuth.get("/admin/profile", protect, (req, res) => {
  res.json({
    message: "Admin profile accessed successfully",
    admin: req.admin,
  });
});

// Admin logout - clear cookie
adminAuth.post("/admin/logout", protect, (req, res) => {
  // Clear the adminToken cookie
  res.clearCookie("adminToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  res.json({
    message: "Admin logged out successfully",
  });
});

module.exports = adminAuth;
