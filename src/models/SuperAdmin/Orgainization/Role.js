import mongoose from "mongoose";

const RoleSchema = new mongoose.Schema(
  {
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BusinessUser",
      required: true,
        },
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    roleName: {
      type: String,
      required: true,
      trim: true,
    },
    permissions: {
      type: [String], 
      default: [],
    },
    isSystemRole: {
      type: Boolean,
      default: false, 
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
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: true,
  },
);

export const Role = mongoose.model("Role", RoleSchema);
