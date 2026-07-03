import { DriverLicense } from "../../../models/User/Drivers/DriverLicense.js";
import mongoose from "mongoose";

/* =========================
   CREATE DRIVER LICENSE
========================= */
export const createDriverLicense = async (req, res) => {
  try {
    const {
      driverId,
      licenseNumber,
      countryCode,
      licenseType,
      licenseClass,
      endorsements,
      restrictions,
      issueDate,
      expiryDate,
      issuingAuthority,
      remarks,
    } = req.body;

    const licenseFront = req.files?.licenseFront?.[0]?.path;
    const licenseBack = req.files?.licenseBack?.[0]?.path;

    if (!licenseFront || !licenseBack) {
      return res.status(400).json({
        success: false,
        message: "License front and back images are required",
      });
    }

    const license = await DriverLicense.create({
      driverId,
      licenseNumber,
      countryCode,
      licenseType,
      licenseClass,
      endorsements,
      restrictions,
      issueDate,
      expiryDate,
      issuingAuthority,
      remarks,
      licenseFront,
      licenseBack,
    });

    // SOCKET EVENT
    const io = req.app.get("io");
    if (io) io.emit("driverLicenseCreated", license);

    return res.status(201).json({
      success: true,
      message: "Driver license created successfully",
      data: license,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =========================
   GET ALL LICENSES
========================= */
export const getAllDriverLicenses = async (req, res) => {
  try {
    const { driverId, countryCode, status } = req.query;

    const filter = { isDeleted: false };

    if (driverId) filter.driverId = driverId;
    if (countryCode) filter.countryCode = countryCode;
    if (status) filter.status = status;

    const licenses = await DriverLicense.find(filter)
      .populate("driverId")
      .populate("verifiedBy")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: licenses.length,
      data: licenses,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =========================
   GET SINGLE LICENSE
========================= */
export const getDriverLicenseById = async (req, res) => {
  try {
    const license = await DriverLicense.findOne({
      _id: req.params.id,
      isDeleted: false,
    })
      .populate("driverId")
      .populate("verifiedBy");

    if (!license) {
      return res.status(404).json({
        success: false,
        message: "Driver license not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: license,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllDriverLicensesByDriver = async (req, res) => {
  try {
    const { driverId, countryCode, status } = req.query;

    const filter = { isDeleted: false };

    //  SAFE driverId check
    if (driverId && mongoose.Types.ObjectId.isValid(driverId)) {
      filter.driverId = driverId;
    }

    if (countryCode) filter.countryCode = countryCode;
    if (status) filter.status = status;

    const licenses = await DriverLicense.find(filter)
      .populate("driverId")
      .populate("verifiedBy")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: licenses.length,
      data: licenses,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =========================
   UPDATE LICENSE
========================= */
export const updateDriverLicense = async (req, res) => {
  try {
    const updateData = { ...req.body };

    if (req.files?.licenseFront?.[0]) {
      updateData.licenseFront = req.files.licenseFront[0].path;
    }

    if (req.files?.licenseBack?.[0]) {
      updateData.licenseBack = req.files.licenseBack[0].path;
    }

    const updated = await DriverLicense.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      updateData,
      { new: true },
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Driver license not found",
      });
    }

    // SOCKET EVENT
    const io = req.app.get("io");
    if (io) io.emit("driverLicenseUpdated", updated);

    return res.status(200).json({
      success: true,
      message: "Driver license updated successfully",
      data: updated,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =========================
   SOFT DELETE LICENSE
========================= */
export const deleteDriverLicense = async (req, res) => {
  try {
    const deleted = await DriverLicense.findOneAndUpdate(
      { _id: req.params.id },
      { isDeleted: true },
      { new: true },
    );

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Driver license not found",
      });
    }

    // SOCKET EVENT
    const io = req.app.get("io");
    if (io) io.emit("driverLicenseDeleted", req.params.id);

    return res.status(200).json({
      success: true,
      message: "Driver license deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =========================
   VERIFY LICENSE
========================= */
export const verifyDriverLicense = async (req, res) => {
  try {
    const adminId = req.user?._id;

    const updated = await DriverLicense.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      {
        verified: true,
        verifiedBy: adminId,
        verifiedAt: new Date(),
      },
      { new: true },
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Driver license not found",
      });
    }

    // SOCKET EVENT
    const io = req.app.get("io");
    if (io) io.emit("driverLicenseVerified", updated);

    return res.status(200).json({
      success: true,
      message: "Driver license verified successfully",
      data: updated,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =========================
   UPDATE STATUS
========================= */
export const updateLicenseStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const updated = await DriverLicense.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { status },
      { new: true },
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Driver license not found",
      });
    }

    // SOCKET EVENT
    const io = req.app.get("io");
    if (io) io.emit("driverLicenseStatusChanged", updated);

    return res.status(200).json({
      success: true,
      message: "License status updated successfully",
      data: updated,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
