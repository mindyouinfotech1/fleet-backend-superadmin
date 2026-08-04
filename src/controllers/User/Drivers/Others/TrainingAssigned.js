import mongoose from "mongoose";
import { TrainingAssigned } from "../../../../models/User/Drivers/Others/TrainingAssigned.js";
import { Driver } from "../../../../models/User/Drivers/Driver.js";
import { Training } from "../../../../models/User/Drivers/Others/Training.js";
import { generateCode } from "../../../../controllers/generateCode.js";

export const createTrainingAssigned = async (req, res) => {
  try {
    const {
      organizationId,
      driverId,
      trainingId,
      trainingDueDate,
      conductedStatus,
      trainingResult,
    } = req.body;

    if (!driverId || !trainingId) {
      return res.status(400).json({
        success: false,
        message: "Select Member and Select Created Training are required",
      });
    }

    // Driver details fetch (organizationId waha se lenge, jaise DriverLicense me)
    const driver = await Driver.findById(driverId).select(
      "organizationId organizationCode DriverCodeByOrganization",
    );

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Member (Driver) not found",
      });
    }

    // Training exists check
    const trainingExists = await Training.findById(trainingId);
    if (!trainingExists) {
      return res.status(404).json({
        success: false,
        message: "Training not found",
      });
    }

    const signatureImage =
      req.file?.path || req.files?.signatureImage?.[0]?.path || null;

    const TrainingAssignedCode = await generateCode(
      organizationId,
      "TrainingAssigned",
      "TRA-ASS",
    );

    const trainingAssigned = await TrainingAssigned.create({
      driverId,
      trainingId,
      trainingDueDate,
      trainingAssigneCode: TrainingAssignedCode,
      conductedStatus,
      trainingResult,
      signatureImage,
      organizationId: driver.organizationId,
      history: [
        {
          status: req.body.status || "pending",
          changedBy: req.body.createdBy || null,
          reason: "Training assigned record created",
          changedAt: new Date(),
        },
      ],
    });

    // SOCKET EVENT
    const io = req.app.get("io");
    if (io) io.emit("trainingAssignedCreated", trainingAssigned);

    return res.status(201).json({
      success: true,
      message: "Training assigned successfully",
      data: trainingAssigned,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateTrainingAssigned = async (req, res) => {
  try {
    const updateData = { ...req.body };

    if (req.file?.path) {
      updateData.signatureImage = req.file.path;
    } else if (req.files?.signatureImage?.[0]) {
      updateData.signatureImage = req.files.signatureImage[0].path;
    }

    const updated = await TrainingAssigned.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      updateData,
      { new: true, runValidators: true },
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Training assigned record not found",
      });
    }

    // SOCKET EVENT
    const io = req.app.get("io");
    if (io) io.emit("trainingAssignedUpdated", updated);

    return res.status(200).json({
      success: true,
      message: "Training assigned record updated successfully",
      data: updated,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllTrainingAssigned = async (req, res) => {
  try {
    const { driverId, trainingId, status, organizationId } = req.query;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: "organizationId is required",
      });
    }

    const filter = {
      isDeleted: false,
      organizationId,
    };

    if (driverId) filter.driverId = driverId;
    if (trainingId) filter.trainingId = trainingId;
    if (status) filter.status = status;

    const records = await TrainingAssigned.find(filter)
      .populate("driverId")
      .populate("trainingId")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getTrainingAssignedById = async (req, res) => {
  try {
    const record = await TrainingAssigned.findOne({
      _id: req.params.id,
      isDeleted: false,
    })
      .populate("driverId")
      .populate("trainingId")
      .populate("verifiedBy");

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Training assigned record not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: record,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllTrainingAssignedByDriver = async (req, res) => {
  try {
    const { driverId } = req.params;
    const { trainingId, status } = req.query;

    if (!mongoose.Types.ObjectId.isValid(driverId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid driverId",
      });
    }

    const filter = {
      isDeleted: false,
      driverId,
    };

    if (trainingId) filter.trainingId = trainingId;
    if (status) filter.status = status;

    const records = await TrainingAssigned.find(filter)
      .populate("driverId")
      .populate("trainingId")
      .populate("verifiedBy")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteTrainingAssigned = async (req, res) => {
  try {
    const deleted = await TrainingAssigned.findOneAndUpdate(
      { _id: req.params.id },
      {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: req.body.deletedBy || null,
      },
      { new: true },
    );

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Training assigned record not found",
      });
    }

    // SOCKET EVENT
    const io = req.app.get("io");
    if (io) io.emit("trainingAssignedDeleted", req.params.id);

    return res.status(200).json({
      success: true,
      message: "Training assigned record deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const verifyTrainingAssigned = async (req, res) => {
  try {
    const adminId = req.user?._id || req.body.verifiedBy;

    const record = await TrainingAssigned.findOne({
      _id: req.params.id,
      isDeleted: false,
    });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Training assigned record not found",
      });
    }

    // Toggle verification
    record.isVerified = !record.isVerified;

    if (record.isVerified) {
      record.verifiedBy = adminId;
      record.verifiedAt = new Date();
      record.rejectionReason = null;
      record.history.push({
        status: "verified",
        changedBy: adminId || null,
        reason: "Training assigned record verified",
        changedAt: new Date(),
      });
    } else {
      record.verifiedBy = null;
      record.verifiedAt = null;
      record.history.push({
        status: "verification_cancelled",
        changedBy: adminId || null,
        reason: "Verification cancelled",
        changedAt: new Date(),
      });
    }

    await record.save();

    // SOCKET EVENT
    const io = req.app.get("io");
    if (io) io.emit("trainingAssignedVerified", record);

    return res.status(200).json({
      success: true,
      message: record.isVerified
        ? "Training assigned record verified successfully"
        : "Training assigned verification cancelled successfully",
      data: record,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateTrainingAssignedStatus = async (req, res) => {
  try {
    const { status, changedBy, reason } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    const record = await TrainingAssigned.findOne({
      _id: req.params.id,
      isDeleted: false,
    });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Training assigned record not found",
      });
    }

    record.status = status;
    record.history.push({
      status,
      changedBy: changedBy || null,
      reason: reason || "Status updated",
      changedAt: new Date(),
    });

    await record.save();

    // SOCKET EVENT
    const io = req.app.get("io");
    if (io) io.emit("trainingAssignedStatusChanged", record);

    return res.status(200).json({
      success: true,
      message: "Status updated successfully",
      data: record,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
