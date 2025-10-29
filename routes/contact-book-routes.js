const express = require("express");
const contactsController = require("../controllers/contact-book-controller");

const router = express.Router();

router.get("/", contactsController.getAllContacts);
router.post("/add", contactsController.addContact);
router.patch("/update/:cid", contactsController.editContact);
router.delete("/delete/:cid", contactsController.deleteContact);

module.exports = router;
