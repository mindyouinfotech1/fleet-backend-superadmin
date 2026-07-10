import express from "express";

import {
  createBranch,
  getAllBranches,
  getBranchesByOrganization,
  getBranchById,
  updateBranch,
  deleteBranch,
  updateBranchStatus,
} from "../../../controllers/SuperAdmin/Auth/Branch.js";

import { createUploader } from "../../../middleware/createUploader.js";
import { UPLOAD_PATHS } from "../../../config/uploadConfig.js";

const router = express.Router();

const upload = createUploader({
  uploadPath: UPLOAD_PATHS.BRANCH_LOGO,
  allowedMimeTypes: ["image/png", "image/jpeg", "image/jpg", "image/webp"],
});

// Create
router.post("/", upload.single("logo"), createBranch);

// Get All
router.get("/", getAllBranches);

// Get By Organization
router.get("/organization/:organizationId", getBranchesByOrganization);

// Get By Id
router.get("/:id", getBranchById);

// Update
router.put("/:id", upload.single("logo"), updateBranch);

// Delete
router.delete("/:id", deleteBranch);

// Update Status
router.patch("/:id/status", updateBranchStatus);

export default router;
