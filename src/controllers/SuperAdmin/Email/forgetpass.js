import nodemailer from "nodemailer";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import ForgetPassword from "../../../models/SuperAdmin/Email/forgetpass.js";
import { User } from "../../../models/SuperAdmin/Orgainization/User.js";

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

    // Generate OTP
    const otp = generateOtp();

    const hashedOtp = await bcrypt.hash(otp, 10);

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Save OTP in ForgetPassword collection
    const otpData = await ForgetPassword.findOneAndUpdate(
      {
        email,
      },
      {
        email,
        otp: hashedOtp,
        expiresAt,
        isUsed: false,
      },
      {
        new: true,
        upsert: true,
      },
    );

    console.log(`Forgot Password OTP for ${email}: ${otp}`);

    // // Send OTP Email
    // await transporter.sendMail({
    //   from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM_ADDRESS}>`,

    //   to: email,

    //   subject: "Password Reset OTP",

    //   html: `
    //     <h3>Password Reset</h3>

    //     <p>Your OTP is:</p>

    //     <h2>${otp}</h2>

    //     <p>This OTP will expire in 5 minutes.</p>
    //   `,
    // });

    return res.status(200).json({
      message: "Password reset OTP sent successfully",
      data: otpData,
      otp: otp,
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
    const otpRecord = await ForgetPassword.findOne({
      email,
    });

    console.log("otpRecord", otpRecord);

    if (!otpRecord) {
      return res.status(404).json({
        message: "OTP record not found",
      });
    }

    // Check expiry

    if (otpRecord.expiresAt < new Date()) {
      return res.status(400).json({
        message: "OTP expired",
      });
    }

    // Check already used

    if (otpRecord.isUsed) {
      return res.status(400).json({
        message: "OTP already used",
      });
    }

    // Compare OTP

    const isMatch = await bcrypt.compare(otp, otpRecord.otp);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid OTP",
      });
    }

    // OTP verified

    otpRecord.isUsed = true;

    await otpRecord.save();

    console.log("OTP verified successfully");

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

// ================= RESET PASSWORD =================

export const resetPassword = async (req, res) => {
  try {
    const { email, new_password, confirm_password } = req.body;

    if (!email || !new_password || !confirm_password) {
      return res.status(400).json({
        message: "Email, new password and confirm password are required",
      });
    }

    // Check password match

    if (new_password !== confirm_password) {
      return res.status(400).json({
        message: "Password and confirm password do not match",
      });
    }

    // Check OTP verification

    const otpRecord = await ForgetPassword.findOne({
      email,
    });

    if (!otpRecord) {
      return res.status(404).json({
        message: "OTP verification record not found",
      });
    }

    if (!otpRecord.isUsed) {
      return res.status(400).json({
        message: "Please verify OTP first",
      });
    }

    // Find user

    const user = await User.findOne({
      email,
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Hash new password

    const hashedPassword = await bcrypt.hash(new_password, 10);

    // Update password

    user.password = hashedPassword;

    await user.save();

    // Remove OTP record after password reset

    await ForgetPassword.deleteOne({
      email,
    });

    return res.status(200).json({
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Reset Password Error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
