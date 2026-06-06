import { User } from "../../../models/SuperAdmin/Auth/User.js";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";

// SIGNUP
export const signup = async (req, res) => {
  try {
    const { name, adminEmail, phone, password, organization } = req.body;
    const role = "admin";

    const existingAdmin = await User.findOne({
      adminEmail: adminEmail,
      role: "admin",
      isDelete: false,
    });

    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: "This email is already registered as admin",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const organizationId = `ORG-${uuidv4()
      .replace(/-/g, "")
      .substring(0, 8)
      .toUpperCase()}`;

    const user = await User.create({
      organizationId,
      name,
      role,
      adminEmail,
      phone,
      password: hashedPassword,
      planpassword: password,
      organization,
    });

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Check Email
export const checkEmail = async (req, res) => {
  try {
    const { email } = req.body;

    const users = await User.find({
      $or: [{ adminEmail: email }, { userEmail: email }],
    });

    if (!users.length) {
      return res.status(404).json({
        success: false,
        message: "Email not found",
      });
    }

    if (users.length === 1) {
      return res.status(200).json({
        success: true,
        type: "single",
        role: users[0].role,
        organization: users[0].organization,
      });
    }

    const roles = [...new Set(users.map((u) => u.role))];

    const organizations = roles.map((role) => ({
      role,
      orgs: users.filter((u) => u.role === role).map((u) => u.organization),
    }));

    return res.status(200).json({
      success: true,
      type: "multiple",
      roles,
      organizations,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Check Role
export const getRoleAccounts = async (req, res) => {
  try {
    const { email, role } = req.body;

    const users = await User.find({
      role,
      $or: [{ adminEmail: email }, { userEmail: email }],
    });

    if (!users.length) {
      return res.status(404).json({
        success: false,
        message: "No account found",
      });
    }

    if (users.length === 1) {
      return res.status(200).json({
        success: true,
        type: "single",
        userId: users[0]._id,
      });
    }

    const organizations = users.map((u) => ({
      userId: u._id,
      organization: u.organization,
    }));

    return res.status(200).json({
      success: true,
      type: "organization-selection",
      organizations,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// LOGIN
export const login = async (req, res) => {
  try {
    const { email, password, role, organization } = req.body;

    let query = {
      $or: [{ adminEmail: email }, { userEmail: email }],
    };

    if (role) {
      query.role = role;
    }

    if (organization) {
      query.organization = new RegExp(`^${organization}$`, "i");
    }

    const user = await User.findOne(query);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.isDelete) {
      return res.status(400).json({
        success: false,
        message: "Account deleted",
      });
    }

    if (!user.isActive) {
      return res.status(400).json({
        success: false,
        message: "Account inactive",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        email: user.adminEmail || user.userEmail,
        role: user.role,
        organization: user.organization,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );

    return res.status(200).json({
      success: true,
      token,
      _id: user._id,
      organizationId: user.organizationId,
      role: user.role,
      organization: user.organization,
      user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// LOGOUT
export const logout = async (req, res) => {
  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

// GET ALL USERS
export const getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password -planpassword");
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET USER BY ID
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      "-password -planpassword",
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// REGISTER
export const register = async (req, res) => {
  try {
    const { name, userEmail, phone, role, organization, organizationId } =
      req.body;

    const password = "123456";

    console.log(req.body);

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      organizationId,
      name,
      role,
      userEmail,
      phone,
      password: hashedPassword,
      planpassword: password,
      organization,
    });

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// RESET PASSWORD
export const resetPassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "New password must be at least 6 characters",
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Old password is incorrect",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.planpassword = newPassword;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: error.message,
    });
  }
};
