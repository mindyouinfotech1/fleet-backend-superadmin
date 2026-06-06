import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    organizationId: {
      type: String,
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    name: {
      type: String,
      required: true,
    },
    adminEmail: {
      type: String,
    },
    userEmail: {
      type: String,
    },
    phone: {
      type: String,
    },
    password: {
      type: String,
      required: true,
    },
    planpassword: {
      type: String,
      required: true,
    },
    organization: {
      type: String,
    },
    role: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDelete: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

export const User = mongoose.model("User", userSchema);
