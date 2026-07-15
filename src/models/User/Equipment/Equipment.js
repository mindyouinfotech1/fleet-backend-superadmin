import mongoose from "mongoose";

const equipmentSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BusinessUser",
      required: true,
      index: true,
    },

    equipmentCode: {
      type: String,
      // required: true,
      trim: true,
    },

    /* ===========================================================
       1) EQUIPMENT INFO
    =========================================================== */
    equipmentType: { type: String, required: true, trim: true },
    equipmentName: { type: String, trim: true, required: true },
    equipmentIdNo: { type: String, trim: true },
    modelName: { type: String, trim: true },
    vinOrChassisNumber: { type: String, trim: true, uppercase: true },

    registrationNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      //   unique: true,
    },
    registrationState: { type: String, trim: true },
    engineNumber: { type: String, trim: true, uppercase: true },
    manufacturerName: { type: String, trim: true },
    manufactureYear: { type: Number },
    fuelType: {
      type: String,
      //   enum: ["Petrol", "Diesel", "CNG", "Electric", "Hybrid", "Other"],
    },
    equipmentStatus: {
      type: String,
      //   enum: ["Active", "Inactive", "Under Maintenance", "Sold"],
      default: "Active",
    },
    loadCapacity: { type: Number },
    capacityUnit: {
      type: String,
      // enum: ["Kg", "Ton", "Litre"], default: "Kg"
    },
    noOfAxles: { type: Number },
    bodyType: { type: String, trim: true },
    color: { type: String, trim: true },

    /* ===========================================================
       2) LICENSING & COMPLIANCE
    =========================================================== */
    compliance: {
      registrationExpiryDate: { type: Date },
      roadworthinessInspectionDate: { type: Date }, // Annual inspection
      permitExpiryDate: { type: Date },
      heavyVehicleCategory: { type: String, trim: true },
      grossVehicleMass: { type: Number }, // GVM
      tareWeight: { type: Number },
      permitType: { type: String, trim: true },
    },

    /* ===========================================================
       3) MAINTENANCE & SAFETY
    =========================================================== */
    maintenance: {
      lastMaintenanceDate: { type: Date },
      nextMaintenanceDueDate: { type: Date },
      maintenanceProvider: { type: String, trim: true },
      maintenanceReference: { type: String, trim: true },
      brakeTestDate: { type: Date },
      tyreInspectionDate: { type: Date },
      fireExtinguisherCheckDate: { type: Date },
      safetyEquipmentList: [{ type: String, trim: true }],
      odometerReadingAtEntry: { type: Number },
    },

    /* ===========================================================
       4) OWNERSHIP
    =========================================================== */
    ownership: {
      ownerCompany: { type: String, trim: true },
      assignedOperatorOrDepot: { type: String, trim: true },
      primaryDriver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Driver",
        default: null,
      },
      ownershipType: {
        type: String,
        enum: ["Owned", "Leased"],
        default: "Owned",
      },
      leaseStartDate: { type: Date },
      leaseEndDate: { type: Date },
      insurancePolicyNo: { type: String, trim: true },
      insuranceExpiryDate: { type: Date },
    },

    /* ===========================================================
       5) DOCUMENTS (Multiple file uploads - dynamic array)
    =========================================================== */
    documents: [
      {
        documentType: {
          type: String, // e.g. RC, Insurance, Permit, Fitness, Pollution, Lease Agreement
          trim: true,
          required: true,
        },
        documentName: { type: String, trim: true },
        documentFile: { type: String, required: true }, // URL / path
        documentNumber: { type: String, trim: true },
        issueDate: { type: Date },
        expiryDate: { type: Date },
        uploadedAt: { type: Date, default: Date.now },
        uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      },
    ],

    remarks: { type: String, trim: true },

    /* ===========================================================
        COMMON WORKFLOW FIELDS
    =========================================================== */
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
      // keys: documentsUploaded, registrationValid, insuranceValid,
      // permitValid, roadworthinessValid, maintenanceDue, isExpired
    },

    isEligible: { type: Boolean, default: false },
    isExpired: { type: Boolean, default: false },

    history: [
      {
        status: String,
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        reason: String,
        changedAt: { type: Date, default: Date.now },
      },
    ],

    //  Soft Delete
    isDeleted: { type: Boolean, default: false, index: true },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

equipmentSchema.index({ organizationId: 1 });
equipmentSchema.index({ equipmentStatus: 1 });
equipmentSchema.index({ registrationNumber: 1 });
equipmentSchema.index({ "ownership.primaryDriver": 1 });

export const Equipment = mongoose.model("Equipment", equipmentSchema);
