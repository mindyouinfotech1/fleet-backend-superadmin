import { User } from "../../../models/SuperAdmin/Auth/Bussiness_User.js";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

export const createUser = async (req, res) => {
  try {
    const { organizationName, Email, password, organization } = req.body;

    // Check Email
    const emailExist = await User.findOne({ Email });

    if (emailExist) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    // Generate Organization ID
    const organizationId = `ORG-${uuidv4()
      .replace(/-/g, "")
      .substring(0, 8)
      .toUpperCase()}`;

    // Hash Password
    const hashPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      organizationId,
      organizationName,
      Email,
      password: hashPassword,
      organization,
    });

    res.status(201).json({
      success: true,
      message: "Business User Created Successfully",
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get All Users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ isDelete: false });

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
    const user = await User.findById(req.params.id);

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

// Update User
export const updateUser = async (req, res) => {
  try {
    const { organizationName, Email, organization, isActive } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        organizationName,
        Email,
        organization,
        isActive,
      },
      {
        new: true,
      }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "User Updated",
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};




// Delete User (Soft Delete)
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        isDelete: true,
      },
      {
        new: true,
      }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "User Deleted Successfully",
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
    const user = await User.findById(req.params.id);

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