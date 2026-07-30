import mongoose from "mongoose";
const { Schema } = mongoose;

const OptionSchema = new Schema(
  {
    key: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false },
);

const StatusConfigSchema = new Schema(
  {
    module: {
      type: String,
      required: true,
      trim: true,
    },
    fieldKey: {
      type: String,
      required: true,
      trim: true,
    },
    fieldLabel: {
      type: String,
      required: true,
      trim: true,
    },
    options: {
      type: [OptionSchema],
      required: true,
      validate: {
        validator: function (arr) {
          return arr.length > 0;
        },
        message: "Kam se kam ek option zaroor hona chahiye.",
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

StatusConfigSchema.index({ module: 1, fieldKey: 1 }, { unique: true });

export const StatusConfig = mongoose.model("StatusConfig", StatusConfigSchema);
