import mongoose from "mongoose";

const trainingAssignedSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BusinessUser",
      required: true,
    },

    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      required: true,
      index: true,
    },

    trainingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Training",
      required: true,
    },
    trainingAssigneCode: {
      type: String,
      trim: true,
      //   unique: true,
    },

    // Training Due Date
    trainingDueDate: { type: Date },

    // Enter Conducted Status
    conductedStatus: { type: String, trim: true },

    // Enter Training Result
    trainingResult: { type: String, trim: true },

    // Signature Image (file upload)
    signatureImage: { type: String, trim: true, default: null },

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

trainingAssignedSchema.index(
  { organizationId: 1, memberId: 1, trainingId: 1 },
  { sparse: true },
);

export const TrainingAssigned = mongoose.model(
  "TrainingAssigned",
  trainingAssignedSchema,
);
