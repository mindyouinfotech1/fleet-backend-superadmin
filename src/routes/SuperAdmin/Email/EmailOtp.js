import express from "express";
import {
  sendEmailOtp,
  verifyAndUpdateEmail,
} from "../../../controllers/SuperAdmin/Email/EmailOtp.js";

const router = express.Router();

router.post("/send-otp", sendEmailOtp);
router.post("/verify-update", verifyAndUpdateEmail);

export default router;
