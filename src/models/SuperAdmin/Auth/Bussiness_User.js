import mongoose from "mongoose";

const BusinessUserSchema = new mongoose.Schema(
  {
    organizationId: {
      type: String,
      unique: true,
      required: true,
    },
    organizationName: {
      type: String,
      required: true,
    },
    Email: {
      type: String,
    },
    password: {
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

export const User = mongoose.model("BusinessUser", BusinessUserSchema);
