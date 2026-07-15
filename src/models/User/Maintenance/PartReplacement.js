import mongoose from "mongoose";

const PartReplacementSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BusinessUser",
      required: true,
    },
    partReplacementCode: {
      type: String,
      required: true,
      trim: true,
    },

    equipmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Equipment",
      required: true,
    },

    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      required: true,
    },

    workshopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workshop",
      required: true,
    },

    partName: {
      type: String,
      required: true,
      trim: true,
    },

    maintenanceDate: {
      type: Date,
      required: true,
    },

    costOfPart: {
      type: Number,
      required: true,
      min: 0,
    },

    partSerialRefNo: {
      type: String,
      // required: true,
      trim: true,
    },

    quantity: {
      type: Number,
      // required: true,
      min: 1,
    },

    partCategory: {
      type: String,
      // required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: ["Pending", "In Progress", "Completed", "Cancelled"],
      default: "Pending",
      // required: true,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("PartReplacement", PartReplacementSchema);
