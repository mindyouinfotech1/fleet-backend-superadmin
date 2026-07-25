// import mongoose from "mongoose";

// const BusinessUserSchema = new mongoose.Schema(
//   {
//     organizationName: {
//       type: String,
//       required: true,
//       trim: true,
//     },
//     organizationCode: {
//       type: String,
//       unique: true,
//       required: true,
//     },
//     email: {
//       type: String,
//       required: true,
//       trim: true,
//       lowercase: true,
//     },
//     password: {
//       type: String,
//       required: true,
//     },
//     country: {
//       type: String,
//       // required: true,
//     },
//     countryCode: {
//       type: String,
//       // required: true,
//     },
//     currency: {
//       type: String,
//       // required: true,
//     },
//     currencySymbol: {
//       type: String,
//     },
//     flag: {
//       type: String,
//     },
//     timezone: {
//       type: String,
//     },
//     phone: {
//       type: String,
//     },
//     address: {
//       type: String,
//     },
//     logo: {
//       type: String,
//     },
//     adminUserId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       default: null,
//     },
//     subscriptionPlan: {
//       type: String,
//       enum: ["free", "basic", "premium", "enterprise"],
//       default: "free",
//     },
//     isActive: {
//       type: Boolean,
//       default: true,
//     },
//     isDelete: {
//       type: Boolean,
//       default: false,
//     },
//     status: {
//       type: String,
//       enum: ["active", "inactive", "suspended"],
//       default: "active",
//     },
//   },
//   {
//     timestamps: true,
//   },
// );

// export const User = mongoose.model("BusinessUser", BusinessUserSchema);

import mongoose from "mongoose";

const BusinessUserSchema = new mongoose.Schema(
  {
    organizationName: { type: String, required: true, trim: true },
    organizationCode: { type: String, unique: true, required: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    password: { type: String, required: true },

    // ================= COUNTRY =================
    country: {
      id: { type: Number }, // e.g. 101
      name: { type: String }, // e.g. "India"
      iso2: { type: String }, // e.g. "IN"
      phonecode: { type: String }, // e.g. "91"
      currency: { type: String }, // e.g. "INR"
      currencyName: { type: String }, // e.g. "Indian rupee"
      currencySymbol: { type: String }, // e.g. "₹"
      flag: { type: String }, // e.g. "🇮🇳"
      timezones: { type: mongoose.Schema.Types.Mixed },
    },

    // ================= STATE =================
    state: {
      id: { type: Number },
      name: { type: String },
    },

    // ================= CITY =================
    city: {
      id: { type: Number },
      name: { type: String },
    },

    phone: { type: String },
    address: { type: String },
    logo: { type: String },
    adminUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    subscriptionPlan: {
      type: String,
      enum: ["free", "basic", "premium", "enterprise"],
      default: "free",
    },
    isActive: { type: Boolean, default: true },
    isDelete: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },
  },
  { timestamps: true },
);

export const User = mongoose.model("BusinessUser", BusinessUserSchema);
