const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  username: { type: String, required: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  contactsList: [
    { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Contact" },
  ], // relation with contact model
});

const User = mongoose.model("User", userSchema);
module.exports = User;
