import mongoose from "mongoose";

const DriverForgetPasswordSchema = new mongoose.Schema(
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

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    otp: {
      type: String,
      required: true,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    isUsed: {
      type: Boolean,
      default: false,
    },

    attempts: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

// OTP expire होने पर MongoDB से automatically delete
DriverForgetPasswordSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// एक driver + organization का एक active OTP record
DriverForgetPasswordSchema.index(
  {
    driver_id: 1,
    organizationId: 1,
  },
  {
    unique: true,
  },
);

export default mongoose.model(
  "DriverForgetPassword",
  DriverForgetPasswordSchema,
);
