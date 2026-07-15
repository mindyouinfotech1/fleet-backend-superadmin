import { Maintenance } from "../../../models/User/Maintenance/maintenanceDue.js";
import mongoose from "mongoose";
import { generateCode } from "../../../controllers/generateCode.js";

export const createMaintenance = async (req, res) => {
  try {
    const payload = req.body;
    // console.log("maintenance payload", payload);

    const maintenanceDueCode = await generateCode(
      payload.organizationId,
      "maintenance",
      "MDC",
    );
    const data = await Maintenance.create({
      ...payload,
      maintenanceDueCode,
      history: [
        {
          status: "pending",
          changedBy: req.user?._id || null,
          reason: "Created",
        },
      ],
    });

    return res.status(201).json({
      success: true,
      message: "Maintenance created successfully",
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllMaintenance = async (req, res) => {
  try {
    const { organizationId, equipment, status, isDeleted } = req.query;

    const filter = {};

    if (organizationId) filter.organizationId = organizationId;
    if (equipment) filter.equipment = equipment;
    if (status) filter.status = status;

    filter.isDeleted = isDeleted === "true" ? true : false;

    const data = await Maintenance.find(filter)
      .populate("organizationId")
      .populate("equipment")
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

export const getMaintenanceByEquipment = async (req, res) => {
  try {
    const { equipmentId } = req.params;

    const data = await Maintenance.find({
      equipment: equipmentId,
      isDeleted: false,
    })
      .populate("organizationId")
      .populate("equipment")
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

export const getMaintenanceById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID",
      });
    }

    const data = await Maintenance.findById(id)
      .populate("organizationId")
      .populate("equipment")
      .populate("verifiedBy");

    if (!data || data.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Maintenance not found",
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

export const updateMaintenance = async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await Maintenance.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true },
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Maintenance not found",
      });
    }

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

export const deleteMaintenance = async (req, res) => {
  try {
    const { id } = req.params;

    const data = await Maintenance.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true },
    );

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Maintenance not found",
      });
    }

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

export const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    const allowedStatus = [
      "pending",
      "in_progress",
      "approved",
      "rejected",
      "completed",
      "cancelled",
    ];

    if (!allowedStatus.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const maintenance = await Maintenance.findById(id);

    if (!maintenance) {
      return res.status(404).json({
        success: false,
        message: "Maintenance not found",
      });
    }

    maintenance.status = status;

    maintenance.history.push({
      status,
      changedBy: req.user?._id,
      reason: reason || "Status updated",
    });

    await maintenance.save();

    return res.status(200).json({
      success: true,
      message: "Status updated successfully",
      data: maintenance,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const verifyMaintenance = async (req, res) => {
  try {
    const { id } = req.params;

    const data = await Maintenance.findById(id);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Maintenance not found",
      });
    }

    data.isVerified = true;
    data.verifiedBy = req.user?._id;
    data.verifiedAt = new Date();

    data.status = "approved";

    data.history.push({
      status: "approved",
      changedBy: req.user?._id,
      reason: "Verified by admin",
    });

    await data.save();

    return res.status(200).json({
      success: true,
      message: "Maintenance verified successfully",
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
