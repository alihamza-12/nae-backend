const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_DB_URL);
    console.log("DataBase is Connected");
  } catch (err) {
    console.error("Error connecting to DataBase", err);
  }
};
module.exports = {
  connectDB,
};
