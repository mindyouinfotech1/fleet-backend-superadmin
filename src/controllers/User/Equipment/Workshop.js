import Workshop from "../../../models/User/Equipment/Workshop.js";
import country from "../../../models/Address/country.js";
import state from "../../../models/Address/state.js";
import city from "../../../models/Address/city.js";
import { generateCode } from "../../../controllers/generateCode.js";
import mongoose from "mongoose";

export const createWorkshop = async (req, res) => {
  try {
    const {
      organizationId,
      workshopName,
      workshopOwner,
      workshopEmail,
      workshopPhone,
      country,
      state,
      city,
      address,
      status,
    } = req.body;

    const workshopCode = await generateCode(organizationId, "workshop", "WS");

    const workshop = await Workshop.create({
      organizationId,
      workshopCode,
      workshopName,
      workshopOwner,
      workshopEmail,
      workshopPhone,
      country,
      state,
      city,
      address,
      status,
    });

    //  SOCKET EVENT EMIT
    const io = req.app.get("io");
    if (io) io.emit("workshopCreated", workshop);

    return res.status(201).json({
      success: true,
      message: "Workshop created successfully",
      data: workshop,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllWorkshops = async (req, res) => {
  try {
    const { organizationId } = req.query;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: "organizationId is required",
      });
    }

    const workshops = await Workshop.aggregate([
      {
        $match: {
          organizationId: new mongoose.Types.ObjectId(organizationId),
          isDeleted: false,
        },
      },

      // Country lookup
      {
        $lookup: {
          from: "countries",
          localField: "country",
          foreignField: "_id",
          as: "countryData",
        },
      },

      // State lookup
      {
        $lookup: {
          from: "states",
          localField: "state",
          foreignField: "_id",
          as: "stateData",
        },
      },

      // City lookup
      {
        $lookup: {
          from: "cities",
          localField: "city",
          foreignField: "_id",
          as: "cityData",
        },
      },

      // Clean response
      {
        $addFields: {
          country: {
            $ifNull: [{ $arrayElemAt: ["$countryData.name", 0] }, null],
          },

          state: {
            $ifNull: [{ $arrayElemAt: ["$stateData.name", 0] }, null],
          },

          city: {
            $ifNull: [{ $arrayElemAt: ["$cityData.name", 0] }, null],
          },
        },
      },

      // Remove extra lookup arrays
      {
        $project: {
          countryData: 0,
          stateData: 0,
          cityData: 0,
        },
      },

      {
        $sort: {
          createdAt: -1,
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      count: workshops.length,
      data: workshops,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getWorkshopById = async (req, res) => {
  try {
    const { id } = req.params;

    const workshop = await Workshop.findById(id).populate("organizationId");

    if (!workshop) {
      return res.status(404).json({
        success: false,
        message: "Workshop not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: workshop,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateWorkshop = async (req, res) => {
  try {
    const { id } = req.params;

    const updatedWorkshop = await Workshop.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedWorkshop) {
      return res.status(404).json({
        success: false,
        message: "Workshop not found",
      });
    }

    //  SOCKET EVENT EMIT
    const io = req.app.get("io");
    if (io) io.emit("workshopUpdated", updatedWorkshop);

    return res.status(200).json({
      success: true,
      message: "Workshop updated successfully",
      data: updatedWorkshop,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteWorkshop = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedWorkshop = await Workshop.findByIdAndUpdate(
      id,
      {
        isDeleted: true,
        deletedAt: new Date(),
      },
      { new: true },
    );

    if (!deletedWorkshop) {
      return res.status(404).json({
        success: false,
        message: "Workshop not found",
      });
    }

    // SOCKET EVENT EMIT
    const io = req.app.get("io");
    if (io) io.emit("workshopDeleted", id);

    return res.status(200).json({
      success: true,
      message: "Workshop deleted successfully",
      data: deletedWorkshop,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const restoreWorkshop = async (req, res) => {
  try {
    const { id } = req.params;

    const workshop = await Workshop.findByIdAndUpdate(
      id,
      {
        isDeleted: false,
        deletedAt: null,
      },
      { new: true },
    );

    if (!workshop) {
      return res.status(404).json({
        success: false,
        message: "Workshop not found",
      });
    }

    //  SOCKET EVENT EMIT
    const io = req.app.get("io");
    if (io) io.emit("workshopRestored", workshop);

    return res.status(200).json({
      success: true,
      message: "Workshop restored successfully",
      data: workshop,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
