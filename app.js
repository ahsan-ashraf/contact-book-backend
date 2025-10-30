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

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(bodyparser.json());
app.use(cookieParser());
app.use("/api/auth", authRoutes);
app.use("/api/contact-book", checkAuth, contactBookRoutes);

connectDB()
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log(`Server is running on port ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log(`Error Connecting to Database: ${err}`);
  });
