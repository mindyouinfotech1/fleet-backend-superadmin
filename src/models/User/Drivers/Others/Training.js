import mongoose from "mongoose";

const trainingSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BusinessUser",
      required: true,
    },

    trainingCategoryId: {
      type: String,
      required: true,
      trim: true,
    },

    // Enter Training Source Name
    trainingSourceName: { type: String, trim: true },

    // Enter Training Frequency in Months (required, marked with *)
    trainingFrequency: {
      type: Number,
      required: true,
      min: 1,
    },

    // Enter Training Link
    trainingLink: { type: String, trim: true },

    // Enter Training Description
    trainingDescription: { type: String, trim: true },

    status: {
      type: String,
      // default: "pending",
    },

    // Common workflow block
    isVerified: { type: Boolean, default: false },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    verifiedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: null },

    flags: {
      type: Map,
      of: Boolean,
      default: {},
    },

    history: [
      {
        status: String,
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        reason: String,
        changedAt: { type: Date, default: Date.now },
      },
    ],

    // Soft Delete
    isDeleted: { type: Boolean, default: false },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

trainingSchema.index(
  { organizationId: 1, trainingSourceName: 1 },
  { sparse: true },
);

export const Training = mongoose.model("Training", trainingSchema);
