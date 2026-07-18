import express from "express";
import {
  createTrip,
  getAllTrips,
  getTripById,
  updateTrip,
  updateTripStatus,
  deleteTrip,
  restoreTrip,
} from "../../../controllers/User/Work_Order_Trip/Trip.js";

const router = express.Router();

// router.use(verifyToken); // saari routes protected karne ke liye

router.post("/create", createTrip);
router.get("/organization/:organizationId", getAllTrips);
router.get("/:id", getTripById);
router.put("/:id", updateTrip);
router.patch("/:id/status", updateTripStatus);
router.delete("/:id", deleteTrip);
router.patch("/:id/restore", restoreTrip);

export default router;
