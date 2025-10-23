const jwt = require("jsonwebtoken");
const HttpError = require("../models/http-error");
const User = require("../models/users-model");
const { default: mongoose } = require("mongoose");

const getAllUsers = async (req, res, next) => {
  const allUsers = await User.find().exec();
  return res.status(200).json({ allUsers });
};
const getUserById = async (req, res, next) => {
  const userId = req.params.uid;
  let user;
  try {
    user = await User.findOne({ _id: userId }).exec();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, couldn't get the user at this time.",
      404
    );
    return next(error);
  }

  if (user) {
    return res.json({ user });
  }
  const error = new HttpError(
    "Couldn't find the user for the provided user id",
    404
  );
};
const deleteUserById = async (req, res, next) => {
  const id = req.params.uid;
  if (!id) {
    // const error = new HttpError("User id is required to delete the user.", 402);
    // return next(error);
    return res.status(402).json({ message: "Invalid id passed" });
  }
  let result;
  try {
    result = await User.deleteOne({ _id: id });
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, couldn't delete user at this moment"
    );
    return next(error);
  }
  return res.status(202).json(result);
};

exports.getAllUsers = getAllUsers;
exports.getUserById = getUserById;
exports.deleteUserById = deleteUserById;
