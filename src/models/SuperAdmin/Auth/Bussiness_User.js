import mongoose from "mongoose";

const BusinessUserSchema = new mongoose.Schema(
  {
    organizationName: {
      type: String,
      required: true,
      trim: true,
    },
    organizationCode: {
      type: String,
      unique: true,
      required: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    countryId: {
      type: Number,
      // required: true,
    },

    country: {
      type: String,
      required: true,
    },
    countryCode: {
      type: String,
      required: true,
    },
    currency: {
      type: String,
      required: true,
    },
    currencySymbol: {
      type: String,
    },
    flag: {
      type: String,
    },
    timezone: {
      type: String,
    },
    phone: {
      type: String,
    },
    address: {
      type: String,
    },
    logo: {
      type: String,
    },
    adminUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    subscriptionPlan: {
      type: String,
      enum: ["free", "basic", "premium", "enterprise"],
      default: "free",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDelete: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },
  },
  {
    timestamps: true,
  },
);

export const User = mongoose.model("BusinessUser", BusinessUserSchema);
