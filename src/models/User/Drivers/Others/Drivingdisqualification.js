import mongoose from "mongoose";

const drivingDisqualificationSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BusinessUser",
      required: true,
    },

    // Select Individual
    individualId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      required: true,
    },

    DriverDisqualificationCode: { type: String, trim: true },

    // Select License
    licenseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "License",
      required: true,
    },

    // Enter Reason
    reason: { type: String, trim: true, required: true },

    // Enter Disqualification Date
    disqualificationDate: { type: Date, required: true },

    // Enter Duration
    duration: { type: String, trim: true }, // e.g. "6 months", "1 year", "Permanent"

    // Enter Reinstatement Condition
    reinstatementCondition: { type: String, trim: true },

    status: {
      type: String,
      //   default: "pending",
    },

    policeReportId: { type: String, trim: true },

    recordCountry: { type: String, trim: true },
    recordState: { type: String, trim: true },

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

drivingDisqualificationSchema.index(
  { organizationId: 1, policeReportId: 1 },
  { sparse: true },
);

export const DrivingDisqualification = mongoose.model(
  "DrivingDisqualification",
  drivingDisqualificationSchema,
);
