import PartReplacement from "../../../models/User/Maintenance/PartReplacement.js";
import { generateCode } from "../../../controllers/generateCode.js";

export const createPartReplacement = async (req, res) => {
  try {
    const {
      organizationId,
      equipmentId,
      driverId,
      workshopId,
      partName,
      maintenanceDate,
      costOfPart,
      partSerialRefNo,
      quantity,
      partCategory,
      status,
    } = req.body;

    const partReplacementCode = await generateCode(
      organizationId,
      "partReplacement",
      "PR",
    );
    const partReplacement = await PartReplacement.create({
      organizationId,
      partReplacementCode,
      equipmentId,
      driverId,
      workshopId,
      partName,
      maintenanceDate,
      costOfPart,
      partSerialRefNo,
      quantity,
      partCategory,
      status,
    });

    // SOCKET EVENT
    const io = req.app.get("io");
    if (io) io.emit("partReplacementCreated", partReplacement);

    return res.status(201).json({
      success: true,
      message: "Part Replacement created successfully",
      data: partReplacement,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllPartReplacements = async (req, res) => {
  try {
    const { organizationId, equipmentId, driverId, workshopId, status } =
      req.query;

    let filter = {};

    if (organizationId) filter.organizationId = organizationId;
    if (equipmentId) filter.equipmentId = equipmentId;
    if (driverId) filter.driverId = driverId;
    if (workshopId) filter.workshopId = workshopId;
    if (status) filter.status = status;

    const replacements = await PartReplacement.find(filter)
      .populate("organizationId")
      .populate("equipmentId")
      .populate("driverId")
      .populate("workshopId")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: replacements.length,
      data: replacements,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getPartReplacementsByEquipment = async (req, res) => {
  try {
    const { equipmentId } = req.params;

    if (!equipmentId) {
      return res.status(400).json({
        success: false,
        message: "Equipment ID is required",
      });
    }

    const replacements = await PartReplacement.find({
      equipmentId: equipmentId,
    })
      .populate("organizationId")
      .populate("equipmentId")
      .populate("driverId")
      .populate("workshopId")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: replacements.length,
      data: replacements,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getPartReplacementById = async (req, res) => {
  try {
    const { id } = req.params;

    const replacement = await PartReplacement.findById(id)
      .populate("organizationId")
      .populate("equipmentId")
      .populate("driverId")
      .populate("workshopId");

    if (!replacement) {
      return res.status(404).json({
        success: false,
        message: "Part Replacement not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: replacement,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updatePartReplacement = async (req, res) => {
  try {
    const { id } = req.params;

    const updatedReplacement = await PartReplacement.findByIdAndUpdate(
      id,
      req.body,
      {
        new: true,
        runValidators: true,
      },
    )
      .populate("organizationId")
      .populate("equipmentId")
      .populate("driverId")
      .populate("workshopId");

    if (!updatedReplacement) {
      return res.status(404).json({
        success: false,
        message: "Part Replacement not found",
      });
    }

    // SOCKET EVENT
    const io = req.app.get("io");
    if (io) io.emit("partReplacementUpdated", updatedReplacement);

    return res.status(200).json({
      success: true,
      message: "Part Replacement updated successfully",
      data: updatedReplacement,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deletePartReplacement = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedReplacement = await PartReplacement.findByIdAndDelete(id);

    if (!deletedReplacement) {
      return res.status(404).json({
        success: false,
        message: "Part Replacement not found",
      });
    }

    // SOCKET EVENT
    const io = req.app.get("io");
    if (io) io.emit("partReplacementDeleted", id);

    return res.status(200).json({
      success: true,
      message: "Part Replacement deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
