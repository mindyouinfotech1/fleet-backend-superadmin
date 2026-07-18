import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BusinessUser",
      required: true,
      index: true,
    },

    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
      required: true,
      index: true,
    },

    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      required: true,
      index: true,
    },

    expenseType: {
      type: String,
      required: true,
      trim: true,
      // Example: Fuel, Food, Toll, Maintenance, Other
    },

    expenseName: {
      type: String,
      required: true,
      trim: true,
    },

    date: {
      type: Date,
      required: true,
      default: Date.now,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },
    receipt: {
      type: String,
      trim: true,
    },

    // Future extra fields ke liye
    additionalDetails: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
      // Example:
      // {
      //   receiptNo: "EXP123",
      //   paymentMode: "Cash",
      //   vendorName: "ABC Petrol Pump"
      // }
    },

    status: {
      type: String,
      //   enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
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

export const Expense = mongoose.model("TripExpense", expenseSchema);
