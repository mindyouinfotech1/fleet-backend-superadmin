import express from "express";
import {
  createDrivingDisqualification,
  updateDrivingDisqualification,
  getAllDrivingDisqualifications,
  getDrivingDisqualificationById,
  deleteDrivingDisqualification,
  changeDrivingDisqualificationStatus,
  verifyDrivingDisqualification,
} from "../../../../controllers/User/Drivers/Others/DrivingDisqualification.js";

const router = express.Router();

router.post("/", createDrivingDisqualification);
router.get("/", getAllDrivingDisqualifications);
router.get("/:id", getDrivingDisqualificationById);
router.put("/:id", updateDrivingDisqualification);
router.patch("/:id/status", changeDrivingDisqualificationStatus);
router.patch("/:id/verify", verifyDrivingDisqualification);
router.delete("/:id", deleteDrivingDisqualification);

export default router;
