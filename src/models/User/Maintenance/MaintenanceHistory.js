import mongoose from "mongoose";

const maintenanceHistorySchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BusinessUser",
      required: true,
    },
    maintenanceCode: {
      type: String,
      required: true,
      trim: true,
    },

    equipment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Equipment",
      required: true,
    },

    maintenanceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Maintenance",
      default: null,
    },

    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      required: true,
    },

    workshopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workshop",
      default: null,
    },
    serviceNameId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceType",
      //   required: true,
    },

    otherServiceName: {
      type: String,
      default: null,
    },

    service_type: {
      type: String,
      required: true,
    },

    last_service_date: {
      type: Date,
      required: true,
    },

    current_service_date: {
      type: Date,
      required: true,
    },

    // Odometer-based
    service_km: {
      type: Number,
      default: null,
    },

    service_interval_km: {
      type: Number,
      default: null,
    },

    // Hour-meter based
    service_hours: {
      type: Number,
      default: null,
    },

    service_interval_hours: {
      type: Number,
      default: null,
    },

    current_km: {
      type: Number,
      default: null,
    },

    current_hours: {
      type: Number,
      default: null,
    },

    mechanic_or_shop_name: {
      type: String,
      //   required: true,
    },

    service_cost: {
      type: Number,
      required: true,
    },

    invoice_file: {
      type: String,
      default: null,
    },

    service_description: {
      type: String,
      //   required: true,
    },

    status: {
      type: String,
      //   enum: ["pending", "approved", "rejected", "completed"],
      default: "pending",
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    verifiedAt: {
      type: Date,
      default: null,
    },

    rejectionReason: {
      type: String,
      default: null,
    },

    history: [
      {
        status: String,
        reason: String,
        changedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    isDeleted: {
      type: Boolean,
      default: false,
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

export const MaintenanceHistory = mongoose.model(
  "MaintenanceHistory",
  maintenanceHistorySchema,
);
