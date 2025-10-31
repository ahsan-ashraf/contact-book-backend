const express = require("express");
const bodyparser = require("body-parser");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./db");
const cookieParser = require("cookie-parser");

dotenv.config();

// middlewares
const checkAuth = require("./middlewares/check-auth");

// Controllers
const authRoutes = require("./routes/auth-routes");
const contactBookRoutes = require("./routes/contact-book-routes");

const app = express();

const allowedOrigins = [
  "http://localhost:5173", // for local dev
  "https://contact-book-frontend-eta.vercel.app", // replace with your actual Vercel URL later
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(bodyparser.json());
app.use(cookieParser());
app.use("/api/auth", authRoutes);
app.use("/api/contact-book", checkAuth, contactBookRoutes);

app.use((error, req, res, next) => {
  console.error("GLOBAL ERROR:", error);
  res.status(error.code || 500).json({
    message: error.message || "Unknown Server Error",
    stack: error.stack, // remove in production
  });
});

connectDB()
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log(`Server is running on port ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log(`Error Connecting to Database: ${err}`);
  });
