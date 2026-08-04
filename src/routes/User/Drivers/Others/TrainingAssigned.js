import express from "express";
import {
  createTrainingAssigned,
  getAllTrainingAssigned,
  getAllTrainingAssignedByDriver,
  getTrainingAssignedById,
  updateTrainingAssigned,
  deleteTrainingAssigned,
  verifyTrainingAssigned,
  updateTrainingAssignedStatus,
} from "../../../../controllers/User/Drivers/Others/TrainingAssigned.js";
import { createUploader } from "../../../../middleware/createUploader.js";
import { UPLOAD_PATHS } from "../../../../config/uploadConfig.js";

const router = express.Router();

const upload = createUploader({
  uploadPath: UPLOAD_PATHS.TRAINING_ASSIGNED,
  allowedMimeTypes: ["image/png", "image/jpeg", "image/jpg", "application/pdf"],
});

router.post(
  "/",
  upload.fields([{ name: "signatureImage", maxCount: 1 }]),
  createTrainingAssigned,
);

router.get("/", getAllTrainingAssigned);
router.get("/driver/:driverId", getAllTrainingAssignedByDriver);

router.get("/:id", getTrainingAssignedById);

router.put(
  "/:id",
  upload.fields([{ name: "signatureImage", maxCount: 1 }]),
  updateTrainingAssigned,
);

router.delete("/:id", deleteTrainingAssigned);
router.patch("/:id/verify", verifyTrainingAssigned);
router.patch("/:id/status", updateTrainingAssignedStatus);

export default router;


