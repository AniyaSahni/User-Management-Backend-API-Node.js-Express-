const errorHandler = require("./middleware/errorHandler");
const express = require("express");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");

dotenv.config();

const app = express();

app.use(express.json());

app.use(cookieParser());

app.get("/test", (req, res) => {
    res.send("Server Working");
});

app.use("/api/auth", require("./routes/authRoutes"));

app.use(errorHandler);

module.exports = app;