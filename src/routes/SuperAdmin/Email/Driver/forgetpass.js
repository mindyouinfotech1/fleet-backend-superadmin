import express from "express";

import {
  sendForgotPasswordOtp,
  verifyForgotPasswordOtp,
} from "../../../../controllers/SuperAdmin/Email/Driver/forgetpass.js";

const router = express.Router();

// Send forgot password OTP
router.post("/send-forgot-password-otp", sendForgotPasswordOtp);

// Verify forgot password OTP
router.post("/verify-forgot-password-otp", verifyForgotPasswordOtp);

export default router;
