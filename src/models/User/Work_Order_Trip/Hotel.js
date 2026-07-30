import mongoose from "mongoose";

const hotelSchema = new mongoose.Schema(
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

    hotelName: {
      type: String,
      required: true,
      trim: true,
    },

    address: {
      type: String,
      required: true,
      trim: true,
    },

    latitude: {
      type: Number,
      // required: true,
    },

    longitude: {
      type: Number,
      // required: true,
    },

    checkIn: {
      type: Date,
      required: true,
    },

    checkOut: {
      type: Date,
      required: true,
    },

    receiptDocument: {
      type: String, // File URL
      default: "",
    },

    bookingId: {
      type: String,
      trim: true,
    },

    roomType: {
      type: String,
      trim: true,
    },

    numberOfRooms: {
      type: Number,
      default: 1,
      min: 1,
    },

    numberOfGuests: {
      type: Number,
      default: 1,
      min: 1,
    },

    amount: {
      type: Number,
      default: 0,
      min: 0,
    },

    paymentStatus: {
      type: String,
      //   enum: ["Pending", "Paid", "Cancelled", "Refunded"],
    },

    bookingStatus: {
      type: String,
    },

    contactPerson: {
      type: String,
      trim: true,
    },

    contactNumber: {
      type: String,
      trim: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
    },

    remarks: {
      type: String,
      trim: true,
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

export const Hotel = mongoose.model("Hotel", hotelSchema);
