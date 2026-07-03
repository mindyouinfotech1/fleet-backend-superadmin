import User from "../../../models/SuperAdmin/Auth/Users.js";

import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";


export const createUser = async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      email,
      password,
      role_id,
      role_slug,
      country,
      tenant_id,
      address,
      employment_type,
      employee_id,
      license,
      medical,
      nhvr_compliance,
      fmcsa_compliance,
      emergency_contact,
      preferred_language,
    } = req.body;

    // console.log(req.body);

    // 1. Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // 2. Automatically sync compliance ruleset based on country
    let compliance_ruleset = "NHVR";
    if (country === "US") compliance_ruleset = "FMCSA";

    // 3. Create fresh user object
    const userData = {
      first_name,
      last_name,
      email,
      password_hash: password, // Mongoose pre-save hook will hash this automatically
      role_id,
      role_slug,
      country,
      compliance_ruleset,
      tenant_id: role_slug === "super_admin" ? null : tenant_id,
      address,
      employment_type,
      employee_id,
      license,
      medical,
      emergency_contact,
      preferred_language,
    };

    // 4. Clean up cross-country compliance data to avoid corrupted data
    if (country === "AU" && nhvr_compliance)
      userData.nhvr_compliance = nhvr_compliance;
    if (country === "US" && fmcsa_compliance)
      userData.fmcsa_compliance = fmcsa_compliance;
    console.log("userData", userData);

    const user = await User.create(userData);

    // const userResponse = user.toObject();
    // delete userResponse.password_hash;

    return res.status(201).json({
      message: "User created successfully",
      // user: userResponse,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};


export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find active user and explicitly select password_hash
    const user = await User.findOne({
      email: email.toLowerCase(),
      status: { $ne: "deleted" },
    }).select("+password_hash");

    if (!user || user.status === "inactive" || user.status === "suspended") {
      return res
        .status(404)
        .json({ message: "User not found or account is restricted" });
    }

    // Verify Password via schema method
    const isMatch = await user.verifyPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT Token
    const token = jwt.sign(
      { id: user._id, role: user.role_slug, tenant_id: user.tenant_id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    // Update login audit fields
    user.last_login_at = new Date();
    // IP extraction safely (assuming express proxy setup if applicable)
    user.last_login_ip =
      req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password_hash;

    return res
      .status(200)
      .json({ message: "Login successful", token, user: userResponse });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};


export const getUsers = async (req, res) => {
  try {
    const { tenant_id, role_slug, country, status } = req.query;

    // Don't return soft deleted users by default
    const filter = { status: { $ne: "deleted" } };

    if (tenant_id) filter.tenant_id = tenant_id;
    if (role_slug) filter.role_slug = role_slug;
    if (country) filter.country = country;
    if (status) filter.status = status;

    const users = await User.find(filter)
      .populate("role_id")
      .populate("assigned_vehicles");

    return res.status(200).json(users);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};


export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const user = await User.findOne({ _id: id, status: { $ne: "deleted" } })
      .populate("role_id")
      .populate("assigned_vehicles");

    if (!user) return res.status(404).json({ message: "User not found" });

    return res.status(200).json(user);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};


export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const user = await User.findById(id);
    if (!user || user.status === "deleted") {
      return res.status(404).json({ message: "User not found" });
    }

    // Password fields handle karne ke liye secure process
    if (req.body.password) {
      user.password_hash = await bcrypt.hash(req.body.password, 12);
      user.password_changed_at = new Date();
      delete req.body.password;
    }

    // Sync ruleset if country is changing
    if (req.body.country) {
      req.body.compliance_ruleset =
        req.body.country === "US" ? "FMCSA" : "NHVR";
    }

    // Apply all incoming changes dynamically safely
    Object.keys(req.body).forEach((key) => {
      // Prevent manual alteration of system fields via profile update
      if (!["password_hash", "email", "_id"].includes(key)) {
        user[key] = req.body[key];
      }
    });

    await user.save(); // Triggers schemas standard validations seamlessly

    return res.status(200).json({ message: "User updated successfully", user });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};


export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const user = await User.findByIdAndUpdate(
      id,
      {
        $set: {
          deleted_at: new Date(),
          status: "deleted",
        },
      },
      { new: true },
    );

    if (!user) return res.status(404).json({ message: "User not found" });

    return res.status(200).json({ message: "User soft deleted successfully" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};


export const updateCompliance = async (req, res) => {
  try {
    const { id } = req.params;
    const { country, nhvr_compliance, fmcsa_compliance } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const updateData = {};

    // Country specific structured validation logic
    if (country === "AU" && nhvr_compliance) {
      updateData.nhvr_compliance = nhvr_compliance;
      updateData.compliance_ruleset = "NHVR";
      updateData.country = "AU";
    } else if (country === "US" && fmcsa_compliance) {
      updateData.fmcsa_compliance = fmcsa_compliance;
      updateData.compliance_ruleset = "FMCSA";
      updateData.country = "US";
    } else {
      return res.status(400).json({
        message:
          "Invalid compliance body parameters matching with country structural constraints.",
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true },
    );

    if (!user) return res.status(404).json({ message: "User not found" });

    return res
      .status(200)
      .json({ message: "Compliance info updated accurately.", user });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};


export const assignVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const { vehicleIds } = req.body; // Expecting an array of vehicle objectIds

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { $set: { assigned_vehicles: vehicleIds } },
      { new: true },
    ).populate("assigned_vehicles");

    if (!user) return res.status(404).json({ message: "User not found" });

    return res
      .status(200)
      .json({ message: "Vehicles assigned successfully", user });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
