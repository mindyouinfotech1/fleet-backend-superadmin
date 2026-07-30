import { DriverLicense } from "../../../models/User/Drivers/DriverLicense.js";
import { Driver } from "../../../models/User/Drivers/Driver.js";
import mongoose from "mongoose";
const EXPIRY_WARNING_DAYS = 7;

function calculateLicenseStatus(expiryDate) {
  if (!expiryDate) return "Active"; // ya "Pending" jo bhi default chahiye

  const now = new Date();
  const expiry = new Date(expiryDate);

  if (expiry < now) return "Expired";

  //  NAYA: expiry aur aaj ke beech kitne din bache hain
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysLeft = Math.ceil((expiry - now) / msPerDay);

  if (daysLeft <= EXPIRY_WARNING_DAYS) return "ExpiringSoon"; //  NAYA

  return "Active";
}

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

    // Driver details fetch
    const driver = await Driver.findById(driverId).select(
      "organizationId organizationCode DriverCodeByOrganization DriverRelationShip",
    );

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver not found",
      });
    }

    const licenseFront = req.files?.licenseFront?.[0]?.path;
    const licenseBack = req.files?.licenseBack?.[0]?.path;

    if (!licenseFront || !licenseBack) {
      return res.status(400).json({
        success: false,
        message: "License front and back images are required",
      });
    }

    const lastLicense = await DriverLicense.findOne()
      .sort({ createdAt: -1 })
      .select("DriverLicensesCode");

    let DriverLicensesCode = "DLC-000001";

    if (lastLicense?.DriverLicensesCode) {
      const lastNumber = parseInt(lastLicense.DriverLicensesCode.split("-")[1]);

      DriverLicensesCode = `DLC-${String(lastNumber + 1).padStart(6, "0")}`;
    }

    const status = calculateLicenseStatus(expiryDate);

    const license = await DriverLicense.create({
      driverId,

      // Driver Collection se aane wale fields
      organizationId: driver.organizationId,
      organizationCode: driver.organizationCode,
      DriverCodeByOrganization: driver.DriverCodeByOrganization,
      DriverRelationShip: driver.DriverRelationShip,

      // Driver License Code
      DriverLicensesCode,

      // Existing Fields
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
      status,
    });

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

export const updateDriverLicense = async (req, res) => {
  try {
    const updateData = { ...req.body };

    if (req.files?.licenseFront?.[0]) {
      updateData.licenseFront = req.files.licenseFront[0].path;
    }

    if (req.files?.licenseBack?.[0]) {
      updateData.licenseBack = req.files.licenseBack[0].path;
    }

    //  NAYA: expiryDate diya gaya ho to naya status calculate karo
    if (updateData.expiryDate) {
      updateData.status = calculateLicenseStatus(updateData.expiryDate);
    }

    const updated = await DriverLicense.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      updateData,
      { new: true },
    );

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

export const getAllDriverLicenses = async (req, res) => {
  try {
    const { driverId, countryCode, status, organizationId } = req.query;

    const filter = {
      isDeleted: false,
      organizationId: organizationId,
    };

    if (driverId) filter.driverId = driverId;
    if (countryCode) filter.countryCode = countryCode;
    if (status) filter.status = status;

    const licenses = await DriverLicense.find(filter)
      .populate("driverId")
      // .populate("verifiedBy")
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
    const { driverId } = req.params;
    const { countryCode, status } = req.query;

    const filter = {
      isDeleted: false,
      driverId: driverId,
    };

    // Validate driverId
    if (!mongoose.Types.ObjectId.isValid(driverId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid driverId",
      });
    }

    if (countryCode) {
      filter.countryCode = countryCode;
    }

    if (status) {
      filter.status = status;
    }

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

export const verifyDriverLicense = async (req, res) => {
  try {
    const adminId = req.user?._id;

    const license = await DriverLicense.findOne({
      _id: req.params.id,
      isDeleted: false,
    });

    if (!license) {
      return res.status(404).json({
        success: false,
        message: "Driver license not found",
      });
    }

    // Toggle verification
    license.verified = !license.verified;

    if (license.verified) {
      license.verifiedBy = adminId;
      license.verifiedAt = new Date();
    } else {
      license.verifiedBy = null;
      license.verifiedAt = null;
    }

    await license.save();

    // SOCKET EVENT
    const io = req.app.get("io");
    if (io) io.emit("driverLicenseVerified", license);

    return res.status(200).json({
      success: true,
      message: license.verified
        ? "Driver license verified successfully"
        : "Driver license verification cancelled successfully",
      data: license,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

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
