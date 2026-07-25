import nodemailer from "nodemailer";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import TempEmailOtp from "../../../models/SuperAdmin/Email/EmailOtp.js";
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

// Generate 6-digit OTP
const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

export const sendEmailOtp = async (req, res) => {
  try {
    const { user_id, orgid, recipient_email, new_email } = req.body;

    if (!user_id || !orgid || !recipient_email || !new_email) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const now = new Date();
    let existing = await TempEmailOtp.findOne({ user_id, orgid });
    let otp;

    if (!existing || existing.expires_at < now) {
      otp = generateOtp();
    } else {
      otp = existing.otp_plain;
    }

    const hashedOtp = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min

    // Database update with both emails
    const otpData = await TempEmailOtp.findOneAndUpdate(
      { user_id, orgid },
      {
        recipient_email,
        new_email,
        otp: hashedOtp,
        otp_plain: otp,
        is_verified: false,
        attempts: 0,
        expires_at: expiresAt,
      },
      { new: true, upsert: true },
    );

    console.log(`Generated OTP for ${recipient_email}: ${otp}`);

    // OTP send to recipient_email
    // const info = await transporter.sendMail({
    //   from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM_ADDRESS}>`,
    //   to: recipient_email,
    //   subject: "Your OTP for Email Verification",
    //   html: `
    //     <h3>Email Verification</h3>
    //     <p>Your OTP is:</p>
    //     <h2>${otp}</h2>
    //     <p>This OTP will expire in 5 minutes.</p>
    //   `,
    // });

    // console.log("Email sent successfully:", info.messageId);

    return res.status(200).json({
      message: "OTP generated and email sent successfully",
      data: otpData,
    });
  } catch (error) {
    console.error("Error sending OTP:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const verifyAndUpdateEmail = async (req, res) => {
  try {
    const { user_id, orgid, recipient_email, new_email, otp } = req.body;

    if (!user_id || !orgid || !recipient_email || !new_email || !otp) {
      return res.status(400).json({ message: "सभी फील्ड्स जरूरी हैं" });
    }

    // OTP record find karo
    const otpRecord = await TempEmailOtp.findOne({
      user_id,
      orgid,
      recipient_email,
    });

    if (!otpRecord) {
      return res.status(404).json({ message: "OTP record is not found" });
    }

    if (otpRecord.is_verified) {
      return res.status(400).json({ message: "OTP पहले ही verify हो चुका है" });
    }

    const now = new Date();
    if (otpRecord.expires_at < now) {
      return res.status(400).json({ message: "OTP expire हो चुका है" });
    }

    if (otpRecord.attempts >= 5) {
      return res.status(429).json({ message: "Maximum attempts reached" });
    }

    const isMatch = await bcrypt.compare(otp, otpRecord.otp);
    if (!isMatch) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return res.status(400).json({ message: "OTP गलत है" });
    }

    // OTP correct → update user email
    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.email = new_email; // new_email se update
    await user.save();

    // OTP record delete kar do
    await TempEmailOtp.deleteOne({ _id: otpRecord._id });

    return res.status(200).json({
      message:
        "OTP verified successfully, email updated and OTP record removed",
    });
  } catch (error) {
    console.error("Error verifying OTP and updating email:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
