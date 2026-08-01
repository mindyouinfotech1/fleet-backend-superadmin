import express from "express";
import {
  createDrivingAccident,
  updateDrivingAccident,
  getAllDrivingAccidents,
  getDrivingAccidentById,
  deleteDrivingAccident,
  changeDrivingAccidentStatus,
  verifyDrivingAccident,
  rejectDrivingAccident,
} from "../../../../controllers/User/Drivers/Others/Drivingaccidentcontroller.js";

const router = express.Router();

router.post("/", createDrivingAccident);
router.get("/", getAllDrivingAccidents);
router.get("/:id", getDrivingAccidentById);
router.put("/:id", updateDrivingAccident);
router.patch("/:id/status", changeDrivingAccidentStatus);
router.patch("/:id/verify", verifyDrivingAccident);
router.patch("/:id/reject", rejectDrivingAccident);
router.delete("/:id", deleteDrivingAccident);

export default router;
