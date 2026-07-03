import TyreReplacement from "../../../models/User/Maintenance/TyreReplacement.js";

/**
 * CREATE Tyre Replacement
 */
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

    const newEntry = await TyreReplacement.create({
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

/**
 * GET ALL
 */
export const getAllTyreReplacements = async (req, res) => {
  try {
    const { organizationId, equipmentId, driverId, workshopId } = req.query;

    let filter = {};

    if (organizationId) filter.organizationId = organizationId;
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

/**
 * GET BY ID
 */
export const getTyreReplacementById = async (req, res) => {
  try {
    const data = await TyreReplacement.findById(req.params.id)
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

/**
 * UPDATE
 */
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

/**
 * DELETE
 */
export const deleteTyreReplacement = async (req, res) => {
  try {
    const deleted = await TyreReplacement.findByIdAndDelete(req.params.id);

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
      message: "Deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
