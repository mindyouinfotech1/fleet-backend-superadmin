import mongoose from "mongoose";
import { DrivingViolation } from "../../../../models/User/Drivers/Others/DrivingViolation.js";
import { User as BusinessUser } from "../../../../models/SuperAdmin/Auth/Bussiness_User.js";
import { Driver } from "../../../../models/User/Drivers/Driver.js";
import { generateCode } from "../../../../controllers/generateCode.js";

export const createDrivingViolation = async (req, res) => {
  try {
    const {
      organizationId,
      individualId,
      licenseId,
      violationDate,
      policeReportId,
    } = req.body;

    if (!organizationId || !individualId || !licenseId || !violationDate) {
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
      const alreadyExists = await DrivingViolation.findOne({
        organizationId,
        policeReportId,
      });
      if (alreadyExists) {
        return res.status(409).json({
          success: false,
          message:
            "A violation record with this Police Report ID already exists in this organization",
        });
      }
    }

    const DriverViolationCode = await generateCode(
      organizationId,
      "DrivingViolation",
      "DIR-VIOL",
    );

    const violation = await DrivingViolation.create({
      ...req.body,
      organizationCode,
      DriverViolationCode: DriverViolationCode,
      history: [
        {
          status: req.body.status || "pending",
          changedBy: req.body.createdBy || null,
          reason: "Violation record created",
          changedAt: new Date(),
        },
      ],
    });

    // SOCKET EVENT
    const io = req.app.get("io");
    if (io) io.emit("drivingViolationCreated", violation);

    return res.status(201).json({
      success: true,
      message: "Driving violation created successfully",
      data: violation,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        code: "DUPLICATE_RECORD",
        message:
          "A violation record with this Police Report ID already exists in this organization.",
      });
    }

    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while creating the driving violation.",
    });
  }
};

export const updateDrivingViolation = async (req, res) => {
  try {
    const { id } = req.params;

    const existingViolation = await DrivingViolation.findById(id);

    if (!existingViolation) {
      return res.status(404).json({
        success: false,
        message: "Driving violation not found",
      });
    }

    // Check duplicate policeReportId within same organization
    if (req.body.policeReportId) {
      const duplicateViolation = await DrivingViolation.findOne({
        organizationId: existingViolation.organizationId,
        policeReportId: req.body.policeReportId,
        _id: { $ne: id }, // current record ko ignore karo
      });

      if (duplicateViolation) {
        return res.status(409).json({
          success: false,
          code: "DUPLICATE_RECORD",
          message:
            "A violation record with this Police Report ID already exists in this organization.",
        });
      }
    }

    const updatedViolation = await DrivingViolation.findByIdAndUpdate(
      id,
      req.body,
      {
        new: true,
        runValidators: true,
      },
    );

    // SOCKET EVENT
    const io = req.app.get("io");
    if (io) io.emit("drivingViolationUpdated", updatedViolation);

    return res.status(200).json({
      success: true,
      message: "Driving violation updated successfully",
      data: updatedViolation,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        code: "DUPLICATE_RECORD",
        message:
          "A violation record with this Police Report ID already exists in this organization.",
      });
    }

    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while updating the driving violation.",
    });
  }
};

export const getAllDrivingViolations = async (req, res) => {
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

    const violations = await DrivingViolation.find(filter)
      .populate("individualId", "firstName lastName email phoneNumber")
      // .populate("licenseId")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: violations.length,
      data: violations,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching driving violations",
      error: error.message,
    });
  }
};

export const getDrivingViolationById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid violation ID",
      });
    }

    const violation = await DrivingViolation.aggregate([
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

    if (!violation.length) {
      return res.status(404).json({
        success: false,
        message: "Driving violation not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: violation[0],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching driving violation",
      error: error.message,
    });
  }
};

export const deleteDrivingViolation = async (req, res) => {
  try {
    const { id } = req.params;
    const { deletedBy } = req.body;

    const violation = await DrivingViolation.findById(id);

    if (!violation) {
      return res.status(404).json({
        success: false,
        message: "Driving violation not found",
      });
    }

    // SOFT DELETE
    violation.isDeleted = true;
    violation.deletedBy = deletedBy || null;
    violation.deletedAt = new Date();
    await violation.save();

    // SOCKET EVENT
    const io = req.app.get("io");
    if (io) io.emit("drivingViolationDeleted", id);

    return res.status(200).json({
      success: true,
      message: "Driving violation deleted successfully (soft delete)",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error deleting driving violation",
      error: error.message,
    });
  }
};

export const changeDrivingViolationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, changedBy, reason } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    const allowedStatuses = [
      "pending",
      "approved",
      "rejected",
      "disputed",
      "paid",
      "waived",
    ];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Use one of: ${allowedStatuses.join(", ")}`,
      });
    }

    const violation = await DrivingViolation.findById(id);

    if (!violation) {
      return res.status(404).json({
        success: false,
        message: "Driving violation not found",
      });
    }

    violation.status = status;
    violation.history.push({
      status,
      changedBy: changedBy || null,
      reason: reason || "Status updated",
      changedAt: new Date(),
    });

    await violation.save();

    // SOCKET EVENT
    const io = req.app.get("io");
    if (io) io.emit("drivingViolationStatusChanged", violation);

    return res.status(200).json({
      success: true,
      message: "Driving violation status updated successfully",
      data: violation,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error updating driving violation status",
      error: error.message,
    });
  }
};

export const verifyDrivingViolation = async (req, res) => {
  try {
    const { id } = req.params;
    const { verifiedBy } = req.body;

    const violation = await DrivingViolation.findById(id);

    if (!violation) {
      return res.status(404).json({
        success: false,
        message: "Driving violation not found",
      });
    }

    // TOGGLE: agar already verified hai to isi API se un-verify ho jayega,
    // warna verify ho jayega (same endpoint / same controller)
    if (violation.isVerified) {
      violation.isVerified = false;
      violation.verifiedBy = null;
      violation.verifiedAt = null;
      violation.history.push({
        status: "verification_cancelled",
        changedBy: verifiedBy || null,
        reason: "Verification cancelled",
        changedAt: new Date(),
      });

      await violation.save();

      const io = req.app.get("io");
      if (io) io.emit("drivingViolationVerified", violation);

      return res.status(200).json({
        success: true,
        message: "Driving violation verification cancelled successfully",
        data: violation,
      });
    }

    if (!verifiedBy) {
      return res.status(400).json({
        success: false,
        message: "verifiedBy is required",
      });
    }

    violation.isVerified = true;
    violation.verifiedBy = verifiedBy;
    violation.verifiedAt = new Date();
    violation.rejectionReason = null;
    violation.history.push({
      status: "verified",
      changedBy: verifiedBy,
      reason: "Violation record verified",
      changedAt: new Date(),
    });

    await violation.save();

    // SOCKET EVENT
    const io = req.app.get("io");
    if (io) io.emit("drivingViolationVerified", violation);

    return res.status(200).json({
      success: true,
      message: "Driving violation verified successfully",
      data: violation,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error verifying driving violation",
      error: error.message,
    });
  }
};

export const rejectDrivingViolation = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason, changedBy } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({
        success: false,
        message: "rejectionReason is required",
      });
    }

    const violation = await DrivingViolation.findById(id);

    if (!violation) {
      return res.status(404).json({
        success: false,
        message: "Driving violation not found",
      });
    }

    violation.isVerified = false;
    violation.rejectionReason = rejectionReason;
    violation.history.push({
      status: "rejected",
      changedBy: changedBy || null,
      reason: rejectionReason,
      changedAt: new Date(),
    });

    await violation.save();

    // SOCKET EVENT
    const io = req.app.get("io");
    if (io) io.emit("drivingViolationRejected", violation);

    return res.status(200).json({
      success: true,
      message: "Driving violation rejected successfully",
      data: violation,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error rejecting driving violation",
      error: error.message,
    });
  }
};
