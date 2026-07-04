import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BusinessUser",
      required: true,
    },
    roleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      //   required: true,
      default: null,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      //   unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    ProfilePhoto: {
      type: String,
      default: null,
    },
    address: {
      type: String,
    },
    country: {
      type: String,
      trim: true,
      default: null,
    },
    state: {
      type: String,
      trim: true,
      default: null,
    },
    city: {
      type: String,
      default: null,
    },
    pincode: {
      type: String,
      default: null,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other", null],
      default: null,
    },
    dateOfBirth: {
      type: Date,
      default: null,
    },
    phone: {
      type: String,
    },

    isOrgAdmin: {
      type: Boolean,
      default: false, // sirf ek user ke liye true (main admin)
    },
    lastLogin: {
      type: Date,
      default: null,
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
      enum: ["active", "inactive", "blocked"],
      default: "active",
    },
  },
  {
    timestamps: true,
  },
);

export const User = mongoose.model("Fleet_User", UserSchema);
