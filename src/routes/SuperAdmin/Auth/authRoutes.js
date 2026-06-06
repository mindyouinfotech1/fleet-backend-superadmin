import express from "express";

import {
  signup,
  checkEmail,
  login,
  logout,
  getUsers,
  getUserById,
  register,
  resetPassword,
} from "../../../controllers/SuperAdmin/Auth/authController.js";

// import authMiddleware from "../middleware/auth.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/check-email", checkEmail);
router.post("/login", login);
router.post("/logout", logout);
router.get("/", getUsers);
router.get("/:id", getUserById);
router.post("/register", register);
router.post("/reset-password", resetPassword);

export default router;
