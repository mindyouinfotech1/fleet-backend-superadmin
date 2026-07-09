import express from "express";
import {
  syncAllDriverStatuses,
  syncSingleDriverStatus,
} from "../../../controllers/User/Drivers/Driverstatuscontroller.js";

const router = express.Router();

router.post("/sync-status", syncAllDriverStatuses);
router.get("/:driverId/sync-status", syncSingleDriverStatus);

export default router;
