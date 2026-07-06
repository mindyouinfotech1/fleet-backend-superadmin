import express from "express";
import {
  createSubAdmin,
  login,
  logout,
} from "../../../controllers/SuperAdmin/Auth/Fleet_User.js";
import { verifyToken, isOrgAdmin } from "../../../middleware/authMiddleware.js";

const router = express.Router();


router.post("/login", login);
router.post("/logout", logout);


router.post("/sub-admin/create", verifyToken, isOrgAdmin, createSubAdmin);

export default router;
