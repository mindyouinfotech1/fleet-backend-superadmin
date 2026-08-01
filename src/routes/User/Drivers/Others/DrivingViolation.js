import express from "express";
import {
  createDrivingViolation,
  updateDrivingViolation,
  getAllDrivingViolations,
  getDrivingViolationById,
  deleteDrivingViolation,
  changeDrivingViolationStatus,
  verifyDrivingViolation,
  rejectDrivingViolation,
} from "../../../../controllers/User/Drivers/Others/DrivingViolation.js";

const router = express.Router();


router.post("/", createDrivingViolation);
router.get("/", getAllDrivingViolations);
router.get("/:id", getDrivingViolationById);
router.put("/:id", updateDrivingViolation);
router.patch("/:id/status", changeDrivingViolationStatus);
router.patch("/:id/verify", verifyDrivingViolation);
router.patch("/:id/reject", rejectDrivingViolation);
router.delete("/:id", deleteDrivingViolation);

export default router;
