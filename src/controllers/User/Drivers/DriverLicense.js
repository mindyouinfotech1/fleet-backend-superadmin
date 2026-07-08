import { DriverLicense } from "../../../models/User/Drivers/DriverLicense.js";
import { Driver } from "../../../models/User/Drivers/Driver.js";
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

    // const license = await DriverLicense.create({
    //   driverId,
    //   licenseNumber,
    //   countryCode,
    //   licenseType,
    //   licenseClass,
    //   endorsements,
    //   restrictions,
    //   issueDate,
    //   expiryDate,
    //   issuingAuthority,
    //   remarks,
    //   licenseFront,
    //   licenseBack,
    // });

    // SOCKET EVENT

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

// /* =========================
//    GET ALL LICENSES
// ========================= */
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
   GET ALL LICENSES
========================= */
// export const getAllDriverLicenses = async (req, res) => {
//   try {
//     const { driverId, organizationId, countryCode, status } = req.query;

//     const filter = {
//       isDeleted: false,
//     };

//     if (driverId) filter.driverId = driverId;
//     if (organizationId) filter.organizationId = organizationId;
//     if (countryCode) filter.countryCode = countryCode;
//     if (status) filter.status = status;

//     const licenses = await DriverLicense.find(filter)
//       .populate("driverId")
//       .populate("verifiedBy", "name email")
//       .sort({ createdAt: -1 });

//     // Group by Driver
//     const groupedDrivers = {};

//     licenses.forEach((license) => {
//       const driver = license.driverId;

//       if (!driver) return;

//       const driverKey = driver._id.toString();

//       if (!groupedDrivers[driverKey]) {
//         groupedDrivers[driverKey] = {
//           driver: driver,
//           totalLicenses: 0,
//           licenses: [],
//         };
//       }

//       groupedDrivers[driverKey].totalLicenses++;

//       groupedDrivers[driverKey].licenses.push({
//         _id: license._id,
//         DriverLicensesCode: license.DriverLicensesCode,
//         licenseNumber: license.licenseNumber,
//         countryCode: license.countryCode,
//         licenseType: license.licenseType,
//         licenseClass: license.licenseClass,
//         endorsements: license.endorsements,
//         restrictions: license.restrictions,
//         issueDate: license.issueDate,
//         expiryDate: license.expiryDate,
//         issuingAuthority: license.issuingAuthority,

//         status: license.status,
//         verified: license.verified,
//         isExpired: license.isExpired,
//         isDeleted: license.isDeleted,

//         licenseFront: license.licenseFront,
//         licenseBack: license.licenseBack,

//         createdAt: license.createdAt,
//         updatedAt: license.updatedAt,
//       });
//     });

//     return res.status(200).json({
//       success: true,
//       totalDrivers: Object.keys(groupedDrivers).length,
//       totalLicenses: licenses.length,
//       data: Object.values(groupedDrivers),
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

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
