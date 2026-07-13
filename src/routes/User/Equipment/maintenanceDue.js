import express from "express";
import {
  createMaintenance,
  getAllMaintenance,
  getMaintenanceByEquipment,
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
router.get("/equipment/:equipmentId", getMaintenanceByEquipment);
router.put("/:id", updateMaintenance);
router.delete("/:id", deleteMaintenance);

router.patch("/:id/status", updateStatus);
router.patch("/:id/verify", verifyMaintenance);

export default router;