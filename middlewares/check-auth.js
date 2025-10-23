const jwt = require("jsonwebtoken");
const HttpError = require("../models/http-error");

module.exports = (req, res, next) => {
  const authHeader = req?.headers?.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new HttpError("Authentication failed! Token missing.", 401));
  }
  const token = authHeader.split(" ")[1];
  try {
    const decodedToken = jwt.verify(token, "SuperSecrete_Key_DontShareIt"); // TODO: exclude the secrete key from here to env file.
    req.userData = { userId: decodedToken.userId, email: decodedToken.email };
    next();
  } catch (err) {
    // jwt.verify throws for invalid/expired token — return 401
    const error = new HttpError(
      "Authentication failed! Invalid or expired token.",
      401
    );
    return next(error);
  }
};
