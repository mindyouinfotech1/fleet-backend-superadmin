import express from "express";
import {
  createSubAdmin,
  updateSubAdmin,
  getSubAdminById,
  getAllSubAdmins,
  deleteSubAdmin,
  updateUserPassword,
} from "../../controllers/SuperAdmin/Fleetsubadmin.js";
import { createUploader } from "../../middleware/createUploader.js";
import { UPLOAD_PATHS } from "../../config/uploadConfig.js";

const PROFILE_PHOTO_DIR = UPLOAD_PATHS.PROFILE_PHOTO_DIR;
const router = express.Router();

const uploadProfilePhoto = createUploader({
  uploadPath: PROFILE_PHOTO_DIR,
  allowedMimeTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
}).single("ProfilePhoto");

router.post("/sub-admin/create", uploadProfilePhoto, createSubAdmin);
router.put("/sub-admin/:id", uploadProfilePhoto, updateSubAdmin);
router.get("/sub-admin/:id", getSubAdminById);
router.put("/update-password", updateUserPassword);

router.get("/sub-admin", getAllSubAdmins);
router.delete("/sub-admin/:id", deleteSubAdmin);

export default router;
