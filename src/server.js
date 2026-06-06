import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import cors from "cors";

import authRoutes from "./routes/SuperAdmin/Auth/authRoutes.js";

dotenv.config();
connectDB();

const app = express();

// Middleware

app.use(express.json());
app.use(cors());

app.use(express.urlencoded({ extended: true }));

// Static folder for uploaded files
app.use("/uploads", express.static("public/uploads"));

// Auth Routes
app.use("/api/auth", authRoutes);

// Root Route
app.get("/", (req, res) => {
  res.send("School Management API is running!");
});

// Start Server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
