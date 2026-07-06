import express from "express";
import {
  sendForgotPasswordOtp,
  verifyForgotPasswordOtp,
} from "../../../controllers/SuperAdmin/Email/forgetpass.js";

const router = express.Router();


router.post("/forgot-password/send-otp", sendForgotPasswordOtp);
router.post("/forgot-password/verify-otp", verifyForgotPasswordOtp);

export default router;
