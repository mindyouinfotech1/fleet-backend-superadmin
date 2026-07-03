import mongoose from "mongoose";

const driverSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BusinessUser",
      required: true,
    },

    firstName: { type: String, required: true, trim: true },
    middleName: { type: String, trim: true },
    lastName: { type: String, required: true, trim: true },
    dateOfBirth: { type: Date },
    email: { type: String, required: true, trim: true, unique: true },
    phoneNumber: { type: String, required: true, trim: true },
    emergencyContactNumber: { type: String, trim: true },
    nationalIdOrAadharNumber: { type: String, trim: true },
    dateOfJoining: { type: Date },
    employmentType: { type: String },
    driverStatus: { type: String, default: "Active" },
    bloodGroup: { type: String, trim: true },
    profilePhoto: { type: String },
    gender: { type: String, enum: ["Male", "Female", "Other"] },
    countryId: { type: String, ref: "Country", default: null },
    stateId: { type: String, ref: "State", default: null },
    cityId: { type: String, ref: "City", default: null },
    address: { type: String, trim: true },
    pinCode: { type: String, trim: true },

    // Common workflow block
    status: {
      type: String,
      enum: [
        "pending",
        "in_progress",
        "approved",
        "rejected",
        "completed",
        "cancelled",
      ],
      default: "pending",
    },
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

    isEligible: { type: Boolean, default: false },

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

export const Driver = mongoose.model("Driver", driverSchema);
