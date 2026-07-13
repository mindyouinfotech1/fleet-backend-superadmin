import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import {
  createEquipment,
  getAllEquipment,
  getEquipmentById,
  updateEquipment,
  addDocuments,
  deleteDocument,
  deleteEquipment,
  restoreEquipment,
  updateEquipmentStatus,
  getDeletedEquipment,
} from "../../../controllers/User/Equipment/Equipment.js";
import { UPLOAD_PATHS } from "../../../config/uploadConfig.js";
import { createUploader } from "../../../middleware/createUploader.js";

const router = express.Router();

const upload = createUploader({
  uploadPath: UPLOAD_PATHS.EQUIPMENT,
  allowedMimeTypes: ["image/png", "image/jpeg", "image/jpg", "application/pdf"],
});

router.post("/", upload.array("documents", 20), createEquipment);
router.get("/", getAllEquipment);
router.get("/deleted", getDeletedEquipment);
router.get("/:id", getEquipmentById);
router.put("/:id", upload.array("documents", 20), updateEquipment);
router.delete("/:id", deleteEquipment);

router.post("/:id/documents", upload.array("documents", 20), addDocuments);
router.delete("/:id/documents/:documentId", deleteDocument);

router.patch("/:id/status", updateEquipmentStatus);
router.patch("/:id/restore", restoreEquipment);

export default router;
