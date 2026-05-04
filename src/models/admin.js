const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("Admin", adminSchema);
// const AdminModel = new mongoose.model(
//   "Admin",
//   adminSchema
// );

// module.exports = AdminModel;
