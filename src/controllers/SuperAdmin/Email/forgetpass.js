import TempEmailOtp from "../../../models/SuperAdmin/Email/EmailOtp.js";
import { User } from "../../../models/SuperAdmin/Orgainization/User.js";
import nodemailer from "nodemailer";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: parseInt(process.env.MAIL_PORT) || 465,
  secure: true, // SSL required for port 465 (Gmail)
  auth: {
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD,
  },
});

// OTP generator
const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

export const sendForgotPasswordOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    //        Check user exist or not
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "Email is not registered" });
    }

    //        Generate OTP
    const otp = generateOtp();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    //        Save in DB (forgetpass collection)
    await ForgetPass.findOneAndUpdate(
      { email },
      {
        email,
        otp: hashedOtp,
        expiresAt,
        isUsed: false,
      },
      { upsert: true, new: true },
    );

    console.log(`Forgot Password OTP for ${email}: ${otp}`);

    //        Send Email
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
      message: "OTP successfully sent",
    });
  } catch (error) {
    console.error("Forgot Password OTP Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const verifyForgotPasswordOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    //        Find record
    const record = await ForgetPass.findOne({ email });

    if (!record) {
      return res.status(404).json({ message: "OTP record not found" });
    }

    //        Check expiry
    if (record.expiresAt < new Date()) {
      return res.status(400).json({ message: "OTP has expired" });
    }

    //        Check already used
    if (record.isUsed) {
      return res.status(400).json({ message: "OTP has already been used" });
    }

    //        Compare OTP (hashed vs plain)
    const isMatch = await bcrypt.compare(otp, record.otp);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    //        Mark as used
    record.isUsed = true;
    await record.save();

    return res.status(200).json({
      message: "OTP verified successfully",
    });
  } catch (error) {
    console.error("OTP Verify Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
