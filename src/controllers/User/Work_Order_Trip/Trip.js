import mongoose from "mongoose";
import { Trip } from "../../../models/User/Work_Order_Trip/Trip.js";
import { User } from "../../../models/SuperAdmin/Auth/Bussiness_User.js";
import { WorkOrder } from "../../../models/User/Work_Order_Trip/WorkOrder.js";
import { Equipment } from "../../../models/User/Equipment/Equipment.js";
import { Driver } from "../../../models/User/Drivers/Driver.js";
import { generateCode } from "../../../controllers/generateCode.js";

/* -------------------------------------------------------------------------- */
/*  CREATE TRIP                                                               */
/* -------------------------------------------------------------------------- */
export const createTrip = async (req, res) => {
  try {
    const {
      organizationId,
      workOrderIds,
      equipmentIds,
      primaryDriver,
      secondaryDriverIds,
      tripName,
      tripType,
      expectedStartDateTime,
      expectedEndDateTime,
      startLocation,
      endLocation,
      distance,
      speedLimit,
      remarks,
    } = req.body;

    // 1. Required fields validation
    if (
      !organizationId ||
      !workOrderIds ||
      // !workOrderIds.length ||
      !equipmentIds ||
      // !equipmentIds.length ||
      !primaryDriver
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Required fields are missing (organizationId, workOrderIds, equipmentIds, primaryDriver)",
      });
    }

   
    // 3. WorkOrders aur Equipments same organization ke hain ya nahi (sanity check)
    const [workOrderCount, equipmentCount, driverExists] = await Promise.all([
      WorkOrder.countDocuments({
        _id: { $in: workOrderIds },
        organizationId,
      }),
      Equipment.countDocuments({
        _id: { $in: equipmentIds },
        organizationId,
      }),
      Driver.findOne({ _id: primaryDriver, organizationId }),
    ]);
  
    if (workOrderCount !== workOrderIds.length) {
      return res.status(400).json({
        success: false,
        message: "One or more workOrderIds are invalid for this organization",
      });
    }

    if (equipmentCount !== equipmentIds.length) {
      return res.status(400).json({
        success: false,
        message: "One or more equipmentIds are invalid for this organization",
      });
    }
    
    if (!driverExists) {
      return res.status(404).json({
        success: false,
        message: "Primary driver not found in this organization",
      });
    }
    
    // 4. Unique tripCode generate karo (organization ke andar)
    const tripCode = await generateCode(organizationId, "trip", "TRP");
  
    // 5. Trip create karo
    const trip = await Trip.create({
      organizationId,
      workOrderIds,
      equipmentIds,
      tripCode,
      tripName,
      tripType,
      primaryDriver,
      secondaryDriverIds,
      expectedStartDateTime,
      expectedEndDateTime,
      startLocation,
      endLocation,
      distance,
      speedLimit,
      remarks,
    });
  
    const populatedTrip = await Trip.findById(trip._id);
    // .populate("workOrderIds")
    // .populate("equipmentIds")
    // .populate("primaryDriver", "-password -showPassword")
    // .populate("secondaryDriverIds", "-password -showPassword");

    // SOCKET EVENT
    const io = req.app.get("io");
    if (io) {
      io.emit("tripCreated", populatedTrip);
      io.to(`org_${organizationId}`).emit("tripCreated", populatedTrip);
    }

    return res.status(201).json({
      success: true,
      message: "Trip created successfully",
      data: populatedTrip,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        code: "DUPLICATE_TRIP_CODE",
        message: "Trip code collision hua hai, phir se try karein",
      });
    }

    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while creating the trip.",
    });
  }
};

/* -------------------------------------------------------------------------- */
/*  GET ALL TRIPS (org-scoped, filters + pagination)                         */
/* -------------------------------------------------------------------------- */
export const getAllTrips = async (req, res) => {
  try {
    const { organizationId } = req.params;
    const {
      tripStatus,
      primaryDriver,
      search,
      page = 1,
      limit = 10,
    } = req.query;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: "organizationId is required",
      });
    }

    const query = { organizationId, isDeleted: false };

    if (tripStatus) query.tripStatus = tripStatus;
    if (primaryDriver) query.primaryDriver = primaryDriver;
    if (search) {
      query.$or = [
        { tripCode: { $regex: search, $options: "i" } },
        { remarks: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [trips, total] = await Promise.all([
      Trip.find(query)
        .populate("workOrderIds")
        .populate("equipmentIds")
        .populate("primaryDriver", "-password -showPassword")
        .populate("secondaryDriverIds", "-password -showPassword")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Trip.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      message: "Trips fetched successfully",
      data: trips,
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
      message: "Something went wrong while fetching trips.",
    });
  }
};

/* -------------------------------------------------------------------------- */
/*  GET SINGLE TRIP BY ID                                                     */
/* -------------------------------------------------------------------------- */
export const getTripById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid trip id",
      });
    }

    const trip = await Trip.findOne({ _id: id, isDeleted: false })
      .populate("workOrderIds")
      .populate("equipmentIds")
      .populate("primaryDriver", "-password -showPassword")
      .populate("secondaryDriverIds", "-password -showPassword")
      .populate("organizationId", "organizationName organizationCode");

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Trip not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Trip fetched successfully",
      data: trip,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching the trip.",
    });
  }
};

/* -------------------------------------------------------------------------- */
/*  UPDATE TRIP                                                               */
/* -------------------------------------------------------------------------- */
export const updateTrip = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid trip id",
      });
    }

    const trip = await Trip.findOne({ _id: id, isDeleted: false });
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Trip not found",
      });
    }

    // tripCode aur organizationId ko direct update na hone do
    const { tripCode, organizationId, isDeleted, ...updateData } = req.body;

    const updatedTrip = await Trip.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("workOrderIds")
      .populate("equipmentIds")
      .populate("primaryDriver", "-password -showPassword")
      .populate("secondaryDriverIds", "-password -showPassword");

    // SOCKET EVENT
    const io = req.app.get("io");
    if (io) {
      io.emit("tripUpdated", updatedTrip);
      io.to(`org_${updatedTrip.organizationId}`).emit(
        "tripUpdated",
        updatedTrip,
      );
    }

    return res.status(200).json({
      success: true,
      message: "Trip updated successfully",
      data: updatedTrip,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while updating the trip.",
    });
  }
};

/* -------------------------------------------------------------------------- */
/*  UPDATE TRIP STATUS (Pending / Ongoing / Completed / Cancelled etc.)      */
/* -------------------------------------------------------------------------- */
export const updateTripStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { tripStatus } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid trip id",
      });
    }

    if (!tripStatus) {
      return res.status(400).json({
        success: false,
        message: "tripStatus is required",
      });
    }

    const trip = await Trip.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { tripStatus },
      { new: true },
    )
      .populate("primaryDriver", "-password -showPassword")
      .populate("secondaryDriverIds", "-password -showPassword");

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Trip not found",
      });
    }

    // SOCKET EVENT — status change alag event se bhejo taaki frontend
    // sirf status listen karke lightweight update kar sake
    const io = req.app.get("io");
    if (io) {
      io.emit("tripStatusChanged", {
        tripId: trip._id,
        tripStatus: trip.tripStatus,
        trip,
      });
      io.to(`org_${trip.organizationId}`).emit("tripStatusChanged", {
        tripId: trip._id,
        tripStatus: trip.tripStatus,
        trip,
      });

      // Driver ko bhi personally notify kar do (agar driver room join karta hai)
      if (trip.primaryDriver?._id) {
        io.to(`driver_${trip.primaryDriver._id}`).emit("tripStatusChanged", {
          tripId: trip._id,
          tripStatus: trip.tripStatus,
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Trip status updated successfully",
      data: trip,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while updating trip status.",
    });
  }
};

/* -------------------------------------------------------------------------- */
/*  SOFT DELETE TRIP                                                          */
/* -------------------------------------------------------------------------- */
export const deleteTrip = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid trip id",
      });
    }

    const trip = await Trip.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { isDeleted: true },
      { new: true },
    );

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Trip not found or already deleted",
      });
    }

    // SOCKET EVENT
    const io = req.app.get("io");
    if (io) {
      io.emit("tripDeleted", { tripId: trip._id });
      io.to(`org_${trip.organizationId}`).emit("tripDeleted", {
        tripId: trip._id,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Trip deleted successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while deleting the trip.",
    });
  }
};

/* -------------------------------------------------------------------------- */
/*  RESTORE SOFT DELETED TRIP                                                 */
/* -------------------------------------------------------------------------- */
export const restoreTrip = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid trip id",
      });
    }

    const trip = await Trip.findOneAndUpdate(
      { _id: id, isDeleted: true },
      { isDeleted: false },
      { new: true },
    );

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Deleted trip not found",
      });
    }

    // SOCKET EVENT
    const io = req.app.get("io");
    if (io) {
      io.emit("tripRestored", trip);
      io.to(`org_${trip.organizationId}`).emit("tripRestored", trip);
    }

    return res.status(200).json({
      success: true,
      message: "Trip restored successfully",
      data: trip,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while restoring the trip.",
    });
  }
};
