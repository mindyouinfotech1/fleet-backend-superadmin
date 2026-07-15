import mongoose from "mongoose";

const workshopSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BusinessUser",
      required: true,
      index: true,
    },
    workshopCode: {
      type: String,
      required: true,
      trim: true,
    },

    workshopName: {
      type: String,
      required: true,
      trim: true,
    },
    workshopOwner: {
      type: String,
      trim: true,
    },
    workshopEmail: {
      type: String,
      trim: true,
    },
    workshopPhone: {
      type: String,
      trim: true,
    },

    country: {
      type: Number,
      ref: "Country",
      required: true,
      index: true,
    },

    state: {
      type: Number,
      ref: "State",
      required: true,
      index: true,
    },

    city: {
      type: Number,
      ref: "City",
      required: true,
      index: true,
    },

    address: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Workshop", workshopSchema);
