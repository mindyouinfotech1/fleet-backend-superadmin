import mongoose from "mongoose";
import { DrivingAccident } from "../../../../models/User/Drivers/Others/DrivingAccident.js";
import { User as BusinessUser } from "../../../../models/SuperAdmin/Auth/Bussiness_User.js";
import { Driver } from "../../../../models/User/Drivers/Driver.js";
import { generateCode } from "../../../../controllers/generateCode.js";

export const createDrivingAccident = async (req, res) => {
  try {
    const {
      organizationId,
      individualId,
      licenseId,
      accidentDate,
      policeReportId,
    } = req.body;

    if (!organizationId || !individualId || !licenseId || !accidentDate) {
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
      const alreadyExists = await DrivingAccident.findOne({
        organizationId,
        policeReportId,
      });
      if (alreadyExists) {
        return res.status(409).json({
          success: false,
          message:
            "An accident record with this Police Report ID already exists in this organization",
        });
      }
    }

    const DriverAccidentCode = await generateCode(
      organizationId,
      "DrivingAccident",
      "DIR-ACC",
    );

    const accident = await DrivingAccident.create({
      ...req.body,
      organizationCode,
      DriverAccidentCode,
      history: [
        {
          status: req.body.status || "pending",
          changedBy: req.body.createdBy || null,
          reason: "Accident record created",
          changedAt: new Date(),
        },
      ],
    });

    // SOCKET EVENT
    const io = req.app.get("io");
    if (io) io.emit("drivingAccidentCreated", accident);

    return res.status(201).json({
      success: true,
      message: "Driving accident created successfully",
      data: accident,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        code: "DUPLICATE_RECORD",
        message:
          "An accident record with this Police Report ID already exists in this organization.",
      });
    }

    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while creating the driving accident.",
    });
  }
};

export const updateDrivingAccident = async (req, res) => {
  try {
    const { id } = req.params;

    const existingAccident = await DrivingAccident.findById(id);

    if (!existingAccident) {
      return res.status(404).json({
        success: false,
        message: "Driving accident not found",
      });
    }

    // Check duplicate policeReportId within same organization
    if (req.body.policeReportId) {
      const duplicateAccident = await DrivingAccident.findOne({
        organizationId: existingAccident.organizationId,
        policeReportId: req.body.policeReportId,
        _id: { $ne: id }, // current record ko ignore karo
      });

      if (duplicateAccident) {
        return res.status(409).json({
          success: false,
          code: "DUPLICATE_RECORD",
          message:
            "An accident record with this Police Report ID already exists in this organization.",
        });
      }
    }

    const updatedAccident = await DrivingAccident.findByIdAndUpdate(
      id,
      req.body,
      {
        new: true,
        runValidators: true,
      },
    );

    // SOCKET EVENT
    const io = req.app.get("io");
    if (io) io.emit("drivingAccidentUpdated", updatedAccident);

    return res.status(200).json({
      success: true,
      message: "Driving accident updated successfully",
      data: updatedAccident,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        code: "DUPLICATE_RECORD",
        message:
          "An accident record with this Police Report ID already exists in this organization.",
      });
    }

    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while updating the driving accident.",
    });
  }
};

export const getAllDrivingAccidents = async (req, res) => {
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

    const accidents = await DrivingAccident.find(filter)
      .populate("individualId", "firstName lastName email phoneNumber")
      // .populate("licenseId")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: accidents.length,
      data: accidents,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching driving accidents",
      error: error.message,
    });
  }
};

export const getDrivingAccidentById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid accident ID",
      });
    }

    const accident = await DrivingAccident.aggregate([
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

    if (!accident.length) {
      return res.status(404).json({
        success: false,
        message: "Driving accident not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: accident[0],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching driving accident",
      error: error.message,
    });
  }
};

export const deleteDrivingAccident = async (req, res) => {
  try {
    const { id } = req.params;
    const { deletedBy } = req.body;

    const accident = await DrivingAccident.findById(id);

    if (!accident) {
      return res.status(404).json({
        success: false,
        message: "Driving accident not found",
      });
    }

    // SOFT DELETE
    accident.isDeleted = true;
    accident.deletedBy = deletedBy || null;
    accident.deletedAt = new Date();
    await accident.save();

    // SOCKET EVENT
    const io = req.app.get("io");
    if (io) io.emit("drivingAccidentDeleted", id);

    return res.status(200).json({
      success: true,
      message: "Driving accident deleted successfully (soft delete)",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error deleting driving accident",
      error: error.message,
    });
  }
};

export const changeDrivingAccidentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, changedBy, reason } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    // NOTE: adjust this list to match your actual accident workflow statuses
    const allowedStatuses = [
      "pending",
      "under_review",
      "resolved",
      "disputed",
      "closed",
    ];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Use one of: ${allowedStatuses.join(", ")}`,
      });
    }

    const accident = await DrivingAccident.findById(id);

    if (!accident) {
      return res.status(404).json({
        success: false,
        message: "Driving accident not found",
      });
    }

    accident.status = status;
    accident.history.push({
      status,
      changedBy: changedBy || null,
      reason: reason || "Status updated",
      changedAt: new Date(),
    });

    await accident.save();

    // SOCKET EVENT
    const io = req.app.get("io");
    if (io) io.emit("drivingAccidentStatusChanged", accident);

    return res.status(200).json({
      success: true,
      message: "Driving accident status updated successfully",
      data: accident,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error updating driving accident status",
      error: error.message,
    });
  }
};

export const verifyDrivingAccident = async (req, res) => {
  try {
    const { id } = req.params;
    const { verifiedBy } = req.body;

    const accident = await DrivingAccident.findById(id);

    if (!accident) {
      return res.status(404).json({
        success: false,
        message: "Driving accident not found",
      });
    }

    // TOGGLE: agar already verified hai to isi API se un-verify ho jayega,
    // warna verify ho jayega (same endpoint / same controller)
    if (accident.isVerified) {
      accident.isVerified = false;
      accident.verifiedBy = null;
      accident.verifiedAt = null;
      accident.history.push({
        status: "verification_cancelled",
        changedBy: verifiedBy || null,
        reason: "Verification cancelled",
        changedAt: new Date(),
      });

      await accident.save();

      const io = req.app.get("io");
      if (io) io.emit("drivingAccidentVerified", accident);

      return res.status(200).json({
        success: true,
        message: "Driving accident verification cancelled successfully",
        data: accident,
      });
    }

    if (!verifiedBy) {
      return res.status(400).json({
        success: false,
        message: "verifiedBy is required",
      });
    }

    accident.isVerified = true;
    accident.verifiedBy = verifiedBy;
    accident.verifiedAt = new Date();
    accident.rejectionReason = null;
    accident.history.push({
      status: "verified",
      changedBy: verifiedBy,
      reason: "Accident record verified",
      changedAt: new Date(),
    });

    await accident.save();

    // SOCKET EVENT
    const io = req.app.get("io");
    if (io) io.emit("drivingAccidentVerified", accident);

    return res.status(200).json({
      success: true,
      message: "Driving accident verified successfully",
      data: accident,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error verifying driving accident",
      error: error.message,
    });
  }
};

export const rejectDrivingAccident = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason, changedBy } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({
        success: false,
        message: "rejectionReason is required",
      });
    }

    const accident = await DrivingAccident.findById(id);

    if (!accident) {
      return res.status(404).json({
        success: false,
        message: "Driving accident not found",
      });
    }

    accident.isVerified = false;
    accident.rejectionReason = rejectionReason;
    accident.history.push({
      status: "rejected",
      changedBy: changedBy || null,
      reason: rejectionReason,
      changedAt: new Date(),
    });

    await accident.save();

    // SOCKET EVENT
    const io = req.app.get("io");
    if (io) io.emit("drivingAccidentRejected", accident);

    return res.status(200).json({
      success: true,
      message: "Driving accident rejected successfully",
      data: accident,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error rejecting driving accident",
      error: error.message,
    });
  }
};
