import mongoose from "mongoose";

const medicalCertificateSchema = new mongoose.Schema(
  {
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      required: true,
      index: true,
    },

    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BusinessUser",
    },

    organizationCode: {
      type: String,
    },

    DriverCodeByOrganization: {
      type: String,
    },

    DriverRelationShip: {
      type: String,
    },

    DriverMedicalCertificateCode: {
      type: String,
      // unique: true,
    },

    certificateNumber: {
      type: String,
      required: true,
      trim: true,
    },

    countryCode: {
      type: String,
      trim: true,
      uppercase: true,
    },

    issuingAuthority: {
      type: String,
      trim: true,
    },

    doctorName: {
      type: String,
      trim: true,
    },

    hospitalOrClinic: {
      type: String,
      trim: true,
    },

    issueDate: {
      type: Date,
      required: true,
    },

    expiryDate: {
      type: Date,
      required: true,
    },

    certificateUpload: [
      {
        certificatename: {
          type: String,
        },
        certificatefile: {
          type: String,
        },
      },
    ],

    fitnessStatus: {
      type: String,
    },

    restrictions: [
      {
        type: String,
        trim: true,
      },
    ],

    remarks: {
      type: String,
      trim: true,
    },

    // ===== Workflow Block =====
    status: {
      type: String,
      // enum: [
      //   "pending",
      //   "in_progress",
      //   "approved",
      //   "rejected",
      //   "completed",
      //   "cancelled",
      // ],
      default: "pending",
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      // ref: "Admin",
      default: null,
    },

    verifiedAt: {
      type: Date,
      default: null,
    },

    rejectionReason: {
      type: String,
      default: null,
    },

    flags: {
      type: Map,
      of: Boolean,
      default: {},
    },

    isEligible: {
      type: Boolean,
      default: false,
    },

    history: [
      {
        status: String,
        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Admin",
        },
        reason: String,
        changedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // ===== Soft Delete =====
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },

    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
medicalCertificateSchema.index({ driverId: 1 });
medicalCertificateSchema.index({ countryCode: 1 });
medicalCertificateSchema.index({ fitnessStatus: 1 });
medicalCertificateSchema.index({ status: 1 });
medicalCertificateSchema.index({ isDeleted: 1 });

export const MedicalCertificate = mongoose.model(
  "MedicalCertificate",
  medicalCertificateSchema,
);
