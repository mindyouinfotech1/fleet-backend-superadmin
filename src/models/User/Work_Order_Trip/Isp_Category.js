import mongoose from "mongoose";

const CategorySchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BusinessUser",
      required: true,
      index: true,
    },

    equipmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Equipment",
      default: null,
      index: true,
    },

    categoryName: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    status: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

CategorySchema.index(
  {
    organizationId: 1,
    equipmentId: 1,
    categoryName: 1,
  },
  {
    unique: true,
  },
);

export const Category = mongoose.model("InspectionCategory", CategorySchema);
