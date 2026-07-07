import express from "express";
import {
  createDriver,
  getAllDrivers,
  getDriverById,
  updateDriver,
  deleteDriver,
  changeDriverStatus,
} from "../../../controllers/User/Drivers/Driver.js";
import {
  driverLogin,
  getDriverOrganizationsByEmail,
} from "../../../controllers/User/Drivers/DriverLogin.js";

const router = express.Router();

router.post("/login", driverLogin);

router.get("/organizations", getDriverOrganizationsByEmail);

router.post("/", createDriver);

router.get("/", getAllDrivers);
router.get("/:id", getDriverById);
router.put("/:id", updateDriver);
router.delete("/:id", deleteDriver);
router.patch("/:id/status", changeDriverStatus);

export default router;
