import { Driver } from "../../../models/User/Drivers/Driver.js";
import fs from "fs";

export const createDriver = async (req, res) => {
  try {
    const {
      email,
      phoneNumber,
      nationalIdOrAadharNumber,
      firstName,
      lastName,
      organizationId,
    } = req.body;

    if (!email || !phoneNumber || !firstName || !lastName || !organizationId) {
      return res.status(400).json({
        success: false,
        message: "Required fields are missing",
      });
    }

    if (req.file) {
      req.body.profilePhoto = `/uploads/${req.file.filename}`;
    }

    const driver = await Driver.create(req.body);

    // SOCKET EVENT
    const io = req.app.get("io");
    if (io) io.emit("driverCreated", driver);

    return res.status(201).json({
      success: true,
      message: "Driver created successfully",
      data: driver,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error creating driver",
      error: error.message,
    });
  }
};

export const getAllDrivers = async (req, res) => {
  try {
    const { organizationId } = req.query; // 👈 query se lo

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: "organizationId is required",
      });
    }

    const drivers = await Driver.find({ organizationId, isDeleted: false })
      .populate("organizationId")
      .sort({ createdAt: -1 });

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
    return res.status(500).json({
      success: false,
      message: "Error updating driver",
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

    // ✅ SOFT DELETE
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
