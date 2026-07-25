import express from "express";

import {
  sendDriverEmailOtp,
  verifyAndUpdateDriverEmail,
} from "../../../../controllers/SuperAdmin/Email/Driver/EmailOtp.js";

const router = express.Router();

router.post("/send-driver-otp", sendDriverEmailOtp);

router.post("/verify-driver-email", verifyAndUpdateDriverEmail);

export default router;
