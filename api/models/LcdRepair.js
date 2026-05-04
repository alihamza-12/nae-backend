const mongoose = require("mongoose");
const crypto = require("crypto");

const lcdRepairSchema = new mongoose.Schema(
  {
    jobNo: {
      type: String,
      unique: true,
      trim: true,
      default: function () {
        return `JOB-${Date.now()}-${crypto.randomInt(1000, 9999)}`;
      },
    },
    modelNo: {
      type: String,
      required: [true, "Model No is required"],
      trim: true,
    },
    serialNo: {
      type: String,
      required: [true, "Serial No is required"],
      trim: true,
    },
    brand: {
      type: String,
      required: [true, "Brand Name is required"],
      trim: true,
    },
    customerName: {
      type: String,
      trim: true,
      required: [true, "Customer name is required"],
      // lowercase: true,
    },
    phoneNo: {
      type: String,
      required: [true, "Phone No is required"],
      trim: true,
    },
    repairingPrice: {
      type: Number,
      required: [true, "Reparing Price is required"],
      min: 0,
    },
    advance: {
      type: Number,
      min: 0,
      default: 0,
    },
    // leftMoney: {
    //   type: Number,
    //   // required: [true, "Left Money is required"],
    //   min: 0,
    //   default: 0,
    // },
    issueDescription: {
      type: String,
      required: [true, "Issue Description is required"],
      trim: true,
    },
    receivedDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Completed", "Delivered"],
      default: "Pending",
    },
  },
  {
    timestamps: true,
  },
);

lcdRepairSchema.virtual("leftMoney").get(function () {
  const price = this.repairingPrice || 0;
  const advance = this.advance || 0;
  return price - advance;
});

lcdRepairSchema.set("toJSON", { virtuals: true });
lcdRepairSchema.set("toObject", { virtuals: true });

// indexes
// lcdRepairSchema.index({ jobNo: 1 });
lcdRepairSchema.index({ phoneNo: 1 });
lcdRepairSchema.index({ customerName: 1 });

module.exports = mongoose.model("LcdRepair", lcdRepairSchema);
