const mongoose = require("mongoose");

const contactsSchema = new mongoose.Schema({
  name: { type: String, required: true },
  about: { type: String, required: true },
  address: { type: String, required: true },
  relation: { type: String, required: true },
  phone: { type: String, required: true },

  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
});

const Contact = mongoose.model("Contact", contactsSchema);
module.exports = Contact;
