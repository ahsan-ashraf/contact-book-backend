const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const HttpError = require("../models/http-error");
const User = require("../models/user-model");

const JWT_ACCESS_TOKEN_EXPIRES_IN = process.env.JWT_ACCESS_TOKEN_EXPIRES_IN;
const JWT_SECRET_KEY = process.env.JWT_SECRET;

const login = async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new HttpError("email and password are required", 400));
  }

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email }).exec();
  } catch (err) {
    return next(new HttpError("Login failed, please try again later.", 500));
  }
  if (!existingUser) {
    return next(new HttpError("Invalid email or password", 401));
  }

  // Compare hashed passwords
  const isValidPassword = await bcrypt.compare(password, existingUser.password);
  if (!isValidPassword) {
    return next(new HttpError("Invalid email or password", 401));
  }

  // Generate JWT
  let accessToken;
  try {
    accessToken = jwt.sign(
      { userId: existingUser.id, email: existingUser.email },
      JWT_SECRET_KEY,
      { expiresIn: JWT_ACCESS_TOKEN_EXPIRES_IN }
    );
  } catch (err) {
    return next(new HttpError("Login failed, please try again later.", 500));
  }

  res.status(200).json({
    message: "Login successful",
    userId: existingUser.id,
    email: existingUser.email,
    accessToken: accessToken,
  });
};

// ------------------ SIGNUP ------------------
const signup = async (req, res, next) => {
  const { email, username, password } = req.body;

  if (!email || !username || !password) {
    return next(new HttpError("All fields are required", 400));
  }

  // Check for existing user
  let existingUser;
  try {
    existingUser = await User.findOne({ email }).exec();
  } catch (err) {
    return next(new HttpError("Signup failed, please try again later.", 500));
  }

  if (existingUser) {
    return next(new HttpError("Email already exists", 409));
  }

  // Hash password
  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    return next(new HttpError("Could not create user, please try again.", 500));
  }

  // Create user
  const newUser = new User({
    email,
    username,
    password: hashedPassword,
  });

  try {
    await newUser.save();
  } catch (err) {
    return next(new HttpError("Signup failed, please try again later.", 500));
  }

  // Create JWT
  let token;
  try {
    token = jwt.sign({ userId: newUser.id, email }, JWT_SECRET_KEY, {
      expiresIn: JWT_ACCESS_TOKEN_EXPIRES_IN,
    });
  } catch (err) {
    return next(
      new HttpError("Signup succeeded but failed to create token.", 500)
    );
  }

  res.status(201).json({
    message: "Signup successful",
    userId: newUser.id,
    email: newUser.email,
    token,
  });
};

exports.login = login;
exports.signup = signup;
