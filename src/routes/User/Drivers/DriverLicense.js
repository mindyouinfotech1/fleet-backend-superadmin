import express from "express";
import {
  createDriverLicense,
  getAllDriverLicenses,
  getAllDriverLicensesByDriver,
  getDriverLicenseById,
  updateDriverLicense,
  deleteDriverLicense,
  verifyDriverLicense,
  updateLicenseStatus,
} from "../../../controllers/User/Drivers/DriverLicense.js";

import { createUploader } from "../../../middleware/createUploader.js";
import { UPLOAD_PATHS } from "../../../config/uploadConfig.js";

const router = express.Router();

const upload = createUploader({
  uploadPath: UPLOAD_PATHS.DRIVER_LICENSE,
  allowedMimeTypes: ["image/png", "image/jpeg", "image/jpg", "application/pdf"],
});

router.post(
  "/",
  upload.fields([
    { name: "licenseFront", maxCount: 1 },
    { name: "licenseBack", maxCount: 1 },
  ]),
  createDriverLicense,
);

router.get("/", getAllDriverLicenses);
router.get("/driver/:driverId", getAllDriverLicensesByDriver);

router.get("/:id", getDriverLicenseById);

router.put(
  "/:id",
  upload.fields([
    { name: "licenseFront", maxCount: 1 },
    { name: "licenseBack", maxCount: 1 },
  ]),
  updateDriverLicense,
);

router.delete("/:id", deleteDriverLicense);
router.patch("/:id/verify", verifyDriverLicense);
router.patch("/:id/status", updateLicenseStatus);

export default router;
