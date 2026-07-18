import mongoose from "mongoose";

const workOrderSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BusinessUser",
      required: true,
    },
    workOrderCode: {
      type: String,
      required: true,
      trim: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      //   required: true,
    },

    // Work Order Details
    customerName: {
      type: String,
      required: true,
      trim: true,
    },

    projectContractId: {
      type: String,
      // required: true,
      trim: true,
    },

    jobType: {
      type: String,
      // required: true,
      trim: true,
    },

    startDate: {
      type: Date,
      // required: true,
    },

    endDate: {
      type: Date,
      // required: true,
    },

    workStatus: {
      type: String,
      default: "Pending",
    },

    documents: [
      {
        fileName: String,
        fileUrl: String,
      },
    ],

    // Billing & Payments
    billing: {
      billingType: {
        type: String,
        required: true,
      },

      rate: {
        type: Number,
        required: true,
      },

      totalEstimatedCost: {
        type: Number,
        default: 0,
      },

      paymentStatus: {
        type: String,
        // enum: ["Pending", "Partial", "Paid"],
        default: "Pending",
      },

      advanceReceived: {
        type: Number,
        default: 0,
      },

      paymentDueDate: {
        type: Date,
      },

      invoiceNumber: {
        type: String,
        trim: true,
      },
    },

    // Worksite, Materials & Documents
    worksite: {
      startLocation: {
        type: String,
        required: true,
        trim: true,
      },

      endLocation: {
        type: String,
        required: true,
        trim: true,
      },

      distanceKm: {
        type: Number,
        default: 0,
      },

      materials: [
        {
          type: String,
          trim: true,
        },
      ],

      pod: [
        {
          fileName: String,
          fileUrl: String,
        },
      ],
    },

    // Record Status
    status: {
      type: String,
      default: "Active",
    },

    description: {
      type: String,
      trim: true,
    },

    verifyStatus: {
      type: String,
      default: "Pending",
    },

    verifiedAt: {
      type: Date,
    },

    rejectionReason: {
      type: String,
      trim: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

export const WorkOrder = mongoose.model("WorkOrder", workOrderSchema);
