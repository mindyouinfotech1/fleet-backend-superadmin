import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// ── Sub-schema: License Details ───────────────────────────────
const licenseSchema = new mongoose.Schema(
  {
    license_number: { type: String, trim: true, default: null },
    license_expiry: { type: Date, default: null },

    // AU license classes: Car / LR / MR / HR / HC / MC
    // US CDL classes: A / B / C / None
    license_class: {
      type: String,
      trim: true,
      default: null,
    },

    // US only: CDL endorsements (H=Hazmat, N=Tanker, T=Double/Triple, P=Passenger, X=H+N)
    cdl_endorsements: {
      type: [String],
      enum: ["H", "N", "T", "P", "X", "S"],
      default: [],
    },

    license_state: { type: String, trim: true, default: null }, // NSW / TX etc.
    license_country: { type: String, trim: true, default: null }, // AU / US
    license_image_url: { type: String, default: null },
  },
  { _id: false },
);

// ── Sub-schema: Medical & Drug Test ──────────────────────────
const medicalSchema = new mongoose.Schema(
  {
    // AU: Medical certificate from NHVR-approved doctor
    // US: DOT Physical Medical Examiner's Certificate (MEC)
    medical_certificate_number: { type: String, default: null },
    medical_expiry: { type: Date, default: null },
    medical_document_url: { type: String, default: null },

    last_drug_test_date: { type: Date, default: null },
    drug_test_result: {
      type: String,
      enum: ["pass", "fail", "pending", null],
      default: null,
    },
    next_drug_test_due: { type: Date, default: null },
  },
  { _id: false },
);

// ── Sub-schema: AU-specific Compliance ───────────────────────
const nhvrComplianceSchema = new mongoose.Schema(
  {
    // Standard Hours / Basic Fatigue Management / Advanced Fatigue Management
    fatigue_management_type: {
      type: String,
      enum: ["Standard", "BFM", "AFM", null],
      default: "Standard",
    },

    bfm_certificate_number: { type: String, default: null },
    bfm_expiry: { type: Date, default: null },

    afm_accreditation_number: { type: String, default: null },
    afm_expiry: { type: Date, default: null },

    // Chain of Responsibility induction completed?
    cor_induction_completed: { type: Boolean, default: false },
    cor_induction_date: { type: Date, default: null },

    // Load Restraint training
    load_restraint_trained: { type: Boolean, default: false },
    load_restraint_date: { type: Date, default: null },
  },
  { _id: false },
);

// ── Sub-schema: US-specific Compliance ───────────────────────
const fmcsaComplianceSchema = new mongoose.Schema(
  {
    // Entry-Level Driver Training certificate
    eldt_certificate_url: { type: String, default: null },
    eldt_completed_date: { type: Date, default: null },

    // ELD (Electronic Logging Device) training
    eld_training_completed: { type: Boolean, default: false },
    eld_training_date: { type: Date, default: null },

    // Hours of Service training acknowledgment (49 CFR §395)
    hos_training_signed: { type: Boolean, default: false },
    hos_training_date: { type: Date, default: null },

    // DOT drug & alcohol policy signed (49 CFR §382.601)
    dot_policy_signed: { type: Boolean, default: false },
    dot_policy_signed_date: { type: Date, default: null },

    // Road test conducted by carrier
    road_test_completed: { type: Boolean, default: false },
    road_test_date: { type: Date, default: null },
    road_test_examiner: { type: String, default: null },

    // IFTA driver number (if applicable)
    ifta_driver_number: { type: String, default: null },
  },
  { _id: false },
);

// ── Sub-schema: Emergency Contact ─────────────────────────────
const emergencyContactSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    relationship: { type: String, trim: true },
    phone: { type: String, trim: true },
  },
  { _id: false },
);

// ── Main User Schema ──────────────────────────────────────────
const userSchema = new mongoose.Schema(
  {
    // ── Tenant Link ───────────────────────────────────────────
    tenant_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      default: null, // null for super_admin
    },

    // ── Role ──────────────────────────────────────────────────
    role_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: true,
    },

    role_slug: {
      type: String,
      required: true,
      enum: [
        "super_admin",
        "company_admin",
        "sub_admin",
        "manager",
        "dispatcher",
        "driver",
        "operator",
      ],
      // Denormalized for quick access without join
    },

    // ── Personal Info ─────────────────────────────────────────
    first_name: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
    },

    last_name: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
      unique: true,
    },

    phone: {
      type: String,
      trim: true,
      default: null,
    },

    profile_photo_url: {
      type: String,
      default: null,
    },

    date_of_birth: {
      type: Date,
      default: null,
    },

    gender: {
      type: String,
      enum: ["male", "female", "other", null],
      default: null,
    },

    // ── Address ───────────────────────────────────────────────
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      postcode: { type: String, trim: true },
      country: { type: String, trim: true },
    },

    // ── Country & Ruleset ─────────────────────────────────────
    country: {
      type: String,
      enum: ["AU", "US"],
      required: true,
    },

    compliance_ruleset: {
      type: String,
      enum: ["NHVR", "FMCSA"],
      required: true,
      // Auto-set from tenant's compliance_authority
    },

    // ── Authentication ────────────────────────────────────────
    password_hash: {
      type: String,
      required: true,
      select: false, // never returned in queries by default
    },

    password_changed_at: { type: Date, default: null },

    // ── Employment ────────────────────────────────────────────
    employee_id: {
      type: String,
      trim: true,
      default: null, // e.g. "DRV-102"
    },

    employment_type: {
      type: String,
      enum: ["full_time", "part_time", "subcontractor", "casual", null],
      default: null,
    },

    date_joined: { type: Date, default: Date.now },
    date_left: { type: Date, default: null },

    // ── Assigned Assets ───────────────────────────────────────
    assigned_vehicles: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Vehicle",
      },
    ],

    assigned_depot: {
      type: String,
      trim: true,
      default: null,
    },

    // ── License (drivers/operators only) ─────────────────────
    license: licenseSchema,

    // ── Medical & Drug Test ───────────────────────────────────
    medical: medicalSchema,

    // ── Country-specific Compliance ───────────────────────────
    nhvr_compliance: nhvrComplianceSchema, // Populated when country = AU
    fmcsa_compliance: fmcsaComplianceSchema, // Populated when country = US

    // ── Emergency Contact ─────────────────────────────────────
    emergency_contact: emergencyContactSchema,

    // ── Compliance Ratings (auto-calculated) ─────────────────
    compliance_score: {
      type: Number,
      min: 0,
      max: 100,
      default: 100,
    },

    total_violations: { type: Number, default: 0 },
    last_violation_at: { type: Date, default: null },

    // ── App Settings ──────────────────────────────────────────
    preferred_language: {
      type: String,
      enum: ["en", "es"],
      default: "en",
    },

    notification_preferences: {
      push: { type: Boolean, default: true },
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
    },

    // ── Status & Auth Flags ───────────────────────────────────
    status: {
      type: String,
      enum: ["active", "inactive", "suspended", "deleted"],
      default: "active",
    },

    email_verified: { type: Boolean, default: false },
    email_verified_at: { type: Date, default: null },

    last_login_at: { type: Date, default: null },
    last_login_ip: { type: String, default: null },

    fcm_token: {
      type: String,
      default: null, // Firebase push notification token (mobile app)
    },

    // ── Password Reset ────────────────────────────────────────
    reset_token: { type: String, default: null, select: false },
    reset_token_expiry: { type: Date, default: null, select: false },

    // ── Soft Delete ───────────────────────────────────────────
    deleted_at: { type: Date, default: null },

    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "users",
  },
);

// ── Indexes ───────────────────────────────────────────────────
userSchema.index({ tenant_id: 1, status: 1 });
userSchema.index({ tenant_id: 1, role_slug: 1 });
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ tenant_id: 1, employee_id: 1 }, { sparse: true });
userSchema.index({ country: 1, compliance_ruleset: 1 });
userSchema.index({ "license.license_expiry": 1 }); // expiry alerts
userSchema.index({ "medical.medical_expiry": 1 }); // expiry alerts

// ── Virtual: full name ────────────────────────────────────────
userSchema.virtual("full_name").get(function () {
  return `${this.first_name} ${this.last_name}`;
});


userSchema.methods.verifyPassword = async function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password_hash);
};

userSchema.methods.isFieldWorker = function () {
  return ["driver", "operator"].includes(this.role_slug);
};

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
