import express from "express";
import {
  createTraining,
  updateTraining,
  getAllTrainings,
  getTrainingById,
  deleteTraining,
  changeTrainingStatus,
  verifyTraining,
} from "../../../../controllers/User/Drivers/Others/Training.js";

const router = express.Router();

router.post("/", createTraining);
router.get("/", getAllTrainings);
router.get("/:id", getTrainingById);
router.put("/:id", updateTraining);
router.patch("/:id/status", changeTrainingStatus);
router.patch("/:id/verify", verifyTraining);
router.delete("/:id", deleteTraining);

export default router;
