import mongoose from "mongoose";
import bcrypt from "bcrypt";
import crypto from "crypto";
import fs from "fs";
import { Driver } from "../../../models/User/Drivers/Driver.js";
import { User as BusinessUser } from "../../../models/SuperAdmin/Auth/Bussiness_User.js";
import { generateCode } from "../../../controllers/generateCode.js";

export const createDriver = async (req, res) => {
  try {
    const {
      email,
      phoneNumber,
      password,
      firstName,
      lastName,
      organizationId,
      branchId,
    } = req.body;

    if (
      !email ||
      !phoneNumber ||
      !password ||
      !firstName ||
      !lastName ||
      !organizationId ||
      !branchId
    ) {
      return res.status(400).json({
        success: false,
        message: "Required fields are missing",
      });
    }

    // 1. organizationCode BusinessUser se fetch karo
    const businessUser = await BusinessUser.findById(organizationId);
    if (!businessUser) {
      return res.status(404).json({
        success: false,
        message: "Organization not found",
      });
    }
    const organizationCode = businessUser.organizationCode;

    // 2. Same email + same organization me driver already hai?
    const alreadyExists = await Driver.findOne({ email, organizationId });
    if (alreadyExists) {
      return res.status(409).json({
        success: false,
        message: "Driver with this email already exists in this organization",
      });
    }

    const lastDriver = await Driver.findOne({ organizationId }).sort({
      DriverCodeByOrganization: -1,
    });

    let nextNumber = 1;
    if (lastDriver?.DriverCodeByOrganization) {
      const lastNum = parseInt(
        lastDriver.DriverCodeByOrganization.split("-")[1],
        10,
      );
      if (!isNaN(lastNum)) nextNumber = lastNum + 1;
    }
    const DriverCodeByOrganization = await generateCode(
      organizationId,
      "driver",
      "DIR",
    );

    // 4. DriverRelationShip - same email ho to reuse, warna naya generate
    const existingDriverByEmail = await Driver.findOne({ email });
    const DriverRelationShip = existingDriverByEmail
      ? existingDriverByEmail.DriverRelationShip
      : `REL-${crypto.randomBytes(6).toString("hex").toUpperCase()}`;

    // 5. Password hash
    const hashedPassword = await bcrypt.hash(password, 10);

    if (req.file) {
      req.body.profilePhoto = `/uploads/${req.file.filename}`;
    }

    const driver = await Driver.create({
      ...req.body,
      organizationCode,
      DriverCodeByOrganization,
      DriverRelationShip,
      password: hashedPassword,
      showPassword: password,
    });

    const driverObj = driver.toObject();
    delete driverObj.password;

    // SOCKET EVENT
    const io = req.app.get("io");
    if (io) io.emit("driverCreated", driverObj);

    return res.status(201).json({
      success: true,
      message: "Driver created successfully",
      data: driverObj,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        code: "DUPLICATE_EMAIL",
        message:
          "This email is already registered with another driver in your organization. Please use a different email address.",
      });
    }

    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while creating the driver.",
    });
  }
};

export const updateDriver = async (req, res) => {
  try {
    const { id } = req.params;

    const existingDriver = await Driver.findById(id);

    if (!existingDriver) {
      return res.status(404).json({
        success: false,
        message: "Driver not found",
      });
    }

    // Check if another driver already uses this email in the same organization
    if (req.body.email) {
      const duplicateDriver = await Driver.findOne({
        organizationId: existingDriver.organizationId,
        email: req.body.email,
        _id: { $ne: id }, // current driver ko ignore karo
      });

      if (duplicateDriver) {
        return res.status(409).json({
          success: false,
          code: "DUPLICATE_EMAIL",
          message:
            "This email is already registered with another driver in your organization. Please use a different email address.",
        });
      }
    }

    // Handle profile photo update
    if (req.file) {
      if (existingDriver.profilePhoto) {
        const oldPath = `.${existingDriver.profilePhoto}`;
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      req.body.profilePhoto = `/uploads/${req.file.filename}`;
    }

    const updatedDriver = await Driver.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    // SOCKET EVENT
    const io = req.app.get("io");
    if (io) io.emit("driverUpdated", updatedDriver);

    return res.status(200).json({
      success: true,
      message: "Driver updated successfully",
      data: updatedDriver,
    });
  } catch (error) {
    // catch (error) {
    //   return res.status(500).json({
    //     success: false,
    //     message: "Error updating driver",
    //     error: error.message,
    //   });
    // }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        code: "DUPLICATE_EMAIL",
        message:
          "This email is already registered with another driver in your organization. Please use a different email address.",
      });
    }

    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while creating the driver.",
    });
  }
};

export const getAllDrivers = async (req, res) => {
  try {
    const { organizationId } = req.query;

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

    const drivers = await Driver.find({
      organizationId,
      isDeleted: false,
    }).select("-password");

    return res.status(200).json({
      success: true,
      count: drivers.length,
      data: drivers,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching drivers",
      error: error.message,
    });
  }
};

export const getDriverById = async (req, res) => {
  try {
    const { id } = req.params;

    const driver = await Driver.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(id),
        },
      },

      // Country Lookup
      {
        $lookup: {
          from: "countries",
          localField: "countryId",
          foreignField: "countryId",
          as: "countryData",
        },
      },

      // State Lookup
      {
        $lookup: {
          from: "states",
          localField: "stateId",
          foreignField: "stateId",
          as: "stateData",
        },
      },

      // City Lookup
      {
        $lookup: {
          from: "cities",
          localField: "cityId",
          foreignField: "cityId",
          as: "cityData",
        },
      },

      {
        $addFields: {
          country: {
            $ifNull: [{ $arrayElemAt: ["$countryData.name", 0] }, null],
          },
          state: {
            $ifNull: [{ $arrayElemAt: ["$stateData.name", 0] }, null],
          },
          city: {
            $ifNull: [{ $arrayElemAt: ["$cityData.name", 0] }, null],
          },
        },
      },

      {
        $project: {
          countryData: 0,
          stateData: 0,
          cityData: 0,
        },
      },
    ]);

    if (!driver.length) {
      return res.status(404).json({
        success: false,
        message: "Driver not found",
      });
    }

    // console.log("driver", driver);
    return res.status(200).json({
      success: true,
      data: driver[0],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching driver",
      error: error.message,
    });
  }
};

export const deleteDriver = async (req, res) => {
  try {
    const { id } = req.params;

    const driver = await Driver.findById(id);

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver not found",
      });
    }

    // profile photo delete (optional same as before)
    if (driver.profilePhoto) {
      const filePath = `.${driver.profilePhoto}`;
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    //  SOFT DELETE
    driver.isDeleted = true;
    await driver.save();

    // SOCKET EVENT
    const io = req.app.get("io");
    if (io) io.emit("driverDeleted", id);

    return res.status(200).json({
      success: true,
      message: "Driver deleted successfully (soft delete)",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error deleting driver",
      error: error.message,
    });
  }
};

export const changeDriverStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { driverStatus } = req.body;

    if (!driverStatus) {
      return res.status(400).json({
        success: false,
        message: "Driver status is required",
      });
    }

    if (!["Active", "Inactive"].includes(driverStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid driver status. Use Active or Inactive",
      });
    }

    const driver = await Driver.findByIdAndUpdate(
      id,
      { driverStatus },
      { new: true },
    );

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver not found",
      });
    }

    // SOCKET EVENT
    const io = req.app.get("io");
    if (io) io.emit("driverStatusChanged", driver);

    return res.status(200).json({
      success: true,
      message: "Driver status updated successfully",
      data: driver,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error updating driver status",
      error: error.message,
    });
  }
};

export const updateDriverPassword = async (req, res) => {
  try {
    const { driverId } = req.params;
    const { currentPassword, newPassword } = req.body;

    if (!driverId || !currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Driver ID, current password and new password are required.",
      });
    }

    // Driver find
    const driver = await Driver.findById(driverId);

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver not found.",
      });
    }

    // Current password check
    const isMatch = await bcrypt.compare(currentPassword, driver.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect.",
      });
    }

    // Same password check
    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: "New password cannot be the same as current password.",
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    driver.password = hashedPassword;
    driver.showPassword = newPassword;

    await driver.save();
    const io = req.app.get("io");
    if (io) io.emit("driverUpdatedPassword", driver);

    return res.status(200).json({
      success: true,
      message: "Password updated successfully.",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while updating the password.",
    });
  }
};

export const resetDriverPassword = async (req, res) => {
  try {
    const { driverId } = req.params;
    const { newPassword } = req.body;

    if (!driverId || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Driver ID and new password are required.",
      });
    }

    const driver = await Driver.findById(driverId);

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver not found.",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    driver.password = hashedPassword;
    driver.showPassword = newPassword; // Optional

    await driver.save();

    return res.status(200).json({
      success: true,
      message: "Driver password updated successfully.",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while updating the password.",
    });
  }
};
