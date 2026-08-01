import mongoose from "mongoose";
import { DrivingDisqualification } from "../../../../models/User/Drivers/Others/DrivingDisqualification.js";
import { User as BusinessUser } from "../../../../models/SuperAdmin/Auth/Bussiness_User.js";
import { Driver } from "../../../../models/User/Drivers/Driver.js";
import { generateCode } from "../../../../controllers/generateCode.js";

export const createDrivingDisqualification = async (req, res) => {
  try {
    const {
      organizationId,
      individualId,
      licenseId,
      reason,
      disqualificationDate,
      policeReportId,
    } = req.body;

    if (
      !organizationId ||
      !individualId ||
      !licenseId ||
      !reason ||
      !disqualificationDate
    ) {
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

    const driverExists = await Driver.findById(individualId);
    if (!driverExists) {
      return res.status(404).json({
        success: false,
        message: "Individual (Driver) not found",
      });
    }

    if (policeReportId) {
      const alreadyExists = await DrivingDisqualification.findOne({
        organizationId,
        policeReportId,
      });
      if (alreadyExists) {
        return res.status(409).json({
          success: false,
          message:
            "A disqualification record with this Police Report ID already exists in this organization",
        });
      }
    }

    const DriverDisqualificationCode = await generateCode(
      organizationId,
      "DrivingDisqualification",
      "DIR-DISQ",
    );

    const disqualification = await DrivingDisqualification.create({
      ...req.body,
      organizationCode,
      DriverDisqualificationCode,
      history: [
        {
          status: req.body.status || "pending",
          changedBy: req.body.createdBy || null,
          reason: "Disqualification record created",
          changedAt: new Date(),
        },
      ],
    });

    // SOCKET EVENT
    const io = req.app.get("io");
    if (io) io.emit("drivingDisqualificationCreated", disqualification);

    return res.status(201).json({
      success: true,
      message: "Driving disqualification created successfully",
      data: disqualification,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        code: "DUPLICATE_RECORD",
        message:
          "A disqualification record with this Police Report ID already exists in this organization.",
      });
    }

    console.error(error);

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while creating the driving disqualification.",
    });
  }
};

export const updateDrivingDisqualification = async (req, res) => {
  try {
    const { id } = req.params;

    const existingDisqualification = await DrivingDisqualification.findById(id);

    if (!existingDisqualification) {
      return res.status(404).json({
        success: false,
        message: "Driving disqualification not found",
      });
    }

    // Check duplicate policeReportId within same organization
    if (req.body.policeReportId) {
      const duplicateDisqualification = await DrivingDisqualification.findOne({
        organizationId: existingDisqualification.organizationId,
        policeReportId: req.body.policeReportId,
        _id: { $ne: id }, // current record ko ignore karo
      });

      if (duplicateDisqualification) {
        return res.status(409).json({
          success: false,
          code: "DUPLICATE_RECORD",
          message:
            "A disqualification record with this Police Report ID already exists in this organization.",
        });
      }
    }

    const updatedDisqualification =
      await DrivingDisqualification.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true,
      });

    // SOCKET EVENT
    const io = req.app.get("io");
    if (io) io.emit("drivingDisqualificationUpdated", updatedDisqualification);

    return res.status(200).json({
      success: true,
      message: "Driving disqualification updated successfully",
      data: updatedDisqualification,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        code: "DUPLICATE_RECORD",
        message:
          "A disqualification record with this Police Report ID already exists in this organization.",
      });
    }

    console.error(error);

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while updating the driving disqualification.",
    });
  }
};

export const getAllDrivingDisqualifications = async (req, res) => {
  try {
    const { organizationId, individualId, status } = req.query;

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

    if (individualId) filter.individualId = individualId;
    if (status) filter.status = status;

    const disqualifications = await DrivingDisqualification.find(filter)
      .populate("individualId", "firstName lastName email phoneNumber")
      // .populate("licenseId")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: disqualifications.length,
      data: disqualifications,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching driving disqualifications",
      error: error.message,
    });
  }
};

export const getDrivingDisqualificationById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid disqualification ID",
      });
    }

    const disqualification = await DrivingDisqualification.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(id),
        },
      },

      // Individual (Driver) Lookup
      {
        $lookup: {
          from: "drivers",
          localField: "individualId",
          foreignField: "_id",
          as: "individualData",
        },
      },

      // License Lookup
      {
        $lookup: {
          from: "licenses",
          localField: "licenseId",
          foreignField: "_id",
          as: "licenseData",
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
          individual: {
            $ifNull: [{ $arrayElemAt: ["$individualData", 0] }, null],
          },
          license: {
            $ifNull: [{ $arrayElemAt: ["$licenseData", 0] }, null],
          },
          verifiedByUser: {
            $ifNull: [{ $arrayElemAt: ["$verifiedByData", 0] }, null],
          },
        },
      },

      {
        $project: {
          individualData: 0,
          licenseData: 0,
          verifiedByData: 0,
        },
      },
    ]);

    if (!disqualification.length) {
      return res.status(404).json({
        success: false,
        message: "Driving disqualification not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: disqualification[0],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching driving disqualification",
      error: error.message,
    });
  }
};

export const deleteDrivingDisqualification = async (req, res) => {
  try {
    const { id } = req.params;
    const { deletedBy } = req.body;

    const disqualification = await DrivingDisqualification.findById(id);

    if (!disqualification) {
      return res.status(404).json({
        success: false,
        message: "Driving disqualification not found",
      });
    }

    // SOFT DELETE
    disqualification.isDeleted = true;
    disqualification.deletedBy = deletedBy || null;
    disqualification.deletedAt = new Date();
    await disqualification.save();

    // SOCKET EVENT
    const io = req.app.get("io");
    if (io) io.emit("drivingDisqualificationDeleted", id);

    return res.status(200).json({
      success: true,
      message: "Driving disqualification deleted successfully (soft delete)",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error deleting driving disqualification",
      error: error.message,
    });
  }
};

export const changeDrivingDisqualificationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, changedBy, reason } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    // NOTE: adjust this list to match your actual disqualification workflow statuses
    const allowedStatuses = [
      "pending",
      "active",
      "appealed",
      "reinstated",
      "expired",
    ];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Use one of: ${allowedStatuses.join(", ")}`,
      });
    }

    const disqualification = await DrivingDisqualification.findById(id);

    if (!disqualification) {
      return res.status(404).json({
        success: false,
        message: "Driving disqualification not found",
      });
    }

    disqualification.status = status;
    disqualification.history.push({
      status,
      changedBy: changedBy || null,
      reason: reason || "Status updated",
      changedAt: new Date(),
    });

    await disqualification.save();

    // SOCKET EVENT
    const io = req.app.get("io");
    if (io) io.emit("drivingDisqualificationStatusChanged", disqualification);

    return res.status(200).json({
      success: true,
      message: "Driving disqualification status updated successfully",
      data: disqualification,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error updating driving disqualification status",
      error: error.message,
    });
  }
};

export const verifyDrivingDisqualification = async (req, res) => {
  try {
    const { id } = req.params;
    const { verifiedBy } = req.body;

    const disqualification = await DrivingDisqualification.findById(id);

    if (!disqualification) {
      return res.status(404).json({
        success: false,
        message: "Driving disqualification not found",
      });
    }

    // TOGGLE: agar already verified hai to isi API se un-verify ho jayega,
    // warna verify ho jayega (same endpoint / same controller)
    if (disqualification.isVerified) {
      disqualification.isVerified = false;
      disqualification.verifiedBy = null;
      disqualification.verifiedAt = null;
      disqualification.history.push({
        status: "verification_cancelled",
        changedBy: verifiedBy || null,
        reason: "Verification cancelled",
        changedAt: new Date(),
      });

      await disqualification.save();

      const io = req.app.get("io");
      if (io) io.emit("drivingDisqualificationVerified", disqualification);

      return res.status(200).json({
        success: true,
        message: "Driving disqualification verification cancelled successfully",
        data: disqualification,
      });
    }

    if (!verifiedBy) {
      return res.status(400).json({
        success: false,
        message: "verifiedBy is required",
      });
    }

    disqualification.isVerified = true;
    disqualification.verifiedBy = verifiedBy;
    disqualification.verifiedAt = new Date();
    disqualification.rejectionReason = null;
    disqualification.history.push({
      status: "verified",
      changedBy: verifiedBy,
      reason: "Disqualification record verified",
      changedAt: new Date(),
    });

    await disqualification.save();

    // SOCKET EVENT
    const io = req.app.get("io");
    if (io) io.emit("drivingDisqualificationVerified", disqualification);

    return res.status(200).json({
      success: true,
      message: "Driving disqualification verified successfully",
      data: disqualification,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error verifying driving disqualification",
      error: error.message,
    });
  }
};
