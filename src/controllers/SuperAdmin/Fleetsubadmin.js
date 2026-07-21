import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";

import { User as FleetUser } from "../../models/SuperAdmin/Orgainization/User.js";
import { User as BusinessUser } from "../../models/SuperAdmin/Auth/Bussiness_User.js";
import { Role } from "../../models/SuperAdmin/Orgainization/Role.js";
import { UPLOAD_PATHS } from "../../config/uploadConfig.js";
import mongoose from "mongoose";

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

    const io = req.app.get("io");
    if (io) io.emit("subAdminCreated", safeUser);

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

// ================= UPDATE PASSWORD (BY USER ID) =================
export const updateUserPassword = async (req, res) => {
  try {
    const { userId, oldPassword, newPassword } = req.body;

    if (!userId || !oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "userId, oldPassword and newPassword are required",
      });
    }

    // find user
    const user = await FleetUser.findById(userId);

    if (!user || user.isDelete) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // check old password match
    const isMatch = await bcrypt.compare(oldPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Old password is incorrect",
      });
    }

    // check if new password is same as old password
    const isSame = await bcrypt.compare(newPassword, user.password);

    if (isSame) {
      return res.status(400).json({
        success: false,
        message: "New password cannot be same as old password",
      });
    }

    // hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= UPDATE SUB-ADMIN =================
export const updateSubAdmin = async (req, res) => {
  try {
    // console.log("req.body", req.body);
    const { id } = req.params;

    const existing = await FleetUser.findById(id);

    if (!existing || existing.isDelete) {
      if (req.file) {
        deletePhotoFile(`${PROFILE_PHOTO_DIR}/${req.file.filename}`);
      }

      return res.status(404).json({
        success: false,
        message: "Sub-Admin not found",
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

    // ================= Validate Role (Only if roleId is provided) =================
    if (roleId && roleId.trim() !== "") {
      const role = await Role.findOne({
        _id: roleId,
        orgId: existing.orgId,
      });

      if (!role) {
        if (req.file) {
          deletePhotoFile(`${PROFILE_PHOTO_DIR}/${req.file.filename}`);
        }

        return res.status(400).json({
          success: false,
          message: "Invalid role for this organization",
        });
      }

      // Don't allow assigning system admin role
      if (role.roleName === "admin" && role.isSystemRole) {
        if (req.file) {
          deletePhotoFile(`${PROFILE_PHOTO_DIR}/${req.file.filename}`);
        }

        return res.status(403).json({
          success: false,
          message: "Cannot assign the main admin role to a sub-admin",
        });
      }
    }

    // ================= Email Validation =================
    if (email && email !== existing.email) {
      const emailExist = await FleetUser.findOne({
        orgId: existing.orgId,
        email,
        _id: { $ne: id },
        isDelete: false,
      });

      if (emailExist) {
        if (req.file) {
          deletePhotoFile(`${PROFILE_PHOTO_DIR}/${req.file.filename}`);
        }

        return res.status(400).json({
          success: false,
          message: "Email already exists in this organization",
        });
      }
    }

    // ================= Build Update Data =================
    const updateData = {};

    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (address !== undefined) updateData.address = address;
    if (country !== undefined) updateData.country = country;
    if (state !== undefined) updateData.state = state;
    if (city !== undefined) updateData.city = city;
    if (pincode !== undefined) updateData.pincode = pincode;
    if (gender !== undefined) updateData.gender = gender;
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth;
    if (phone !== undefined) updateData.phone = phone;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (status !== undefined) updateData.status = status;

    // Update role only if valid roleId is received
    if (roleId && roleId.trim() !== "") {
      updateData.roleId = roleId;
    }

    // ================= Profile Photo =================
    if (req.file) {
      if (existing.ProfilePhoto) {
        deletePhotoFile(existing.ProfilePhoto);
      }

      updateData.ProfilePhoto = `${PROFILE_PHOTO_DIR}/${req.file.filename}`;
    }

    // ================= Update =================
    const updated = await FleetUser.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    const { password, ...safeUser } = updated.toObject();

    const io = req.app.get("io");
    if (io) io.emit("subAdminUpdated", safeUser);

    return res.status(200).json({
      success: true,
      message: "Sub-Admin Updated Successfully",
      data: safeUser,
    });
  } catch (error) {
    if (req.file) {
      deletePhotoFile(`${PROFILE_PHOTO_DIR}/${req.file.filename}`);
    }

    return res.status(500).json({
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

// export const getAllSubAdmins = async (req, res) => {
//   try {
//     const { orgId } = req.query;

//     const filter = {
//       isDelete: false,
//       isActive: true,
//       isOrgAdmin: false,
//       ...(orgId && { orgId }),
//     };

//     const users = await FleetUser.find(filter).select("-password");

//     console.log("users", users);

//     res.status(200).json({
//       success: true,
//       count: users.length,
//       data: users,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

export const getAllSubAdmins = async (req, res) => {
  try {
    const { orgId } = req.query;

    const match = {
      isDelete: false,
      isActive: true,
      isOrgAdmin: false,
      ...(orgId && { orgId: new mongoose.Types.ObjectId(orgId) }),
    };

    const users = await FleetUser.aggregate([
      {
        $match: match,
      },

      // Country lookup
      {
        $lookup: {
          from: "countries",
          localField: "country",
          foreignField: "_id",
          as: "countryData",
        },
      },

      // State lookup
      {
        $lookup: {
          from: "states",
          localField: "state",
          foreignField: "_id",
          as: "stateData",
        },
      },

      // City lookup
      {
        $lookup: {
          from: "cities",
          localField: "city",
          foreignField: "_id",
          as: "cityData",
        },
      },

      // Replace IDs with names
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

      // Remove lookup arrays + password
      {
        $project: {
          password: 0,
          countryData: 0,
          stateData: 0,
          cityData: 0,
        },
      },

      {
        $sort: {
          createdAt: -1,
        },
      },
    ]);

    // console.log("users", users);

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

    const io = req.app.get("io");
    if (io) io.emit("subAdminDeleted", req.params.id);

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
