import express from "express";

import {
  createMedicalCertificate,
  getMedicalCertificates,
  getMedicalCertificatesByDriver,
  getMedicalCertificateById,
  updateMedicalCertificate,
  verifyMedicalCertificate,
  deleteMedicalCertificate,
  restoreMedicalCertificate,
} from "../../../controllers/User/Drivers/MedicalCertificate.js";

import { createUploader } from "../../../middleware/createUploader.js";
import { UPLOAD_PATHS } from "../../../config/uploadConfig.js";

const router = express.Router();

const upload = createUploader({
  uploadPath: UPLOAD_PATHS.DRIVER_MEDICAL_CERTIFICATE,
  allowedMimeTypes: ["image/png", "image/jpeg", "image/jpg", "application/pdf"],
});

router.post(
  "/create",
  upload.array("certificatefile", 5),
  createMedicalCertificate,
);
router.get("/", getMedicalCertificates);
router.get("/driver/:driverId", getMedicalCertificatesByDriver);
router.get("/:id", getMedicalCertificateById);

router.put(
  "/update/:id",
  upload.array("certificatefile", 5),
  updateMedicalCertificate,
);
router.patch("/verify/:id", verifyMedicalCertificate);
router.delete("/delete/:id", deleteMedicalCertificate);
router.patch("/restore/:id", restoreMedicalCertificate);

export default router;
