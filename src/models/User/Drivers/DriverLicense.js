import mongoose from "mongoose";

const driverLicenseSchema = new mongoose.Schema(
  {
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      required: true,
      index: true,
    },

    licenseNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    countryCode: { type: String, trim: true, uppercase: true },
    licenseType: { type: String, trim: true },
    licenseClass: [{ type: String, trim: true }],
    endorsements: [{ type: String, trim: true }],
    restrictions: [{ type: String, trim: true }],
    issueDate: { type: Date },
    expiryDate: { type: Date },
    issuingAuthority: { type: String, trim: true },

    status: {
      type: String,
      enum: ["Active", "Expired", "Suspended", "Revoked"],
      default: "Active",
    },

    licenseFront: { type: String },
    licenseBack: { type: String },

    verified: { type: Boolean, default: false },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
    verifiedAt: { type: Date },

    remarks: { type: String, trim: true },

    //  Common Workflow Fields (naya add hua)
    rejectionReason: { type: String, default: null },

    flags: {
      type: Map,
      of: Boolean,
      default: {},
    },

    isEligible: { type: Boolean, default: false },
    isExpired: { type: Boolean, default: false },

    history: [
      {
        status: String,
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
        reason: String,
        changedAt: { type: Date, default: Date.now },
      },
    ],

    // Soft delete
    isDeleted: { type: Boolean, default: false, index: true },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

driverLicenseSchema.index({ driverId: 1 });
driverLicenseSchema.index({ countryCode: 1 });
driverLicenseSchema.index({ status: 1 });

export const DriverLicense = mongoose.model(
  "DriverLicense",
  driverLicenseSchema,
);
