import express from "express";
import {
  createTripRoute,
  getAllTripRoutes,
  getTripRouteById,
  getTripRouteByTripId,
  updateTripRoute,
  addStop,
  updateStop,
  updateStopStatus,
  deleteStop,
  softDeleteTripRoute,
  restoreTripRoute,
  permanentDeleteTripRoute,
} from "../../../controllers/User/Work_Order_Trip/TripRoute.js";

const router = express.Router();

// Trip Route level
router.post("/", createTripRoute);
router.get("/", getAllTripRoutes);
router.get("/:id", getTripRouteById);
router.get("/trip/:tripId", getTripRouteByTripId);
router.put("/:id", updateTripRoute);
router.delete("/:id", softDeleteTripRoute);
router.patch("/:id/restore", restoreTripRoute);
router.delete("/:id/permanent", permanentDeleteTripRoute);

// Stop level (nested under a route)
router.post("/:id/stops", addStop);
router.put("/:id/stops/:stopId", updateStop);
router.patch("/:id/stops/:stopId/status", updateStopStatus);
router.delete("/:id/stops/:stopId", deleteStop);

export default router;
