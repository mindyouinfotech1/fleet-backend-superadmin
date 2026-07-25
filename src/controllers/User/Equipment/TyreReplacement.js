import TyreReplacement from "../../../models/User/Maintenance/TyreReplacement.js";
import { generateCode } from "../../../controllers/generateCode.js";

export const createTyreReplacement = async (req, res) => {
  try {
    const {
      organizationId,
      equipmentId,
      driverId,
      workshopId,
      tyreName,
      wheelPosition,
      tyreSerialNumber,
      costOfTyre,
      dateOfReplacement,
      tyreSize,
      odometerReadingAtReplacement,
    } = req.body;

    const tyreReplacementCode = await generateCode(
      organizationId,
      "tyreReplacement",
      "TY",
    );

    const newEntry = await TyreReplacement.create({
      organizationId,
      tyreReplacementCode,
      equipmentId,
      driverId,
      workshopId,
      tyreName,
      wheelPosition,
      tyreSerialNumber,
      costOfTyre,
      dateOfReplacement,
      tyreSize,
      odometerReadingAtReplacement,
    });

    const io = req.app.get("io");
    if (io) io.emit("tyreReplacementCreated", newEntry);

    return res.status(201).json({
      success: true,
      message: "Tyre replacement created successfully",
      data: newEntry,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllTyreReplacements = async (req, res) => {
  try {
    const { organizationId, equipmentId, driverId, workshopId } = req.query;

    let filter = { isDeleted: false, organizationId };

    // if (organizationId) filter.organizationId = organizationId;
    if (equipmentId) filter.equipmentId = equipmentId;
    if (driverId) filter.driverId = driverId;
    if (workshopId) filter.workshopId = workshopId;

    const data = await TyreReplacement.find(filter)
      .populate("organizationId")
      .populate("equipmentId")
      .populate("driverId")
      .populate("workshopId")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getTyreReplacementsByEquipment = async (req, res) => {
  try {
    const { equipmentId } = req.params;

    if (!equipmentId) {
      return res.status(400).json({
        success: false,
        message: "Equipment ID is required",
      });
    }

    const data = await TyreReplacement.find({
      equipmentId: equipmentId,
      isDeleted: false,
    })
      .populate("organizationId")
      .populate("equipmentId")
      .populate("driverId")
      .populate("workshopId")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getTyreReplacementById = async (req, res) => {
  try {
    const data = await TyreReplacement.findOne({
      _id: req.params.id,
      isDeleted: false,
    })
      .populate("organizationId")
      .populate("equipmentId")
      .populate("driverId")
      .populate("workshopId");

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Tyre replacement not found",
      });
    }

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateTyreReplacement = async (req, res) => {
  try {
    const updated = await TyreReplacement.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true },
    )
      .populate("organizationId")
      .populate("equipmentId")
      .populate("driverId")
      .populate("workshopId");

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Tyre replacement not found",
      });
    }

    const io = req.app.get("io");
    if (io) io.emit("tyreReplacementUpdated", updated);

    return res.status(200).json({
      success: true,
      message: "Updated successfully",
      data: updated,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteTyreReplacement = async (req, res) => {
  try {
    const deleted = await TyreReplacement.findByIdAndUpdate(
      req.params.id,
      {
        isDeleted: true,
        deletedAt: new Date(),
      },
      { new: true },
    );

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Tyre replacement not found",
      });
    }

    const io = req.app.get("io");
    if (io) io.emit("tyreReplacementDeleted", req.params.id);

    return res.status(200).json({
      success: true,
      message: "Deleted successfully (soft delete)",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const restoreTyreReplacement = async (req, res) => {
  try {
    const restored = await TyreReplacement.findByIdAndUpdate(
      req.params.id,
      {
        isDeleted: false,
        deletedAt: null,
      },
      { new: true },
    );

    if (!restored) {
      return res.status(404).json({
        success: false,
        message: "Tyre replacement not found",
      });
    }

    const io = req.app.get("io");
    if (io) io.emit("tyreReplacementRestored", restored);

    return res.status(200).json({
      success: true,
      message: "Restored successfully",
      data: restored,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
