import fs from "fs";
import path from "path";
import { Branch } from "../../../models/SuperAdmin/Auth/Branch.js";
import { UPLOAD_PATHS } from "../../../config/uploadConfig.js";
import { generateCode } from "../../../controllers/generateCode.js";

export const createBranch = async (req, res) => {
  try {
    const {
      organizationId,
      branchName,
      email,
      phone,
      country,
      state,
      city,
      zipCode,
      address,
      timezone,
      currency,
      currencySymbol,
      isHeadOffice,
      isActive,
      status,
    } = req.body;

    const branchCode = await generateCode(organizationId, "branch", "BRCH");

    const exists = await Branch.findOne({
      organizationId,
      branchCode: branchCode.toUpperCase(),
      isDelete: false,
    });

    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Branch Code already exists.",
      });
    }

    let logo = "";

    if (req.file) {
      logo = req.file.path;
    }

    const branch = await Branch.create({
      organizationId,
      branchName,
      branchCode,
      email,
      phone,
      country,
      state,
      city,
      zipCode,
      address,
      timezone,
      currency,
      currencySymbol,
      logo,
      isHeadOffice,
      isActive,
      status,
    });

    const io = req.app.get("io");
    if (io) io.emit("branchCreated", branch);

    res.status(201).json({
      success: true,
      message: "Branch created successfully.",
      data: branch,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateBranch = async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id);

    if (!branch || branch.isDelete) {
      return res.status(404).json({
        success: false,
        message: "Branch not found.",
      });
    }

    if (
      req.body.branchCode &&
      req.body.branchCode.toUpperCase() !== branch.branchCode
    ) {
      const exists = await Branch.findOne({
        organizationId: branch.organizationId,
        branchCode: req.body.branchCode.toUpperCase(),
        _id: { $ne: branch._id },
        isDelete: false,
      });

      if (exists) {
        return res.status(400).json({
          success: false,
          message: "Branch Code already exists.",
        });
      }
    }

    if (req.file) {
      if (branch.logo) {
        const oldFile = branch.logo;

        if (fs.existsSync(oldFile)) {
          fs.unlinkSync(oldFile);
        }
      }

      branch.logo = req.file.path;
    }

    Object.assign(branch, req.body);

    await branch.save();

    const io = req.app.get("io");
    if (io) io.emit("branchUpdated", branch);

    res.json({
      success: true,
      message: "Branch updated successfully.",
      data: branch,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllBranches = async (req, res) => {
  try {
    const branches = await Branch.find({
      isDelete: false,
    }).populate("organizationId");

    res.json({
      success: true,
      data: branches,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getBranchesByOrganization = async (req, res) => {
  try {
    const branches = await Branch.find({
      organizationId: req.params.organizationId,
      isDelete: false,
    });

    res.json({
      success: true,
      data: branches,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getBranchById = async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id).populate(
      "organizationId",
    );

    if (!branch || branch.isDelete) {
      return res.status(404).json({
        success: false,
        message: "Branch not found.",
      });
    }

    res.json({
      success: true,
      data: branch,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteBranch = async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id);

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Branch not found.",
      });
    }

    branch.isDelete = true;

    await branch.save();

    const io = req.app.get("io");
    if (io) io.emit("branchDeleted", req.params.id);

    res.json({
      success: true,
      message: "Branch deleted successfully.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateBranchStatus = async (req, res) => {
  try {
    const { status, isActive } = req.body;

    const branch = await Branch.findById(req.params.id);

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Branch not found.",
      });
    }

    if (status !== undefined) branch.status = status;

    if (isActive !== undefined) branch.isActive = isActive;

    await branch.save();

    const io = req.app.get("io");
    if (io) io.emit("branchStatusChanged", branch);

    res.json({
      success: true,
      message: "Status updated successfully.",
      data: branch,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
