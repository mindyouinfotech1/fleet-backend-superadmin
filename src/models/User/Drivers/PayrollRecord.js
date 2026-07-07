import mongoose from "mongoose";

const payrollRecordSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BusinessUser",
      required: true,
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      required: true,
      index: true,
    },

    wagesType: {
      type: String,
      required: true,
      enum: [
        "Hourly",
        "Daily",
        "Weekly",
        "BiWeekly",
        "Monthly",
        "TripBased",
        "Commission",
        "Custom",
      ],
      trim: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    // ISO Currency Code
    // INR, USD, EUR, GBP, AED...
    currencyCode: {
      type: String,
      //   required: true,
      uppercase: true,
      trim: true,
    },

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },

    // Optional
    effectiveFrom: {
      type: Date,
      default: Date.now,
    },

    // Optional
    effectiveTo: {
      type: Date,
    },

    // Optional
    remarks: {
      type: String,
      trim: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

payrollRecordSchema.index({ driverId: 1 });
payrollRecordSchema.index({ status: 1 });
payrollRecordSchema.index({ wagesType: 1 });

export const PayrollRecord = mongoose.model(
  "PayrollRecord",
  payrollRecordSchema,
);
