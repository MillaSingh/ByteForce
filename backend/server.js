const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
require("dotenv").config({ path: "../.env" });

const clinicsRouter = require("./src/routes/clinics");
const dashboardRouter = require("./src/routes/dashboardRoutes");
const appointmentRouter = require("./src/routes/appointments");
const authRouter = require("./src/routes/authRoutes");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cookieParser());

app.use(express.static(path.join(__dirname, "../frontend")));

app.get("/", (req, res) => {
  res.redirect("/html/Login.html");
});

app.use("/api/auth", authRouter);
app.use("/api/clinics", clinicsRouter);
app.use("/api/queue", dashboardRouter);
app.use("/api/appointments", appointmentRouter);

// Only start server if NOT testing
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
