import mongoose from "mongoose";

const maintenanceSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BusinessUser",
      required: true,
      //   index: true,
    },

    //  Equipment Reference
    equipment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Equipment",
      required: true,
    },

    //  Maintenance Type
    maintenance_type: {
      type: String,
      required: true,
    },

    start_km: {
      type: Number,
      default: null,
    },

    next_service_due_km: {
      type: Number,
      default: null,
    },

    remaining_km: {
      type: Number,
      default: null,
    },

    start_hours: {
      type: Number,
      default: null,
    },

    next_service_due_hours: {
      type: Number,
      default: null,
    },

    remaining_hours: {
      type: Number,
      default: null,
    },

    //  Reading at time of maintenance
    service_km: {
      type: Number,
      default: null,
    },

    service_hours: {
      type: Number,
      default: null,
    },

    //  Last service details
    last_service_date: {
      type: Date,
      required: true,
    },

    service_interval_km: {
      type: Number,
      default: null,
    },

    service_interval_hours: {
      type: Number,
      default: null,
    },

    current_km: {
      type: Number,
      default: 0,
    },

    current_hours: {
      type: Number,
      default: 0,
    },

    due_soon_threshold_km: {
      type: Number,
      default: 500,
    },

    due_soon_threshold_hours: {
      type: Number,
      default: 20,
    },

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

    isVerified: {
      type: Boolean,
      default: false,
    },

    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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
          ref: "User",
        },
        reason: String,
        changedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    //  Soft Delete
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

export const Maintenance = mongoose.model("Maintenance", maintenanceSchema);
