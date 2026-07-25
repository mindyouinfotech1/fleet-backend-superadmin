import nodemailer from "nodemailer";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

import DriverEmailOtp from "../../../../models/SuperAdmin/Email/Driver/EmailOtp.js";
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

// ================= SEND DRIVER EMAIL OTP =================

export const sendDriverEmailOtp = async (req, res) => {
  try {
    const { driver_id, organizationId, recipient_email, new_email } = req.body;

    if (!driver_id || !organizationId || !recipient_email || !new_email) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    // Check Driver exists

    const driver = await Driver.findOne({
      _id: driver_id,
      organizationId,
    });

    if (!driver) {
      return res.status(404).json({
        message: "Driver not found",
      });
    }

    // Check new email already exists
    const emailExists = await Driver.findOne({
      organizationId,

      email: new_email,

      _id: {
        $ne: driver_id,
      },
    });

    if (emailExists) {
      return res.status(400).json({
        message: "This email already exists in this organization",
      });
    }

    // Existing OTP check

    const existing = await DriverEmailOtp.findOne({
      driver_id,

      organizationId,
    });

    let otp;

    if (!existing || existing.expires_at < new Date()) {
      otp = generateOtp();
    } else {
      otp = existing.otp_plain;
    }

    const hashedOtp = await bcrypt.hash(otp, 10);

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    const otpData = await DriverEmailOtp.findOneAndUpdate(
      {
        driver_id,
        organizationId,
      },

      {
        driver_id,

        organizationId,

        recipient_email,

        new_email,

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

    console.log(`Driver Email OTP ${recipient_email}: ${otp}`);

    // Send email

    /*
    await transporter.sendMail({

      from:
      `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM_ADDRESS}>`,

      to:recipient_email,

      subject:"Driver Email Verification OTP",

      html:`

      <h3>Email Verification</h3>

      <p>Your OTP is:</p>

      <h2>${otp}</h2>

      <p>This OTP expires in 5 minutes.</p>

      `

    });
    */

    return res.status(200).json({
      message: "Driver email OTP generated successfully",

      data: otpData,
    });
  } catch (error) {
    console.error("Send Driver OTP Error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// ================= VERIFY AND UPDATE DRIVER EMAIL =================

export const verifyAndUpdateDriverEmail = async (req, res) => {
  try {
    const {
      driver_id,

      organizationId,

      recipient_email,

      new_email,

      otp,
    } = req.body;

    if (
      !driver_id ||
      !organizationId ||
      !recipient_email ||
      !new_email ||
      !otp
    ) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const otpRecord = await DriverEmailOtp.findOne({
      driver_id,

      organizationId,

      recipient_email,
    });

    if (!otpRecord) {
      return res.status(404).json({
        message: "OTP record not found",
      });
    }

    if (otpRecord.is_verified) {
      return res.status(400).json({
        message: "OTP already verified",
      });
    }

    if (otpRecord.expires_at < new Date()) {
      return res.status(400).json({
        message: "OTP expired",
      });
    }

    if (otpRecord.attempts >= 5) {
      return res.status(429).json({
        message: "Maximum attempts reached",
      });
    }

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

    // Update Driver Email

    const driver = await Driver.findOne({
      _id: driver_id,

      organizationId,
    });

    if (!driver) {
      return res.status(404).json({
        message: "Driver not found",
      });
    }

    // final email duplicate check

    const emailExists = await Driver.findOne({
      organizationId,

      email: new_email,

      _id: {
        $ne: driver_id,
      },
    });

    if (emailExists) {
      return res.status(400).json({
        message: "Email already used by another driver",
      });
    }

    driver.email = new_email;

    await driver.save();

    // Remove OTP

    await DriverEmailOtp.deleteOne({
      _id: otpRecord._id,
    });

    return res.status(200).json({
      message: "OTP verified successfully, driver email updated",
    });
  } catch (error) {
    console.error("Verify Driver Email Error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
