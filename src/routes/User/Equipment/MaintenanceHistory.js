import express from "express";

import {
  createMaintenanceHistory,
  deleteMaintenanceInvoice,
  getAllMaintenanceHistory,
  getMaintenanceHistoryByEquipment,
  getMaintenanceHistoryById,
  updateMaintenanceHistory,
  verifyMaintenanceHistory,
  deleteMaintenanceHistory,
} from "../../../controllers/User/Equipment/MaintenanceHistory.js";

import { createUploader } from "../../../middleware/createUploader.js";
import { UPLOAD_PATHS } from "../../../config/uploadConfig.js";

const router = express.Router();

const invoiceUploader = createUploader({
  uploadPath: UPLOAD_PATHS.MAINTENANCE_HISTORY_INVOICE,
  allowedMimeTypes: ["image/png", "image/jpeg", "image/jpg", "application/pdf"],
});

router.post(
  "/create",
  invoiceUploader.single("invoice_file"),
  createMaintenanceHistory,
);

router.delete(
  "/delete-invoice/:maintenanceHistoryId",
  deleteMaintenanceInvoice,
);

router.get("/", getAllMaintenanceHistory);
router.get("/equipment/:equipmentId", getMaintenanceHistoryByEquipment);
router.get("/:id", getMaintenanceHistoryById);

router.put(
  "/update/:id",
  invoiceUploader.single("invoice_file"),
  updateMaintenanceHistory,
);

router.delete("/delete/:id", deleteMaintenanceHistory);

router.patch("/verify/:id", verifyMaintenanceHistory);

export default router;
