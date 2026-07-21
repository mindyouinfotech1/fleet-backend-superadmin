import { Hotel } from "../../../models/User/Work_Order_Trip/Hotel.js";
import { Trip } from "../../../models/User/Work_Order_Trip/Trip.js";

// Create Hotel

export const createHotel = async (req, res) => {
  try {
    const {
      tripId,
      hotelName,
      address,
      latitude,
      longitude,
      checkIn,
      checkOut,
      bookingId,
      roomType,
      numberOfRooms,
      numberOfGuests,
      amount,
      paymentStatus,
      bookingStatus,
      contactPerson,
      contactNumber,
      email,
      remarks,
    } = req.body;

    const trip = await Trip.findById(tripId).select("organizationId");

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Trip not found",
      });
    }

    const receiptDocument = req.file?.path || "";

    const hotel = await Hotel.create({
      organizationId: trip.organizationId,
      tripId,

      hotelName,
      address,

      latitude,
      longitude,

      checkIn,
      checkOut,

      receiptDocument,

      bookingId,

      roomType,

      numberOfRooms,
      numberOfGuests,

      amount,

      paymentStatus,
      bookingStatus,

      contactPerson,
      contactNumber,
      email,

      remarks,
    });

    const io = req.app.get("io");

    if (io) {
      io.emit("hotelCreated", hotel);
    }

    return res.status(201).json({
      success: true,

      message: "Hotel created successfully",

      data: hotel,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,

      message: error.message,
    });
  }
};

// Get All Hotels
export const getAllHotels = async (req, res) => {
  try {
    const { organizationId } = req.query;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: "organizationId is required",
      });
    }

    const hotels = await Hotel.find({
      organizationId,
      isDeleted: false,
    })
      .populate({
        path: "tripId",
        select: "tripCode", // sirf tripCode return hoga
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: hotels,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get Hotels By Trip

export const getHotelsByTrip = async (req, res) => {
  try {
    const organizationId = req.query.organizationId || req.user?.organizationId;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: "organizationId is required",
      });
    }

    const hotels = await Hotel.find({
      tripId: req.params.tripId,
      organizationId,
      isDeleted: false,
    })
      .populate("tripId", "tripName tripCode")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: hotels,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get Hotel By Id

export const getHotelById = async (req, res) => {
  try {
    const organizationId = req.query.organizationId || req.user?.organizationId;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: "organizationId is required",
      });
    }

    const hotel = await Hotel.findOne({
      _id: req.params.id,
      organizationId,
      isDeleted: false,
    }).populate("tripId", "tripName tripCode");

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: hotel,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update Hotel
export const updateHotel = async (req, res) => {
  try {
    const updateData = {
      ...req.body,
    };

    if (req.file) {
      updateData.receiptDocument = req.file.path;
    }

    const hotel = await Hotel.findOneAndUpdate(
      {
        _id: req.params.id,
        isDeleted: false,
      },
      {
        $set: updateData,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found",
      });
    }

    const io = req.app.get("io");

    if (io) {
      io.emit("hotelUpdated", hotel);
    }

    return res.status(200).json({
      success: true,
      message: "Hotel updated successfully",
      data: hotel,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// Delete Hotel
export const deleteHotel = async (req, res) => {
  try {
    const hotel = await Hotel.findOneAndUpdate(
      {
        _id: req.params.id,
        isDeleted: false,
      },
      {
        $set: {
          isDeleted: true,
        },
      },
      {
        new: true,
      },
    );

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found",
      });
    }

    const io = req.app.get("io");

    if (io) {
      io.emit("hotelDeleted", hotel._id);
    }

    return res.status(200).json({
      success: true,
      message: "Hotel deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
