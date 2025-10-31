const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const HttpError = require("./models/http-error");
const RefreshToken = require("./models/token-model");

dotenv.config();

class TokenService {
  constructor() {
    this.ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
    this.REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
    this.ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN;
    this.REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN;
  }

  generateAccessToken(user) {
    try {
      return jwt.sign(
        { userId: user.userId, email: user.email },
        this.ACCESS_TOKEN_SECRET,
        { expiresIn: this.ACCESS_TOKEN_EXPIRES_IN }
      );
    } catch (err) {
      throw new HttpError("Access Token Generation Failed!", 500);
    }
  }

  async generateRefreshToken(user, session) {
    try {
      const refreshToken = jwt.sign(
        { userId: user.userId, email: user.email },
        this.REFRESH_TOKEN_SECRET,
        { expiresIn: this.REFRESH_TOKEN_EXPIRES_IN }
      );

      // Convert expiration string (e.g. "7d", "1h") into a Date
      const expiresInMs = this.#parseExpiryToMs(this.REFRESH_TOKEN_EXPIRES_IN);
      const expiresAt = new Date(Date.now() + expiresInMs);

      // Save token in DB
      const tokenDoc = new RefreshToken({
        userId: user.userId,
        token: refreshToken,
        expiresAt,
      });

      if (session) await tokenDoc.save({ session });
      else tokenDoc.save();

      return refreshToken;
    } catch (err) {
      throw new HttpError(
        "Refresh Token Generation Failed: " + err.message,
        500
      );
    }
  }

  async revokeRefreshToken(tokenString) {
    try {
      const result = await RefreshToken.findOneAndDelete({
        token: tokenString,
      }).exec();

      return result
        ? { success: true, message: "Refresh token revoked successfully." }
        : { success: false, message: "Token not found." };
    } catch (err) {
      throw new Error("Error revoking refresh token: " + err.message);
    }
  }

  async isRefreshTokenValid(tokenString) {
    try {
      const tokenDoc = await RefreshToken.findOne({
        token: tokenString,
      }).exec();

      if (!tokenDoc) {
        return { valid: false, message: "Token not found." };
      }

      if (tokenDoc.expiresAt < new Date()) {
        await RefreshToken.deleteOne({ _id: tokenDoc._id }); // cleanup expired token
        return { valid: false, message: "Token has expired." };
      }

      return {
        valid: true,
        message: "Token is valid.",
        userId: tokenDoc.userId,
      };
    } catch (err) {
      throw new Error("Error validating refresh token: " + err.message);
    }
  }

  // Helper: parse "7d", "1h", "15m" → milliseconds
  #parseExpiryToMs(expiryString) {
    const match = expiryString.match(/^(\d+)([smhd])$/);
    if (!match) return 0;
    const value = parseInt(match[1]);
    const unit = match[2];
    switch (unit) {
      case "s":
        return value * 1000;
      case "m":
        return value * 60 * 1000;
      case "h":
        return value * 60 * 60 * 1000;
      case "d":
        return value * 24 * 60 * 60 * 1000;
      default:
        return 0;
    }
  }
}

module.exports = new TokenService();
