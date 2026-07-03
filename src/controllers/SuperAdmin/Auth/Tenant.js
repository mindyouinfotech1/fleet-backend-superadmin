import multer from "multer";
import { Tenant } from "../../../models/SuperAdmin/Auth/Tenant.js";
import fs from "fs";
import path from "path";

// ── Multer setup for logo uploads ──────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), "uploads/logos");
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${file.fieldname}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) cb(null, true);
  else cb(new Error("Only image files are allowed"), false);
};

export const upload = multer({ storage, fileFilter });

// ── Tenant Controller ─────────────────────────────────────────
export const TenantController = {
  createTenant: async (req, res) => {
    try {
      const data = { ...req.body };
      if (req.file) data.logo_url = `/uploads/logos/${req.file.filename}`;

      const tenant = new Tenant(data);
      await tenant.save();
      res.status(201).json({ success: true, tenant });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  getTenants: async (req, res) => {
    try {
      const tenants = await Tenant.find({ status: { $ne: "deleted" } });
      res.status(200).json({ success: true, tenants });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  getTenantById: async (req, res) => {
    try {
      const tenant = await Tenant.findById(req.params.id);
      if (!tenant || tenant.status === "deleted")
        return res
          .status(404)
          .json({ success: false, message: "Tenant not found" });
      res.status(200).json({ success: true, tenant });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  updateTenant: async (req, res) => {
    try {
      const data = { ...req.body };
      if (req.file) data.logo_url = `/uploads/logos/${req.file.filename}`;

      const tenant = await Tenant.findByIdAndUpdate(req.params.id, data, {
        new: true,
        runValidators: true,
      });
      if (!tenant || tenant.status === "deleted")
        return res
          .status(404)
          .json({ success: false, message: "Tenant not found" });

      res.status(200).json({ success: true, tenant });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  deleteTenant: async (req, res) => {
    try {
      const tenant = await Tenant.findByIdAndUpdate(
        req.params.id,
        { status: "deleted", deleted_at: new Date() },
        { new: true },
      );

      if (!tenant)
        return res
          .status(404)
          .json({ success: false, message: "Tenant not found" });

      res
        .status(200)
        .json({ success: true, message: "Tenant deleted successfully" });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
};
