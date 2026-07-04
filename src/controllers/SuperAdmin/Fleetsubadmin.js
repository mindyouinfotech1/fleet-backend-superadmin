import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";

import { User as FleetUser } from "../../models/SuperAdmin/Orgainization/User.js";
import { User as BusinessUser } from "../../models/SuperAdmin/Auth/Bussiness_User.js";
import { Role } from "../../models/SuperAdmin/Orgainization/Role.js";
import { UPLOAD_PATHS } from "../../config/uploadConfig.js";

const PROFILE_PHOTO_DIR = UPLOAD_PATHS.PROFILE_PHOTO_DIR;

const deletePhotoFile = (photoPath) => {
  if (!photoPath) return;
  try {
    const fullPath = path.join(process.cwd(), photoPath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  } catch (err) {
    console.error("Failed to delete old profile photo:", err.message);
  }
};

// ================= CREATE SUB-ADMIN (only, never main admin) =================
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
    } = req.body;

    if (!orgId || !name || !email || !password) {
      
      if (req.file)
        deletePhotoFile(`${PROFILE_PHOTO_DIR}/${req.file.filename}`);
      return res.status(400).json({
        success: false,
        message: "orgId, name, email and password are required",
      });
    }

    // Organization must exist and be active
    const org = await BusinessUser.findById(orgId);
    if (!org || org.isDelete) {
      if (req.file)
        deletePhotoFile(`${PROFILE_PHOTO_DIR}/${req.file.filename}`);
      return res.status(404).json({
        success: false,
        message: "Organization not found",
      });
    }
    if (!org.isActive) {
      if (req.file)
        deletePhotoFile(`${PROFILE_PHOTO_DIR}/${req.file.filename}`);
      return res.status(403).json({
        success: false,
        message: "Organization is inactive, cannot create sub-admin",
      });
    }

    // Email must be unique within this organization
    const emailExist = await FleetUser.findOne({ orgId, email });
    if (emailExist) {
      if (req.file)
        deletePhotoFile(`${PROFILE_PHOTO_DIR}/${req.file.filename}`);
      return res.status(400).json({
        success: false,
        message: "Email already exists in this organization",
      });
    }

    // If a roleId is passed, validate it belongs to same org and isn't the system admin role
    if (roleId) {
      const role = await Role.findOne({ _id: roleId, orgId });
      if (!role) {
        if (req.file)
          deletePhotoFile(`${PROFILE_PHOTO_DIR}/${req.file.filename}`);
        return res.status(400).json({
          success: false,
          message: "Invalid role for this organization",
        });
      }
      if (role.roleName === "admin" && role.isSystemRole) {
        if (req.file)
          deletePhotoFile(`${PROFILE_PHOTO_DIR}/${req.file.filename}`);
        return res.status(403).json({
          success: false,
          message: "Cannot assign the main admin role to a sub-admin",
        });
      }
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const ProfilePhoto = req.file
      ? `${PROFILE_PHOTO_DIR}/${req.file.filename}`
      : null;

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
    // cleanup uploaded file if something unexpected failed
    if (req.file) deletePhotoFile(`${PROFILE_PHOTO_DIR}/${req.file.filename}`);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= UPDATE SUB-ADMIN =================
export const updateSubAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await FleetUser.findById(id);
    if (!existing || existing.isDelete) {
      if (req.file)
        deletePhotoFile(`${PROFILE_PHOTO_DIR}/${req.file.filename}`);
      return res.status(404).json({
        success: false,
        message: "Sub-Admin not found",
      });
    }

    // Never allow flipping a sub-admin into the org admin via this route
    if (existing.isOrgAdmin) {
      if (req.file)
        deletePhotoFile(`${PROFILE_PHOTO_DIR}/${req.file.filename}`);
      return res.status(403).json({
        success: false,
        message: "Org admin cannot be edited from this endpoint",
      });
    }

    const {
      roleId,
      name,
      email,
      address,
      country,
      state,
      city,
      pincode,
      gender,
      dateOfBirth,
      phone,
      isActive,
      status,
    } = req.body;

    // Validate role if changed
    if (roleId) {
      const role = await Role.findOne({ _id: roleId, orgId: existing.orgId });
      if (!role) {
        if (req.file)
          deletePhotoFile(`${PROFILE_PHOTO_DIR}/${req.file.filename}`);
        return res.status(400).json({
          success: false,
          message: "Invalid role for this organization",
        });
      }
      if (role.roleName === "admin" && role.isSystemRole) {
        if (req.file)
          deletePhotoFile(`${PROFILE_PHOTO_DIR}/${req.file.filename}`);
        return res.status(403).json({
          success: false,
          message: "Cannot assign the main admin role to a sub-admin",
        });
      }
    }

    // Email uniqueness check within org (excluding self)
    if (email && email !== existing.email) {
      const emailExist = await FleetUser.findOne({
        orgId: existing.orgId,
        email,
        _id: { $ne: id },
      });
      if (emailExist) {
        if (req.file)
          deletePhotoFile(`${PROFILE_PHOTO_DIR}/${req.file.filename}`);
        return res.status(400).json({
          success: false,
          message: "Email already exists in this organization",
        });
      }
    }

    const updateData = {
      roleId,
      name,
      email,
      address,
      country,
      state,
      city,
      pincode,
      gender,
      dateOfBirth,
      phone,
      isActive,
      status,
    };

    // New photo uploaded — replace old one
    if (req.file) {
      deletePhotoFile(existing.ProfilePhoto);
      updateData.ProfilePhoto = `${PROFILE_PHOTO_DIR}/${req.file.filename}`;
    }

    const updated = await FleetUser.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    const { password: _pw, ...safeUser } = updated.toObject();

    res.status(200).json({
      success: true,
      message: "Sub-Admin Updated Successfully",
      data: safeUser,
    });
  } catch (error) {
    if (req.file) deletePhotoFile(`${PROFILE_PHOTO_DIR}/${req.file.filename}`);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= GET SINGLE SUB-ADMIN =================
export const getSubAdminById = async (req, res) => {
  try {
    const user = await FleetUser.findById(req.params.id).select("-password");

    // Blocked if not found, soft-deleted, or inactive
    if (!user || user.isDelete || !user.isActive) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= GET ALL SUB-ADMINS (for an org) =================
export const getAllSubAdmins = async (req, res) => {
  try {
    const { orgId } = req.query;

    const filter = {
      isDelete: false,
      isActive: true,
      isOrgAdmin: false,
      ...(orgId && { orgId }),
    };

    const users = await FleetUser.find(filter).select("-password");

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= SOFT DELETE SUB-ADMIN =================
export const deleteSubAdmin = async (req, res) => {
  try {
    const existing = await FleetUser.findById(req.params.id);

    if (!existing || existing.isDelete) {
      return res.status(404).json({
        success: false,
        message: "Sub-Admin not found",
      });
    }

    if (existing.isOrgAdmin) {
      return res.status(403).json({
        success: false,
        message: "Org admin cannot be deleted from this endpoint",
      });
    }

    await FleetUser.findByIdAndUpdate(req.params.id, {
      isDelete: true,
      isActive: false,
      status: "blocked",
    });

    res.status(200).json({
      success: true,
      message: "Sub-Admin Deleted Successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
