import mongoose from "mongoose";


const addressSchema = new mongoose.Schema(
  {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true }, // e.g. NSW, QLD, TX, CA
    postcode: { type: String, trim: true },
    country: { type: String, trim: true },
  },
  { _id: false },
);

const tenantSchema = new mongoose.Schema(
  {
    // ── Identity ──────────────────────────────────────────────
    company_name: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
    },

    company_email: {
      type: String,
      required: [true, "Company email is required"],
      lowercase: true,
      trim: true,
      unique: true,
    },

    company_phone: {
      type: String,
      trim: true,
    },

    logo_url: {
      type: String,
      default: null,
    },

    address: addressSchema,

    // ── Country & Compliance Authority ────────────────────────
    country: {
      type: String,
      required: true,
      enum: {
        values: ["AU", "US"],
        message: "Country must be AU (Australia) or US (United States)",
      },
    },

    /*
     * AU → NHVR  (National Heavy Vehicle Regulator)
     * US → FMCSA (Federal Motor Carrier Safety Administration)
     */
    compliance_authority: {
      type: String,
      enum: ["NHVR", "FMCSA"],
      required: true,
    },

    // Australia: Australian Business Number
    abn_number: {
      type: String,
      trim: true,
      default: null,
      // Required only when country = AU (validated at app layer)
    },

    // USA: USDOT Number (issued by FMCSA)
    dot_number: {
      type: String,
      trim: true,
      default: null,
      // Required only when country = US
    },

    // USA: Motor Carrier number
    mc_number: {
      type: String,
      trim: true,
      default: null,
    },

    // Australia: NHVAS Accreditation Number (optional, for accredited operators)
    nhvas_number: {
      type: String,
      trim: true,
      default: null,
    },

    // ── Timezone (for HOS / fatigue log calculations) ─────────
    // AU: "Australia/Sydney" | "Australia/Brisbane" | "Australia/Perth"
    // US: "America/New_York" | "America/Chicago" | "America/Los_Angeles"
    timezone: {
      type: String,
      required: true,
      default: "Australia/Sydney",
    },

    // ── Subscription ──────────────────────────────────────────
    subscription_plan: {
      type: String,
      enum: ["basic", "pro", "enterprise"],
      default: "basic",
    },

    subscription_status: {
      type: String,
      enum: ["trial", "active", "suspended", "cancelled"],
      default: "trial",
    },

    trial_ends_at: {
      type: Date,
      default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
    },

    // ── Limits (controlled by SaaS super admin) ───────────────
    max_vehicles: { type: Number, default: 10 },
    max_drivers: { type: Number, default: 20 },
    max_storage_gb: { type: Number, default: 5 },

    // ── Status ────────────────────────────────────────────────
    status: {
      type: String,
      enum: ["active", "suspended", "deleted"],
      default: "active",
    },

    // ── Meta ──────────────────────────────────────────────────
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // null for first super-admin created tenants
    },

    deleted_at: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt auto
    collection: "tenants",
  },
);

// ── Indexes ───────────────────────────────────────────────────
tenantSchema.index({ country: 1, status: 1 });
tenantSchema.index({ company_email: 1 }, { unique: true });
tenantSchema.index({ abn_number: 1 }, { sparse: true });
tenantSchema.index({ dot_number: 1 }, { sparse: true });

// ── Export using ES module syntax ─────────────────────────────
export const Tenant = mongoose.model("Tenant", tenantSchema);
