import mongoose from "mongoose";

const BranchSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BusinessUser",
      required: true,
    },

    branchName: {
      type: String,
      required: true,
      trim: true,
    },

    branchCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    country: {
      type: String,
      required: true,
    },

    state: {
      type: String,
      required: true,
    },

    city: {
      type: String,
      required: true,
    },

    zipCode: {
      type: String,
    },

    address: {
      type: String,
      required: true,
    },

    timezone: {
      type: String,
    },

    currency: {
      type: String,
    },

    currencySymbol: {
      type: String,
    },

    logo: {
      type: String,
    },

    isHeadOffice: {
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
      default: "active",
    },
  },
  {
    timestamps: true,
  },
);

// Same organization me branchCode unique rahe
BranchSchema.index({ organizationId: 1, branchCode: 1 }, { unique: true });

export const Branch = mongoose.model("Branch", BranchSchema);
