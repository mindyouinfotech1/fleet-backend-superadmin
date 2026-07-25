import mongoose from "mongoose";

const driverEmailOtpSchema = new mongoose.Schema(
  {
    driver_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      required: true,
      index: true,
    },

    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BusinessUser",
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
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
);

// OTP expire होने पर document delete होगा
driverEmailOtpSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

driverEmailOtpSchema.index(
  {
    driver_id: 1,
    organizationId: 1,
  },
  {
    unique: true,
  },
);

export default mongoose.model("DriverEmailOtp", driverEmailOtpSchema);
