// routes/driverStatusRoutes.js
// -----------------------------------------------------------------------------
// Routes for Driver status sync (license/medical-certificate expiry checks,
// eligibility recalculation, and reporting).
// -----------------------------------------------------------------------------

import express from "express";
import {
  syncAllDriverStatuses,
  syncSingleDriverStatus,
} from "../../../controllers/User/Drivers/Driverstatuscontroller.js";

const router = express.Router();

// -----------------------------------------------------------------------------
// @route   POST /api/drivers/sync-status
// @desc    Sync status for ALL drivers (all organizations) — checks license
//          expiry, medical certificate expiry, missing required info, and
//          recalculates driver eligibility/status. Returns full report.
// @access  Private (Admin only — this is a heavy batch operation)
// -----------------------------------------------------------------------------
router.post("/sync-status", syncAllDriverStatuses);

// -----------------------------------------------------------------------------
// @route   POST /api/drivers/:driverId/sync-status
// @desc    Sync status for a SINGLE driver — use this right after a license
//          or medical certificate is uploaded/updated, so status reflects
//          instantly without waiting for the daily cron job.
// @access  Private
// -----------------------------------------------------------------------------
router.post("/:driverId/sync-status", syncSingleDriverStatus);

export default router;
