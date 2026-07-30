import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BusinessUser",
      required: true,
    },

    customerCode: {
      type: String,
      required: true,
      trim: true,
    },

    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    customerId: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      // required: true,
      trim: true,
    },

    email: {
      type: String,
      // required: true,
      trim: true,
      lowercase: true,
    },

    country: {
      type: Number,
      // required: true,
      trim: true,
    },

    state: {
      type: Number,
      //   required: true,
      trim: true,
    },

    city: {
      type: Number,
      //   required: true,
      trim: true,
    },

    address: {
      type: String,
      trim: true,
    },

    status: {
      type: String,
    },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  },
);

export const Customer = mongoose.model("Customer", customerSchema);
