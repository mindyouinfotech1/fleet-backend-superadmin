import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { User as FleetUser } from "../../../models/SuperAdmin/Orgainization/User.js";
import { User as BusinessUser } from "../../../models/SuperAdmin/Auth/Bussiness_User.js";
import { Role } from "../../../models/SuperAdmin/Orgainization/Role.js";

export const createSubAdmin = async (req, res) => {
  try {
    const {
      orgId,
      roleId,
      name,
      email,
      password,
      address,
      country,
      state,
      city,
      pincode,
      gender,
      dateOfBirth,
      phone,
      ProfilePhoto,
    } = req.body;

    if (!orgId || !name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "orgId, name, email and password are required",
      });
    }

    // Organization must exist and be active
    const org = await BusinessUser.findById(orgId);
    if (!org || org.isDelete) {
      return res.status(404).json({
        success: false,
        message: "Organization not found",
      });
    }
    if (!org.isActive) {
      return res.status(403).json({
        success: false,
        message: "Organization is inactive, cannot create sub-admin",
      });
    }

    // Email must be unique within this organization
    const emailExist = await FleetUser.findOne({ orgId, email });
    if (emailExist) {
      return res.status(400).json({
        success: false,
        message: "Email already exists in this organization",
      });
    }

    // If a roleId is passed, validate it belongs to same org and isn't the system admin role
    if (roleId) {
      const role = await Role.findOne({ _id: roleId, orgId });
      if (!role) {
        return res.status(400).json({
          success: false,
          message: "Invalid role for this organization",
        });
      }
      if (role.roleName === "admin" && role.isSystemRole) {
        return res.status(403).json({
          success: false,
          message: "Cannot assign the main admin role to a sub-admin",
        });
      }
    }

    const hashPassword = await bcrypt.hash(password, 10);

    // isOrgAdmin is forced false — this endpoint only creates sub-admins
    const subAdmin = await FleetUser.create({
      orgId,
      roleId: roleId || null,
      name,
      email,
      password: hashPassword,
      address,
      country,
      state,
      city,
      pincode,
      gender,
      dateOfBirth,
      phone,
      ProfilePhoto,
      isOrgAdmin: false,
    });

    const { password: _pw, ...safeUser } = subAdmin.toObject();

    res.status(201).json({
      success: true,
      message: "Sub-Admin Created Successfully",
      data: safeUser,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await FleetUser.findOne({ email });

    if (!user || user.isDelete) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.isActive || user.status === "blocked") {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive or blocked. Contact your admin.",
      });
    }

    // Organization must exist, be active, and not deleted
    const org = await BusinessUser.findById(user.orgId);

    if (!org || org.isDelete) {
      return res.status(403).json({
        success: false,
        message: "Organization not found or has been deleted",
      });
    }

    if (!org.isActive) {
      return res.status(403).json({
        success: false,
        message: "Organization is inactive. Please contact support.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error(
        "JWT_SECRET is missing — check your .env file and dotenv.config() order",
      );
      return res.status(500).json({
        success: false,
        message: "Server misconfiguration: JWT secret not set",
      });
    }

    // JWT payload — no password inside for security
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        roleId: user.roleId,
        orgId: user.orgId,
        isOrgAdmin: user.isOrgAdmin,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
    );

    user.lastLogin = new Date();
    await user.save();

    const { password: _pw, ...safeUser } = user.toObject();

    res
      .cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      })
      .status(200)
      .json({
        success: true,
        message: "Login Successful",
        token,
        data: safeUser,
      });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const logout = async (req, res) => {
  try {
    res
      .clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      })
      .status(200)
      .json({
        success: true,
        message: "Logout Successful",
      });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
