import mongoose from "mongoose";

const serviceTypeSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BusinessUser",
      required: true,
    },
    ServiceTypeId: {
      type: String,
      required: true,
      trim: true,
        }, 
    
    serviceTypeName: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      //   required: true,
      trim: true,
    },

    defaultInterval: {
      type: Number,
      //   required: true,
    },

    intervalType: {
      type: String,
      //   required: true,
    },

    estimatedCost: {
      type: Number,
      default: 0,
    },

    duration: {
      type: Number,
      //   required: true,
    },

    description: {
      type: String,
      trim: true,
    },

    status: {
      type: String,
      //   enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  {
    timestamps: true,
  },
);

export const ServiceType = mongoose.model("ServiceType", serviceTypeSchema);
