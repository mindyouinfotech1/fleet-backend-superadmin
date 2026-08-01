import mongoose from "mongoose";

const drivingAccidentSchema = new mongoose.Schema(
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

    DriverAccidentCode: { type: String, trim: true },

    // Select License
    licenseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "License",
      required: true,
    },

    // Enter Accident Date
    accidentDate: { type: Date, required: true },

    // Enter Accident Time
    accidentTime: { type: String, trim: true }, // e.g. "14:30"

    // Enter Outcome
    outcome: { type: String, trim: true },

    // Enter Fault
    fault: { type: String, trim: true },

    status: {
      type: String,
      //   default: "pending",
    },

    // Enter Police Report Number
    policeReportId: { type: String, trim: true },

    recordCountry: { type: String, trim: true },
    recordState: { type: String, trim: true },
    recordCity: { type: String, trim: true },
    recordAddress: { type: String, trim: true },

    // Enter Description
    accidentDescription: { type: String, trim: true },

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

drivingAccidentSchema.index(
  { organizationId: 1, policeReportId: 1 },
  { sparse: true },
);

export const DrivingAccident = mongoose.model(
  "DrivingAccident",
  drivingAccidentSchema,
);
