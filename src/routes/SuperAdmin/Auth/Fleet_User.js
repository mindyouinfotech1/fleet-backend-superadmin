import express from "express";
import {
  createSubAdmin,
  login,
  logout,
} from "../../../controllers/SuperAdmin/Auth/Fleet_User.js";
import { verifyToken, isOrgAdmin } from "../../../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.post("/login", login);
router.post("/logout", logout);

// Protected — only a logged-in ORG ADMIN can create a sub-admin
router.post("/sub-admin/create", verifyToken, isOrgAdmin, createSubAdmin);

export default router;
