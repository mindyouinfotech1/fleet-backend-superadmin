import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Driver } from "../../../models/User/Drivers/Driver.js";
import { User as BusinessUser } from "../../../models/SuperAdmin/Auth/Bussiness_User.js";

import mongoose from "mongoose";

export const driverLogin = async (req, res) => {
  try {
    const { email, password, organizationCode } = req.body;

    if (!email || !password || !organizationCode) {
      return res.status(400).json({
        success: false,
        message: "email, password and organizationCode are required",
      });
    }

    // organizationCode se organization pata karo
    const businessUser = await BusinessUser.findOne({ organizationCode });
    if (!businessUser) {
      return res.status(404).json({
        success: false,
        message: "Invalid organization code",
      });
    }

    // us organization me driver dhoondo
    const driver = await Driver.findOne({
      email,
      organizationId: businessUser._id,
    });
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver not found in this organization",
      });
    }

    // password match
    const isMatch = await bcrypt.compare(password, driver.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        id: driver._id,
        organizationId: driver.organizationId,
        role: "driver",
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    const driverObj = driver.toObject();
    delete driverObj.password;

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      data: driverObj,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error logging in driver",
      error: error.message,
    });
  }
};

export const getDriverOrganizationsByEmail = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const drivers = await Driver.find({ email, isDeleted: false })
      .populate("organizationId", "organizationName organizationCode isActive")
      .select("organizationId");

    if (!drivers.length) {
      return res.status(404).json({
        success: false,
        message: "No organization found for this email",
      });
    }

    const organizations = drivers
      .filter((d) => d.organizationId && d.organizationId.isActive)
      .map((d) => ({
        organizationId: d.organizationId._id,
        organizationName: d.organizationId.organizationName,
        organizationCode: d.organizationId.organizationCode,
      }));

    if (!organizations.length) {
      return res.status(404).json({
        success: false,
        message: "No active organization found for this email",
      });
    }

    return res.status(200).json({
      success: true,
      data: organizations,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching organizations",
      error: error.message,
    });
  }
};
