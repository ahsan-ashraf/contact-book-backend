const express = require("express");
const usersController = require("../controllers/user-controller");

const router = express.Router();

router.get("/", usersController.getAllUsers);
router.get("/:uid", usersController.getUserById);
router.delete("/:uid", usersController.deleteUserById);

module.exports = router;
