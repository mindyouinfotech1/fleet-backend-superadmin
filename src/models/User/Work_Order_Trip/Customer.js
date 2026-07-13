import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
    {
      
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BusinessUser",
      required: true,
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
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    country: {
      type: String,
      required: true,
      trim: true,
    },

    state: {
      type: String,
    //   required: true,
      trim: true,
    },

    city: {
      type: String,
    //   required: true,
      trim: true,
    },

    address: {
      type: String,
      trim: true,
    },

    status: {
      type: String,
      default: "Active",
    },

  },
  {
    timestamps: true,
  }
);

export const Customer = mongoose.model("Customer", customerSchema);