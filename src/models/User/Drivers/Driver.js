import mongoose from "mongoose";

const driverSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BusinessUser",
      required: true,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      // required: true,
    },
    organizationCode: {
      type: String,
      required: true,
      trim: true,
    },
    DriverCodeByOrganization: {
      type: String,
      required: true,
      trim: true,
    },

    DriverRelationShip: {
      type: String,
      required: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },
    showPassword: { type: String },

    firstName: { type: String, required: true, trim: true },
    middleName: { type: String, trim: true },
    lastName: { type: String, required: true, trim: true },
    dateOfBirth: { type: Date },
    email: { type: String, required: true, trim: true },
    phoneNumber: { type: String, required: true, trim: true },
    emergencyContactNumber: { type: String, trim: true },
    nationalIdOrAadharNumber: { type: String, trim: true },
    dateOfJoining: { type: Date },
    employmentType: { type: String },
    driverStatus: { type: String, default: "Active" },
    bloodGroup: { type: String, trim: true },
    profilePhoto: { type: String },
    gender: { type: String, enum: ["Male", "Female", "Other"] },
    countryId: { type: Number, default: null },
    stateId: { type: Number, default: null },
    cityId: { type: Number, default: null },
    address: { type: String, trim: true },
    pinCode: { type: String, trim: true },

    // Common workflow block
    status: {
      type: String,
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

// aur schema ke end me (mongoose.model se pehle) ye compound index add karo:
driverSchema.index({ organizationId: 1, email: 1 }, { unique: true });

export const Driver = mongoose.model("Driver", driverSchema);
