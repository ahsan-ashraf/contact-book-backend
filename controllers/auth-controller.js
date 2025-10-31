const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const HttpError = require("../models/http-error");
const User = require("../models/user-model");
const RefreshToken = require("../models/token-model");
const tokenService = require("../token-service");
const mongoose = require("mongoose");

//------------LOGIN------------\\
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

  const isValidPassword = await bcrypt.compare(password, existingUser.password);
  if (!isValidPassword) {
    return next(new HttpError("Invalid email or password", 401));
  }

  const userPayload = {
    userId: existingUser._id,
    email: existingUser.email,
  };
  let accessToken, refreshToken;
  try {
    accessToken = tokenService.generateAccessToken(userPayload);
    refreshToken = await tokenService.generateRefreshToken(userPayload);
  } catch (err) {
    return next(new HttpError("Login failed, please try again later.", 500));
  }

  const isProduction = process.env.NODE_ENV === "production";
  // Set refresh token as HttpOnly cookie (recommended)
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isProduction, // only over https in prod
    sameSite: isProduction ? "none" : "lax", // "none" required for cross-site cookies
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000, // match REFRESH_TOKEN_EXPIRES_IN (7 days)
  });

  res.status(200).json({
    message: "Login successful",
    userId: existingUser.id,
    email: existingUser.email,
    accessToken: accessToken,
  });
};

//------------SIGNUP------------\\
const signup = async (req, res, next) => {
  const { email, username, password } = req.body;

  if (!email || !username || !password) {
    return next(new HttpError("All fields are required", 400));
  }

  let existingUser;
  try {
    existingUser = await User.findOne({ email }).exec();
  } catch (err) {
    return next(new HttpError("Signup failed, please try again later.", 500));
  }

  if (existingUser) {
    return next(new HttpError("Email already exists", 409));
  }

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    return next(new HttpError("Could not create user, please try again.", 500));
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const newUser = new User({
      email,
      username,
      password: hashedPassword,
    });
    await newUser.save({ session });

    const userPayload = {
      userId: newUser._id,
      email: newUser.email,
    };

    // Token creation inside transaction
    const accessToken = tokenService.generateAccessToken(userPayload);
    const refreshToken = await tokenService.generateRefreshToken(
      userPayload,
      session
    );

    await session.commitTransaction();
    session.endSession();

    // Set refresh token as HttpOnly cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: isProduction ? "none" : "lax", // "none" required for cross-site cookies
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      message: "Signup successful",
      userId: newUser.id,
      email: newUser.email,
      accessToken,
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return next(new HttpError("Signup failed, rolling back changes.", 500));
  } finally {
    session.endSession();
  }
};

const refreshToken = async (req, res, next) => {
  const token = req.cookies.refreshToken;

  if (!token) {
    return res.status(401).json({ message: "No refresh token" });
  }

  const response = await tokenService.isRefreshTokenValid(token);
  if (!response.valid)
    return res.status(403).json({ message: "Refresh token revoked" });

  jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, async (err, payload) => {
    if (err) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    // Issue new access token
    const user = { userId: payload.userId, email: payload.email };
    const accessToken = tokenService.generateAccessToken(user);

    try {
      // rotate refresh token: revoke old, issue new
      await tokenService.revokeRefreshToken(token);
      const newRefreshToken = await tokenService.generateRefreshToken(user);

      // Set refresh token as HttpOnly cookie (recommended)
      res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // only over https in prod
        sameSite: isProduction ? "none" : "lax", // "none" required for cross-site cookies
        path: "/",
        maxAge: 7 * 24 * 60 * 60 * 1000, // match REFRESH_TOKEN_EXPIRES_IN (7 days)
      });

      res.json({ accessToken });
    } catch (err) {
      return res.status(500).json({ message: "something went wrong." });
    }
  });
};

const logout = async (req, res, next) => {
  const token = req.cookies.refreshToken;
  if (token) await tokenService.revokeRefreshToken(token);

  res.clearCookie("refreshToken", { path: "/" });
  return res.json({ message: "Logged out" });
};

exports.login = login;
exports.signup = signup;
exports.refreshToken = refreshToken;
exports.logout = logout;
