import mongoose from "mongoose";
import { TripRoute } from "../../../models/User/Work_Order_Trip/TripRoute.js";

const recalculateRouteCounts = (tripRoute) => {
  const stops = tripRoute.stops || [];

  tripRoute.totalStops = stops.length;
  tripRoute.completedStops = stops.filter(
    (s) => s.status === "Completed",
  ).length;
  tripRoute.skippedStops = stops.filter(
    (s) => s.status === "Skipped" || s.status === "Cancelled",
  ).length;
  tripRoute.pendingStops = stops.filter(
    (s) => s.status === "Pending" || s.status === "Upcoming",
  ).length;

  // currentStopIndex = sequence-wise pehla stop jo abhi Completed/Skipped/Cancelled nahi hai
  const sortedStops = [...stops].sort((a, b) => a.sequence - b.sequence);
  const nextStop = sortedStops.find(
    (s) => !["Completed", "Skipped", "Cancelled"].includes(s.status),
  );
  tripRoute.currentStopIndex = nextStop
    ? sortedStops.indexOf(nextStop)
    : sortedStops.length;

  // agar saare stops complete/skip ho gaye ho to route ko auto complete maar do
  if (
    stops.length > 0 &&
    tripRoute.completedStops + tripRoute.skippedStops === stops.length
  ) {
    tripRoute.routeStatus = "Completed";
  }

  return tripRoute;
};

/* ------------------------------------------------------------------ */
/* 1. CREATE TRIP ROUTE                                               */
/* ------------------------------------------------------------------ */
export const createTripRoute = async (req, res) => {
  try {
    const {
      organizationId,
      tripId,
      tripcode,
      routeName,
      totalDistance,
      estimatedDuration,
      stops,
    } = req.body;

    if (!organizationId || !tripId) {
      return res.status(400).json({
        success: false,
        message: "organizationId aur tripId required hai",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(organizationId) ||
      !mongoose.Types.ObjectId.isValid(tripId)
    ) {
      return res.status(400).json({
        success: false,
        message: "organizationId ya tripId invalid hai",
      });
    }

    const alreadyExists = await TripRoute.findOne({ tripId });
    if (alreadyExists) {
      return res.status(409).json({
        success: false,
        message: "Is trip ke liye route already ban chuka hai",
      });
    }

    const tripRoute = new TripRoute({
      organizationId,
      tripId,
      tripcode,
      routeName,
      totalDistance,
      estimatedDuration,
      stops: Array.isArray(stops)
        ? stops.map((s, idx) => ({ ...s, sequence: s.sequence ?? idx + 1 }))
        : [],
    });

    recalculateRouteCounts(tripRoute);
    await tripRoute.save();

    // SOCKET EVENT
    const io = req.app.get("io");
    if (io) {
      io.emit("tripRouteCreated", tripRoute);
      io.to(`org_${organizationId}`).emit("tripRouteCreated", tripRoute);
    }

    return res.status(201).json({
      success: true,
      message: "Trip route successfully create ho gaya",
      data: tripRoute,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        code: "DUPLICATE_TRIP_ROUTE",
        message: "Is tripId ke liye route already exist karta hai",
      });
    }
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Trip route create karte waqt kuch galat ho gaya",
    });
  }
};

/* ------------------------------------------------------------------ */
/* 2. GET ALL TRIP ROUTES (organization-wise, filters + pagination)   */
/* ------------------------------------------------------------------ */
export const getAllTripRoutes = async (req, res) => {
  try {
    const {
      organizationId,
      routeStatus,
      page = 1,
      limit = 10,
      includeDeleted,
    } = req.query;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: "organizationId query param required hai",
      });
    }

    const filter = { organizationId };
    if (routeStatus) filter.routeStatus = routeStatus;
    if (includeDeleted !== "true") filter.isDeleted = false;

    const skip = (Number(page) - 1) * Number(limit);

    const [routes, total] = await Promise.all([
      TripRoute.find(filter)
        .populate("tripId")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      TripRoute.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: routes,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Trip routes fetch karte waqt kuch galat ho gaya",
    });
  }
};

/* ------------------------------------------------------------------ */
/* 3. GET SINGLE TRIP ROUTE BY ID                                     */
/* ------------------------------------------------------------------ */
export const getTripRouteById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid route id" });
    }

    const tripRoute = await TripRoute.findOne({
      _id: id,
      isDeleted: false,
    }).populate("tripId");
    if (!tripRoute) {
      return res
        .status(404)
        .json({ success: false, message: "Trip route nahi mila" });
    }

    return res.status(200).json({ success: true, data: tripRoute });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Trip route fetch karte waqt kuch galat ho gaya",
    });
  }
};

/* ------------------------------------------------------------------ */
/* 4. GET TRIP ROUTE BY tripId                                        */
/* ------------------------------------------------------------------ */
export const getTripRouteByTripId = async (req, res) => {
  try {
    const { tripId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(tripId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid trip id" });
    }

    const tripRoute = await TripRoute.findOne({
      tripId,
      isDeleted: false,
    }).populate("tripId");
    if (!tripRoute) {
      return res
        .status(404)
        .json({ success: false, message: " trip route not found" });
    }

    return res.status(200).json({ success: true, data: tripRoute });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

/* ------------------------------------------------------------------ */
/* 5. UPDATE TRIP ROUTE (basic fields)                                */
/* ------------------------------------------------------------------ */
export const updateTripRoute = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      routeName,
      totalDistance,
      estimatedDuration,
      actualDuration,
      routeStatus,
      tripcode,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid route id" });
    }

    const tripRoute = await TripRoute.findOne({ _id: id, isDeleted: false });
    if (!tripRoute) {
      return res
        .status(404)
        .json({ success: false, message: "Trip route nahi mila" });
    }

    if (routeName !== undefined) tripRoute.routeName = routeName;
    if (totalDistance !== undefined) tripRoute.totalDistance = totalDistance;
    if (estimatedDuration !== undefined)
      tripRoute.estimatedDuration = estimatedDuration;
    if (actualDuration !== undefined) tripRoute.actualDuration = actualDuration;
    if (routeStatus !== undefined) tripRoute.routeStatus = routeStatus;
    if (tripcode !== undefined) tripRoute.tripcode = tripcode;

    await tripRoute.save();

    const io = req.app.get("io");
    if (io) {
      io.emit("tripRouteUpdated", tripRoute);
      io.to(`org_${tripRoute.organizationId}`).emit(
        "tripRouteUpdated",
        tripRoute,
      );
    }

    return res.status(200).json({
      success: true,
      message: "Trip route update ho gaya",
      data: tripRoute,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Trip route update karte waqt kuch galat ho gaya",
    });
  }
};

/* ------------------------------------------------------------------ */
/* 6. ADD STOP                                                        */
/* ------------------------------------------------------------------ */
export const addStop = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      stopName,
      stopType,
      location,
      plannedArrival,
      plannedDeparture,
      notes,
      sequence,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid route id" });
    }

    if (!stopName) {
      return res
        .status(400)
        .json({ success: false, message: "stopName required hai" });
    }

    const tripRoute = await TripRoute.findOne({ _id: id, isDeleted: false });
    if (!tripRoute) {
      return res
        .status(404)
        .json({ success: false, message: "Trip route nahi mila" });
    }

    const nextSequence = sequence ?? tripRoute.stops.length + 1;

    tripRoute.stops.push({
      sequence: nextSequence,
      stopName,
      stopType,
      location,
      plannedArrival,
      plannedDeparture,
      notes,
    });

    recalculateRouteCounts(tripRoute);
    await tripRoute.save();

    const newStop = tripRoute.stops[tripRoute.stops.length - 1];

    const io = req.app.get("io");
    if (io) {
      io.emit("stopAdded", { tripRouteId: tripRoute._id, stop: newStop });
      io.to(`org_${tripRoute.organizationId}`).emit("stopAdded", {
        tripRouteId: tripRoute._id,
        stop: newStop,
      });
      io.to(`trip_${tripRoute.tripId}`).emit("stopAdded", { stop: newStop });
    }

    return res.status(201).json({
      success: true,
      message: "Stop add ho gaya",
      data: tripRoute,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Stop add karte waqt kuch galat ho gaya",
    });
  }
};

/* ------------------------------------------------------------------ */
/* 7. UPDATE STOP (details edit karna, status ke alawa)               */
/* ------------------------------------------------------------------ */
export const updateStop = async (req, res) => {
  try {
    const { id, stopId } = req.params;
    const updates = req.body;

    if (
      !mongoose.Types.ObjectId.isValid(id) ||
      !mongoose.Types.ObjectId.isValid(stopId)
    ) {
      return res.status(400).json({ success: false, message: "Invalid id" });
    }

    const tripRoute = await TripRoute.findOne({ _id: id, isDeleted: false });
    if (!tripRoute) {
      return res
        .status(404)
        .json({ success: false, message: "Trip route nahi mila" });
    }

    const stop = tripRoute.stops.id(stopId);
    if (!stop) {
      return res
        .status(404)
        .json({ success: false, message: "Stop nahi mila" });
    }

    const allowedFields = [
      "stopName",
      "stopType",
      "location",
      "plannedArrival",
      "plannedDeparture",
      "sequence",
      "notes",
    ];
    allowedFields.forEach((field) => {
      if (updates[field] !== undefined) stop[field] = updates[field];
    });

    recalculateRouteCounts(tripRoute);
    await tripRoute.save();

    const io = req.app.get("io");
    if (io) {
      io.emit("stopUpdated", { tripRouteId: tripRoute._id, stop });
      io.to(`org_${tripRoute.organizationId}`).emit("stopUpdated", {
        tripRouteId: tripRoute._id,
        stop,
      });
      io.to(`trip_${tripRoute.tripId}`).emit("stopUpdated", { stop });
    }

    return res.status(200).json({
      success: true,
      message: "Stop update ho gaya",
      data: tripRoute,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Stop update karte waqt kuch galat ho gaya",
    });
  }
};

/* ------------------------------------------------------------------ */
/* 8. UPDATE STOP STATUS (arrival/departure/status transitions)       */
/*    Ye sabse important real-time event hai - driver ke app se       */
/*    trigger hoga jab wo kisi stop pe reach/complete/skip kare.      */
/* ------------------------------------------------------------------ */
export const updateStopStatus = async (req, res) => {
  try {
    const { id, stopId } = req.params;
    const { status } = req.body;

    const validStatuses = [
      "Pending",
      "Upcoming",
      "Reached",
      "Completed",
      "Skipped",
      "Cancelled",
    ];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `status valid hona chahiye: ${validStatuses.join(", ")}`,
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(id) ||
      !mongoose.Types.ObjectId.isValid(stopId)
    ) {
      return res.status(400).json({ success: false, message: "Invalid id" });
    }

    const tripRoute = await TripRoute.findOne({ _id: id, isDeleted: false });
    if (!tripRoute) {
      return res
        .status(404)
        .json({ success: false, message: "Trip route nahi mila" });
    }

    const stop = tripRoute.stops.id(stopId);
    if (!stop) {
      return res
        .status(404)
        .json({ success: false, message: "Stop nahi mila" });
    }

    stop.status = status;

    // status ke hisaab se timestamps auto set karo
    if (status === "Reached" && !stop.actualArrival) {
      stop.actualArrival = new Date();
    }
    if (status === "Completed" && !stop.actualDeparture) {
      stop.actualDeparture = new Date();
      if (!stop.actualArrival) stop.actualArrival = new Date();
    }

    // route ko "In Progress" bana do agar abhi tak Planned hai
    if (tripRoute.routeStatus === "Planned") {
      tripRoute.routeStatus = "In Progress";
    }

    recalculateRouteCounts(tripRoute);
    await tripRoute.save();

    const io = req.app.get("io");
    if (io) {
      const payload = {
        tripRouteId: tripRoute._id,
        tripId: tripRoute.tripId,
        stop,
        progress: {
          totalStops: tripRoute.totalStops,
          completedStops: tripRoute.completedStops,
          pendingStops: tripRoute.pendingStops,
          skippedStops: tripRoute.skippedStops,
          currentStopIndex: tripRoute.currentStopIndex,
          routeStatus: tripRoute.routeStatus,
        },
      };

      io.emit("stopStatusUpdated", payload);
      io.to(`org_${tripRoute.organizationId}`).emit(
        "stopStatusUpdated",
        payload,
      );
      io.to(`trip_${tripRoute.tripId}`).emit("stopStatusUpdated", payload);

      // agar poora route hi complete ho gaya to alag se bata do (dashboard ke liye useful)
      if (tripRoute.routeStatus === "Completed") {
        io.emit("tripRouteCompleted", {
          tripRouteId: tripRoute._id,
          tripId: tripRoute.tripId,
        });
        io.to(`org_${tripRoute.organizationId}`).emit("tripRouteCompleted", {
          tripRouteId: tripRoute._id,
          tripId: tripRoute.tripId,
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Stop status update ho gaya",
      data: tripRoute,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Stop status update karte waqt kuch galat ho gaya",
    });
  }
};

/* ------------------------------------------------------------------ */
/* 9. DELETE STOP (aur baaki stops ko resequence karna)                */
/* ------------------------------------------------------------------ */
export const deleteStop = async (req, res) => {
  try {
    const { id, stopId } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(id) ||
      !mongoose.Types.ObjectId.isValid(stopId)
    ) {
      return res.status(400).json({ success: false, message: "Invalid id" });
    }

    const tripRoute = await TripRoute.findOne({ _id: id, isDeleted: false });
    if (!tripRoute) {
      return res
        .status(404)
        .json({ success: false, message: "Trip route nahi mila" });
    }

    const stop = tripRoute.stops.id(stopId);
    if (!stop) {
      return res
        .status(404)
        .json({ success: false, message: "Stop nahi mila" });
    }

    stop.deleteOne();

    // resequence remaining stops (1,2,3...)
    tripRoute.stops
      .sort((a, b) => a.sequence - b.sequence)
      .forEach((s, idx) => {
        s.sequence = idx + 1;
      });

    recalculateRouteCounts(tripRoute);
    await tripRoute.save();

    const io = req.app.get("io");
    if (io) {
      io.emit("stopDeleted", { tripRouteId: tripRoute._id, stopId });
      io.to(`org_${tripRoute.organizationId}`).emit("stopDeleted", {
        tripRouteId: tripRoute._id,
        stopId,
      });
      io.to(`trip_${tripRoute.tripId}`).emit("stopDeleted", { stopId });
    }

    return res.status(200).json({
      success: true,
      message: "Stop delete ho gaya",
      data: tripRoute,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Stop delete karte waqt kuch galat ho gaya",
    });
  }
};

/* ------------------------------------------------------------------ */
/* 10. SOFT DELETE TRIP ROUTE                                         */
/* ------------------------------------------------------------------ */
export const softDeleteTripRoute = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid route id" });
    }

    const tripRoute = await TripRoute.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { isDeleted: true },
      { new: true },
    );

    if (!tripRoute) {
      return res
        .status(404)
        .json({ success: false, message: "Trip route nahi mila" });
    }

    const io = req.app.get("io");
    if (io) {
      io.emit("tripRouteDeleted", { tripRouteId: tripRoute._id });
      io.to(`org_${tripRoute.organizationId}`).emit("tripRouteDeleted", {
        tripRouteId: tripRoute._id,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Trip route delete ho gaya",
      data: tripRoute,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Trip route delete karte waqt kuch galat ho gaya",
    });
  }
};

/* ------------------------------------------------------------------ */
/* 11. RESTORE TRIP ROUTE                                             */
/* ------------------------------------------------------------------ */
export const restoreTripRoute = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid route id" });
    }

    const tripRoute = await TripRoute.findOneAndUpdate(
      { _id: id, isDeleted: true },
      { isDeleted: false },
      { new: true },
    );

    if (!tripRoute) {
      return res
        .status(404)
        .json({ success: false, message: "Deleted trip route nahi mila" });
    }

    const io = req.app.get("io");
    if (io) {
      io.emit("tripRouteRestored", tripRoute);
      io.to(`org_${tripRoute.organizationId}`).emit(
        "tripRouteRestored",
        tripRoute,
      );
    }

    return res.status(200).json({
      success: true,
      message: "Trip route restore ho gaya",
      data: tripRoute,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Trip route restore karte waqt kuch galat ho gaya",
    });
  }
};

/* ------------------------------------------------------------------ */
/* 12. PERMANENT DELETE TRIP ROUTE (super admin use ke liye)          */
/* ------------------------------------------------------------------ */
export const permanentDeleteTripRoute = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid route id" });
    }

    const tripRoute = await TripRoute.findByIdAndDelete(id);
    if (!tripRoute) {
      return res
        .status(404)
        .json({ success: false, message: "Trip route nahi mila" });
    }

    const io = req.app.get("io");
    if (io) {
      io.emit("tripRoutePermanentlyDeleted", { tripRouteId: id });
      io.to(`org_${tripRoute.organizationId}`).emit(
        "tripRoutePermanentlyDeleted",
        {
          tripRouteId: id,
        },
      );
    }

    return res.status(200).json({
      success: true,
      message: "Trip route permanently delete ho gaya",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Trip route permanently delete karte waqt kuch galat ho gaya",
    });
  }
};
