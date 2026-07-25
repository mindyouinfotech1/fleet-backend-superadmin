import nodemailer from "nodemailer";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import TempEmailOtp from "../../../../models/SuperAdmin/Email/Driver/EmailOtp.js";
import { Driver } from "../../../../models/User/Drivers/Driver.js";

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: parseInt(process.env.MAIL_PORT) || 465,
  secure: true,
  auth: {
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD,
  },
});

// Generate 6 digit OTP
const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

// ================= SEND FORGOT PASSWORD OTP =================

export const sendForgotPasswordOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    // Check user exists
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "Email is not registered",
      });
    }

    const otp = generateOtp();

    const hashedOtp = await bcrypt.hash(otp, 10);

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Save OTP in same TempEmailOtp collection
    const otpData = await TempEmailOtp.findOneAndUpdate(
      { recipient_email: email },

      {
        recipient_email: email,
        otp: hashedOtp,
        otp_plain: otp,
        is_verified: false,
        attempts: 0,
        expires_at: expiresAt,
      },

      {
        new: true,
        upsert: true,
      },
    );

    console.log(`Forgot Password OTP for ${email}: ${otp}`);

    // Send OTP Mail
    await transporter.sendMail({
      from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM_ADDRESS}>`,

      to: email,

      subject: "Password Reset OTP",

      html: `
        <h3>Password Reset</h3>
        <p>Your OTP is:</p>
        <h2>${otp}</h2>
        <p>This OTP will expire in 5 minutes.</p>
      `,
    });

    return res.status(200).json({
      message: "Password reset OTP sent successfully",

      data: otpData,
    });
  } catch (error) {
    console.error("Forgot Password OTP Error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// ================= VERIFY FORGOT PASSWORD OTP =================

export const verifyForgotPasswordOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        message: "Email and OTP are required",
      });
    }

    // Find OTP record
    const otpRecord = await TempEmailOtp.findOne({
      recipient_email: email,
    });

    if (!otpRecord) {
      return res.status(404).json({
        message: "OTP record not found",
      });
    }

    // Check expiry

    if (otpRecord.expires_at < new Date()) {
      return res.status(400).json({
        message: "OTP expired",
      });
    }

    // Check attempts

    if (otpRecord.attempts >= 5) {
      return res.status(429).json({
        message: "Maximum attempts reached",
      });
    }

    // Verify OTP

    const isMatch = await bcrypt.compare(
      otp,

      otpRecord.otp,
    );

    if (!isMatch) {
      otpRecord.attempts += 1;

      await otpRecord.save();

      return res.status(400).json({
        message: "Invalid OTP",
      });
    }

    // OTP verified

    otpRecord.is_verified = true;

    await otpRecord.save();

    return res.status(200).json({
      message: "OTP verified successfully",
    });
  } catch (error) {
    console.error("Verify Forgot Password OTP Error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
