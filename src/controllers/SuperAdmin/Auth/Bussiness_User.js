// import mongoose from "mongoose";
// import bcrypt from "bcryptjs";
// import { v4 as uuidv4 } from "uuid";

// import { User as BusinessUser } from "../../../models/SuperAdmin/Auth/Bussiness_User.js";
// import { User as FleetUser } from "../../../models/SuperAdmin/Orgainization/User.js";
// import { Role } from "../../../models/SuperAdmin/Orgainization/Role.js";

// export const createUser = async (req, res) => {
//   let orgDoc = null;
//   let adminUser = null;

//   try {
//     const {
//       organizationName,
//       email,
//       password,
//       countryId,
//       stateId,
//       cityId,
//       country,
//       countryCode,
//       currency,
//       currencySymbol,
//       flag,
//       timezone,
//       phone,
//       address,
//       logo,
//       subscriptionPlan,
//     } = req.body;
//     console.log("req.body", req.body);

//     const emailExist = await BusinessUser.findOne({ email });
//     if (emailExist) {
//       return res.status(400).json({
//         success: false,
//         message: "Email already exists",
//       });
//     }

//     const organizationCode = `ORG-${uuidv4()
//       .replace(/-/g, "")
//       .substring(0, 8)
//       .toUpperCase()}`;

//     const hashPassword = await bcrypt.hash(password, 10);

//     // 1) Create BusinessUser
//     orgDoc = await BusinessUser.create({
//       organizationName,
//       organizationCode,
//       email,
//       password: hashPassword,
//       // country,
//       // countryCode,
//       // currency,
//       // currencySymbol,
//       flag,
//       timezone,
//       phone,
//       address,
//       logo,
//       subscriptionPlan,
//     });

//     // 2) Create Fleet_User (org admin)
//     adminUser = await FleetUser.create({
//       orgId: orgDoc._id,
//       name: organizationName,
//       email,
//       password: hashPassword,
//       phone,
//       address,
//       country,
//       isOrgAdmin: true,
//     });

//     // 3) Create Role (admin, all permissions)
//     const adminRole = await Role.create({
//       orgId: orgDoc._id,
//       userId: adminUser._id,
//       roleName: "admin",
//       permissions: ["ALL"],
//       isSystemRole: true,
//     });

//     // 4) Link roleId back to Fleet_User
//     adminUser.roleId = adminRole._id;
//     await adminUser.save();

//     // 5) Link adminUserId back to BusinessUser
//     orgDoc.adminUserId = adminUser._id;
//     await orgDoc.save();

//     res.status(201).json({
//       success: true,
//       message: "Business User, Admin User & Role created successfully",
//       data: {
//         businessUser: orgDoc,
//         adminUser,
//         role: adminRole,
//       },
//     });
//   } catch (error) {
//     // Manual rollback — since no transaction, clean up whatever got created
//     try {
//       if (adminUser?._id) {
//         await Role.deleteMany({ userId: adminUser._id });
//         await FleetUser.findByIdAndDelete(adminUser._id);
//       }
//       if (orgDoc?._id) {
//         await BusinessUser.findByIdAndDelete(orgDoc._id);
//       }
//     } catch (cleanupError) {
//       console.error("Rollback cleanup failed:", cleanupError.message);
//     }

//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// // Get All Users
// export const getAllUsers = async (req, res) => {
//   try {
//     const users = await BusinessUser.find({ isDelete: false });

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

// // Get Single User
// export const getSingleUser = async (req, res) => {
//   try {
//     const user = await BusinessUser.findById(req.params.id);

//     if (!user || user.isDelete) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found",
//       });
//     }

//     res.status(200).json({
//       success: true,
//       data: user,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// // Update Business User (+ sync linked Fleet_User admin)
// export const updateUser = async (req, res) => {
//   try {
//     const {
//       organizationName,
//       email,
//       country,
//       countryCode,
//       currency,
//       currencySymbol,
//       phone,
//       address,
//       subscriptionPlan,
//       isActive,
//       status,
//     } = req.body;

//     // 1) Update BusinessUser
//     const orgDoc = await BusinessUser.findByIdAndUpdate(
//       req.params.id,
//       {
//         organizationName,
//         email,
//         country,
//         countryCode,
//         currency,
//         currencySymbol,
//         phone,
//         address,
//         subscriptionPlan,
//         isActive,
//         status,
//       },
//       { new: true, runValidators: true },
//     );

//     if (!orgDoc) {
//       return res.status(404).json({
//         success: false,
//         message: "Organization not found",
//       });
//     }

//     // 2) Sync linked Fleet_User (org admin) — keep contact/basic details in sync
//     if (orgDoc.adminUserId) {
//       await FleetUser.findByIdAndUpdate(
//         orgDoc.adminUserId,
//         {
//           email,
//           country,
//           phone,
//           address,
//           isActive,
//           ...(status && {
//             status: status === "suspended" ? "blocked" : status,
//           }),
//         },
//         { new: true, runValidators: true },
//       );
//     }

//     res.status(200).json({
//       success: true,
//       message: "Organization Updated Successfully",
//       data: orgDoc,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// // Delete Business User (Soft Delete, + sync Fleet_User + Role)
// export const deleteUser = async (req, res) => {
//   try {
//     const orgDoc = await BusinessUser.findByIdAndUpdate(
//       req.params.id,
//       {
//         isDelete: true,
//         isActive: false,
//         status: "suspended",
//       },
//       { new: true },
//     );

//     if (!orgDoc) {
//       return res.status(404).json({
//         success: false,
//         message: "Organization not found",
//       });
//     }

//     // Soft-delete linked Fleet_User (org admin)
//     if (orgDoc.adminUserId) {
//       await FleetUser.findByIdAndUpdate(orgDoc.adminUserId, {
//         isDelete: true,
//         isActive: false,
//         status: "blocked",
//       });

//       // Deactivate the admin role tied to this user as well
//       await Role.updateMany(
//         { userId: orgDoc.adminUserId },
//         { isActive: false, status: "inactive" },
//       );
//     }

//     res.status(200).json({
//       success: true,
//       message: "Organization Deleted Successfully",
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// // Change Status
// export const changeStatus = async (req, res) => {
//   try {
//     const user = await User.findById(req.params.id);

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found",
//       });
//     }

//     user.isActive = !user.isActive;

//     await user.save();

//     res.status(200).json({
//       success: true,
//       message: "Status Updated",
//       data: user,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

import { User as BusinessUser } from "../../../models/SuperAdmin/Auth/Bussiness_User.js";
import { User as FleetUser } from "../../../models/SuperAdmin/Orgainization/User.js";
import { Role } from "../../../models/SuperAdmin/Orgainization/Role.js";

export const createUser = async (req, res) => {
  let orgDoc = null;
  let adminUser = null;

  try {
    const {
      organizationName,
      email,
      password,
      country, // { id, name, iso2, phonecode, currency, currencyName, currencySymbol, flag, timezones }
      state, // { id, name }
      city, // { id, name }
      phone,
      address,
      logo,
      subscriptionPlan,
    } = req.body;

    const emailExist = await BusinessUser.findOne({ email });
    if (emailExist) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    const organizationCode = `ORG-${uuidv4()
      .replace(/-/g, "")
      .substring(0, 8)
      .toUpperCase()}`;

    const hashPassword = await bcrypt.hash(password, 10);

    // 1) Create BusinessUser
    orgDoc = await BusinessUser.create({
      organizationName,
      organizationCode,
      email,
      password: hashPassword,
      country,
      state,
      city,
      phone,
      address,
      logo,
      subscriptionPlan,
    });

    // 2) Create Fleet_User (org admin)
    adminUser = await FleetUser.create({
      orgId: orgDoc._id,
      name: organizationName,
      email,
      password: hashPassword,
      phone,
      address,
      // country: country?.name || "",
      isOrgAdmin: true,
    });

    // 3) Create Role (admin, all permissions)
    const adminRole = await Role.create({
      orgId: orgDoc._id,
      userId: adminUser._id,
      roleName: "admin",
      permissions: ["ALL"],
      isSystemRole: true,
    });

    // 4) Link roleId back to Fleet_User
    adminUser.roleId = adminRole._id;
    await adminUser.save();

    // 5) Link adminUserId back to BusinessUser
    orgDoc.adminUserId = adminUser._id;
    await orgDoc.save();

    res.status(201).json({
      success: true,
      message: "Business User, Admin User & Role created successfully",
      data: {
        businessUser: orgDoc,
        adminUser,
        role: adminRole,
      },
    });
  } catch (error) {
    // Manual rollback — since no transaction, clean up whatever got created
    try {
      if (adminUser?._id) {
        await Role.deleteMany({ userId: adminUser._id });
        await FleetUser.findByIdAndDelete(adminUser._id);
      }
      if (orgDoc?._id) {
        await BusinessUser.findByIdAndDelete(orgDoc._id);
      }
    } catch (cleanupError) {
      console.error("Rollback cleanup failed:", cleanupError.message);
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get All Users
export const getAllUsers = async (req, res) => {
  try {
    const users = await BusinessUser.find({ isDelete: false });

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

// Get Single User
export const getSingleUser = async (req, res) => {
  try {
    const user = await BusinessUser.findById(req.params.id);

    if (!user || user.isDelete) {
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

// Update Business User (+ sync linked Fleet_User admin)
export const updateUser = async (req, res) => {
  try {
    const {
      organizationName,
      email,
      country, // { id, name, iso2, phonecode, currency, currencyName, currencySymbol, flag, timezones }
      state, // { id, name }
      city, // { id, name }
      phone,
      address,
      subscriptionPlan,
      isActive,
      status,
    } = req.body;

    // 1) Update BusinessUser
    const orgDoc = await BusinessUser.findByIdAndUpdate(
      req.params.id,
      {
        organizationName,
        email,
        country,
        state,
        city,
        phone,
        address,
        subscriptionPlan,
        isActive,
        status,
      },
      { new: true, runValidators: true },
    );

    if (!orgDoc) {
      return res.status(404).json({
        success: false,
        message: "Organization not found",
      });
    }

    // 2) Sync linked Fleet_User (org admin) — keep contact/basic details in sync
    if (orgDoc.adminUserId) {
      await FleetUser.findByIdAndUpdate(
        orgDoc.adminUserId,
        {
          email,
          // country: country?.name,
          phone,
          address,
          isActive,
          ...(status && {
            status: status === "suspended" ? "blocked" : status,
          }),
        },
        { new: true, runValidators: true },
      );
    }

    res.status(200).json({
      success: true,
      message: "Organization Updated Successfully",
      data: orgDoc,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete Business User (Soft Delete, + sync Fleet_User + Role)
export const deleteUser = async (req, res) => {
  try {
    const orgDoc = await BusinessUser.findByIdAndUpdate(
      req.params.id,
      {
        isDelete: true,
        isActive: false,
        status: "suspended",
      },
      { new: true },
    );

    if (!orgDoc) {
      return res.status(404).json({
        success: false,
        message: "Organization not found",
      });
    }

    // Soft-delete linked Fleet_User (org admin)
    if (orgDoc.adminUserId) {
      await FleetUser.findByIdAndUpdate(orgDoc.adminUserId, {
        isDelete: true,
        isActive: false,
        status: "blocked",
      });

      // Deactivate the admin role tied to this user as well
      await Role.updateMany(
        { userId: orgDoc.adminUserId },
        { isActive: false, status: "inactive" },
      );
    }

    res.status(200).json({
      success: true,
      message: "Organization Deleted Successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Change Status
export const changeStatus = async (req, res) => {
  try {
    const user = await BusinessUser.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.isActive = !user.isActive;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Status Updated",
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
