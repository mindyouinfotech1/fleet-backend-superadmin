import express from "express";
import {
  createDriver,
  getAllDrivers,
  getDriverById,
  updateDriver,
  deleteDriver,
  changeDriverStatus,
} from "../../../controllers/User/Drivers/Driver.js";

const router = express.Router();

router.post("/", createDriver);
router.get("/", getAllDrivers);
router.get("/:id", getDriverById);
router.put("/:id", updateDriver);
router.delete("/:id", deleteDriver);
router.patch("/:id/status", changeDriverStatus);

export default router;
