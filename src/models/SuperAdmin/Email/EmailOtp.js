import mongoose from "mongoose";

const tempEmailOtpSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    orgid: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    recipient_email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    new_email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    otp: {
      type: String,
      required: true,
    },
    otp_plain: {
      type: String,
      required: true,
    },
    is_verified: {
      type: Boolean,
      default: false,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    expires_at: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  },
);

tempEmailOtpSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

tempEmailOtpSchema.index({ user_id: 1, orgid: 1 }, { unique: true });

export default mongoose.model("TempEmailOtp", tempEmailOtpSchema);
