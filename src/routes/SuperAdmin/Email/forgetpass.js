import express from "express";
import {
  sendForgotPasswordOtp,
  verifyForgotPasswordOtp,
  resetPassword,
} from "../../../controllers/SuperAdmin/Email/forgetpass.js";

const router = express.Router();

router.post("/send-otp", sendForgotPasswordOtp);
router.post("/verify-otp", verifyForgotPasswordOtp);
router.post("/reset-password", resetPassword);
export default router;
