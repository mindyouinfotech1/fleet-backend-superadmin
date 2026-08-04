import mongoose from "mongoose";
import { Training } from "../../../../models/User/Drivers/Others/Training.js";
import { User as BusinessUser } from "../../../../models/SuperAdmin/Auth/Bussiness_User.js";

export const createTraining = async (req, res) => {
  try {
    const {
      organizationId,
      trainingCategoryId,
      trainingFrequency,
    } = req.body;

    if (!organizationId || !trainingCategoryId || !trainingFrequency) {
      return res.status(400).json({
        success: false,
        message: "Required fields are missing",
      });
    }

    const businessUser = await BusinessUser.findById(organizationId);
    if (!businessUser) {
      return res.status(404).json({
        success: false,
        message: "Organization not found",
      });
    }
    const organizationCode = businessUser.organizationCode;

    const training = await Training.create({
      ...req.body,
      organizationCode,
      history: [
        {
          status: req.body.status || "pending",
          changedBy: req.body.createdBy || null,
          reason: "Training record created",
          changedAt: new Date(),
        },
      ],
    });

    // SOCKET EVENT
    const io = req.app.get("io");
    if (io) io.emit("trainingCreated", training);

    return res.status(201).json({
      success: true,
      message: "Training created successfully",
      data: training,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        code: "DUPLICATE_RECORD",
        message:
          "A training record with this Source Name already exists in this organization.",
      });
    }

    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while creating the training.",
    });
  }
};

export const updateTraining = async (req, res) => {
  try {
    const { id } = req.params;

    const existingTraining = await Training.findById(id);

    if (!existingTraining) {
      return res.status(404).json({
        success: false,
        message: "Training not found",
      });
    }

    // Check duplicate trainingSourceName within same organization
    if (req.body.trainingSourceName) {
      const duplicateTraining = await Training.findOne({
        organizationId: existingTraining.organizationId,
        trainingSourceName: req.body.trainingSourceName,
        _id: { $ne: id },
      });

      if (duplicateTraining) {
        return res.status(409).json({
          success: false,
          code: "DUPLICATE_RECORD",
          message:
            "A training record with this Source Name already exists in this organization.",
        });
      }
    }

    const updatedTraining = await Training.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    // SOCKET EVENT
    const io = req.app.get("io");
    if (io) io.emit("trainingUpdated", updatedTraining);

    return res.status(200).json({
      success: true,
      message: "Training updated successfully",
      data: updatedTraining,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        code: "DUPLICATE_RECORD",
        message:
          "A training record with this Source Name already exists in this organization.",
      });
    }

    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while updating the training.",
    });
  }
};

export const getAllTrainings = async (req, res) => {
  try {
    const { organizationId, trainingCategoryId, status } = req.query;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: "organizationId is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(organizationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid organizationId",
      });
    }

    const filter = {
      organizationId,
      isDeleted: false,
    };

    if (trainingCategoryId) filter.trainingCategoryId = trainingCategoryId;
    if (status) filter.status = status;

    const trainings = await Training.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: trainings.length,
      data: trainings,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching trainings",
      error: error.message,
    });
  }
};

export const getTrainingById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid training ID",
      });
    }

    const training = await Training.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(id),
        },
      },

      // Verified By (User) Lookup
      {
        $lookup: {
          from: "users",
          localField: "verifiedBy",
          foreignField: "_id",
          as: "verifiedByData",
        },
      },

      {
        $addFields: {
          verifiedByUser: {
            $ifNull: [{ $arrayElemAt: ["$verifiedByData", 0] }, null],
          },
        },
      },

      {
        $project: {
          verifiedByData: 0,
        },
      },
    ]);

    if (!training.length) {
      return res.status(404).json({
        success: false,
        message: "Training not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: training[0],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching training",
      error: error.message,
    });
  }
};

export const deleteTraining = async (req, res) => {
  try {
    const { id } = req.params;
    const { deletedBy } = req.body;

    const training = await Training.findById(id);

    if (!training) {
      return res.status(404).json({
        success: false,
        message: "Training not found",
      });
    }

    // SOFT DELETE
    training.isDeleted = true;
    training.deletedBy = deletedBy || null;
    training.deletedAt = new Date();
    await training.save();

    // SOCKET EVENT
    const io = req.app.get("io");
    if (io) io.emit("trainingDeleted", id);

    return res.status(200).json({
      success: true,
      message: "Training deleted successfully (soft delete)",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error deleting training",
      error: error.message,
    });
  }
};

export const changeTrainingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, changedBy, reason } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    // NOTE: adjust this list to match your actual training workflow statuses
    const allowedStatuses = [
      "pending",
      "under_review",
      "approved",
      "rejected",
      "closed",
    ];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Use one of: ${allowedStatuses.join(", ")}`,
      });
    }

    const training = await Training.findById(id);

    if (!training) {
      return res.status(404).json({
        success: false,
        message: "Training not found",
      });
    }

    training.status = status;
    training.history.push({
      status,
      changedBy: changedBy || null,
      reason: reason || "Status updated",
      changedAt: new Date(),
    });

    await training.save();

    // SOCKET EVENT
    const io = req.app.get("io");
    if (io) io.emit("trainingStatusChanged", training);

    return res.status(200).json({
      success: true,
      message: "Training status updated successfully",
      data: training,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error updating training status",
      error: error.message,
    });
  }
};

export const verifyTraining = async (req, res) => {
  try {
    const { id } = req.params;
    const { verifiedBy } = req.body;

    const training = await Training.findById(id);

    if (!training) {
      return res.status(404).json({
        success: false,
        message: "Training not found",
      });
    }

    // TOGGLE: agar already verified hai to isi API se un-verify ho jayega,
    // warna verify ho jayega (same endpoint / same controller)
    if (training.isVerified) {
      training.isVerified = false;
      training.verifiedBy = null;
      training.verifiedAt = null;
      training.history.push({
        status: "verification_cancelled",
        changedBy: verifiedBy || null,
        reason: "Verification cancelled",
        changedAt: new Date(),
      });

      await training.save();

      const io = req.app.get("io");
      if (io) io.emit("trainingVerified", training);

      return res.status(200).json({
        success: true,
        message: "Training verification cancelled successfully",
        data: training,
      });
    }

    if (!verifiedBy) {
      return res.status(400).json({
        success: false,
        message: "verifiedBy is required",
      });
    }

    training.isVerified = true;
    training.verifiedBy = verifiedBy;
    training.verifiedAt = new Date();
    training.rejectionReason = null;
    training.history.push({
      status: "verified",
      changedBy: verifiedBy,
      reason: "Training record verified",
      changedAt: new Date(),
    });

    await training.save();

    // SOCKET EVENT
    const io = req.app.get("io");
    if (io) io.emit("trainingVerified", training);

    return res.status(200).json({
      success: true,
      message: "Training verified successfully",
      data: training,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error verifying training",
      error: error.message,
    });
  }
};
