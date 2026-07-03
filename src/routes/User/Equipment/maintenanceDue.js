import express from "express";
import {
  createMaintenance,
  getAllMaintenance,
  getMaintenanceById,
  updateMaintenance,
  deleteMaintenance,
  updateStatus,
  verifyMaintenance,
} from "../../../controllers/User/Equipment/maintenanceDue.js";

const router = express.Router();

router.post("/", createMaintenance);
router.get("/", getAllMaintenance);
router.get("/:id", getMaintenanceById);
router.put("/:id", updateMaintenance);
router.delete("/:id", deleteMaintenance);

router.patch("/:id/status", updateStatus);
router.patch("/:id/verify", verifyMaintenance);

export default router;