const mongoose = require("mongoose");

mongoose.set("bufferCommands", false);

const MONGO_DB_URL = process.env.MONGO_DB_URL;

if (!MONGO_DB_URL) {
  throw new Error("MONGO_DB_URL is missing");
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = {
    conn: null,
    promise: null,
  };
}

const connectDB = async () => {
  // already connected
  if (cached.conn) {
    return cached.conn;
  }

  // create connection once
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGO_DB_URL, {
      serverSelectionTimeoutMS: 30000,
    });
  }

  try {
    cached.conn = await cached.promise;

    console.log("MongoDB Connected");

    return cached.conn;
  } catch (err) {
    cached.promise = null;

    console.error("MongoDB Error:", err);

    throw err;
  }
};

module.exports = { connectDB };
