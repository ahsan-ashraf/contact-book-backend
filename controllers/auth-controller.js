const jwt = require("jsonwebtoken");
const HttpError = require("../models/http-error");
const User = require("../models/user-model");

const login = async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    const error = new HttpError("email and password are required", 404);
    return next(error);
  }
  const existingUser = await User.findOne({ email: email }).exec();

  if (existingUser && existingUser.password === password) {
    let token = null;
    try {
      token = jwt.sign(
        { userId: existingUser.id, email: existingUser.email },
        "SuperSecrete_Key_DontShareIt",
        { expiresIn: "1h" }
      );
    } catch (err) {
      const error = new HttpError(
        "Couldn't Authenticate, Something went wrong: " + err,
        500
      );
      return next(error);
    }

    return res.status(202).json({
      message: "Login Successfully!",
      userId: existingUser.id,
      email: existingUser.email,
      token,
    });
  } else {
    const error = new HttpError(
      "Authentication Failed, Invalid email or password",
      404
    );
    return next(error);
  }
};

const signup = async (req, res, next) => {
  const { email, username, password } = req.body;

  const user = await User.findOne({ email: email }).exec();
  if (user) {
    const error = new HttpError("Email already exists", 401);
    return next(error);
  }

  let newUser;
  try {
    newUser = User({
      email,
      username,
      password,
    });
    await newUser.save();
  } catch (err) {
    const error = new HttpError("Couldn't signup: " + err, 500);
    return next(error);
  }

  let token = null;
  try {
    token = jwt.sign(
      { id: newUser.id, email },
      "SuperSecrete_Key_DontShareIt",
      { expiresIn: "1h" }
    );
  } catch (err) {
    const error = new HttpError(
      "Couldn't signin, something went wrong: " + err,
      500
    );
    return next(error);
  }

  return res.status(201).json({
    message: "Signin successfully",
    id: newUser.id,
    email: newUser.email,
    token,
  });
};

exports.login = login;
exports.signup = signup;
