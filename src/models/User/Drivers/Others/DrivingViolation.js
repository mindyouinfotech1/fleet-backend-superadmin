import mongoose from "mongoose";

const drivingViolationSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BusinessUser",
      required: true,
    },
    individualId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      required: true,
    },
    DriverViolationCode: { type: String, trim: true },

    // Select License
    licenseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "License",
      required: true,
    },

    violationDate: { type: Date, required: true },
    violationTime: { type: String, trim: true }, // e.g. "14:30"

    points: { type: Number, default: 0 },

    rateCurrency: { type: String, trim: true },
    fine: { type: Number, default: 0 },

    status: {
      type: String,
      //   default: "pending",
    },

    flagSuspension: { type: Boolean, default: false },

    courtInformation: { type: String, trim: true },
    policeReportId: { type: String, trim: true },

    recordCountry: { type: String, trim: true },
    recordState: { type: String, trim: true },
    recordCity: { type: String, trim: true },
    recordAddress: { type: String, trim: true },

    violationDescription: { type: String, trim: true },

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


drivingViolationSchema.index(
  { organizationId: 1, policeReportId: 1 },
  { sparse: true },
);

export const DrivingViolation = mongoose.model(
  "DrivingViolation",
  drivingViolationSchema,
);
