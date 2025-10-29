require("dotenv").config();
const mongoose = require("mongoose");

const { DB_USER, DB_PASSWORD, DB_NAME } = process.env;
const connectionString = `mongodb+srv://${DB_USER}:${DB_PASSWORD}@cluster0.kz842a7.mongodb.net/${DB_NAME}?appName=Cluster0`;

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(connectionString);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
