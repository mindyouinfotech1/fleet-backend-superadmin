import mongoose from "mongoose";

const tripSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BusinessUser",
      required: true,
    },
    workOrderIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "WorkOrder",
        required: true,
      },
    ],

    equipmentIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Equipment",
        required: true,
      },
    ],
    tripCode: {
      type: String,
      // required: true,
      trim: true,
    },
    tripName: {
      type: String,
      required: true,
      trim: true,
    },
    tripType: {
      type: String,
      //   required: true,
      //   enum: ["One Way", "Round Trip", "Return", "Multi Stop"],
    },

    primaryDriver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      required: true,
    },

    secondaryDriverIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Driver",
      },
    ],

    expectedStartDateTime: {
      type: Date,
      //   required: true,
    },

    expectedEndDateTime: {
      type: Date,
      //   required: true,
    },

    startLocation: {
      address: {
        type: String,
        // required: true,
      },
      latitude: {
        type: Number,
        // required: true,
      },
      longitude: {
        type: Number,
        // required: true,
      },
    },

    endLocation: {
      address: {
        type: String,
        // required: true,
      },
      latitude: {
        type: Number,
        // required: true,
      },
      longitude: {
        type: Number,
        // required: true,
      },
    },

    distance: {
      type: Number,
      default: 0,
    },

    speedLimit: {
      type: Number,
      default: 0,
    },

    remarks: {
      type: String,
      trim: true,
    },

    tripStatus: {
      type: String,
      default: "Pending",
    },
    // Soft Delete
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

export const Trip = mongoose.model("Trip", tripSchema);
