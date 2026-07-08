import mongoose from "mongoose";
import bcrypt from "bcrypt";
import crypto from "crypto";
import fs from "fs";
import { Driver } from "../../../models/User/Drivers/Driver.js";
import { User as BusinessUser } from "../../../models/SuperAdmin/Auth/Bussiness_User.js";

export const createDriver = async (req, res) => {
  try {
    const {
      email,
      phoneNumber,
      password,
      firstName,
      lastName,
      organizationId,
    } = req.body;

    if (
      !email ||
      !phoneNumber ||
      !password ||
      !firstName ||
      !lastName ||
      !organizationId
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
    const DriverCodeByOrganization = `DIR-${String(nextNumber).padStart(6, "0")}`;

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
    // catch (error) {
    //   return res.status(500).json({
    //     success: false,
    //     message: "Error creating driver",
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

    const driver = await Driver.findById(id);

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: driver,
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
