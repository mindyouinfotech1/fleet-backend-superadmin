import { PayrollRecord } from "../../../models/User/Drivers/PayrollRecord.js";
import mongoose from "mongoose";

/**
 * CREATE Payroll Record
 */
export const createPayrollRecord = async (req, res) => {
  try {
    const payload = req.body;

    // console.log(payload);

    const record = await PayrollRecord.create(payload);

    // ================= SOCKET =================
    const io = req.app.get("io");
    if (io) io.emit("payrollCreated", record);

    return res.status(201).json({
      success: true,
      message: "Payroll record created successfully",
      data: record,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * GET ALL Payroll Records
 */
export const getAllPayrollRecords = async (req, res) => {
  try {
    const { driverId, status, wagesType, page = 1, limit = 10 } = req.query;

    const query = { isDeleted: false };

    if (driverId) query.driverId = driverId;
    if (status) query.status = status;
    if (wagesType) query.wagesType = wagesType;

    const skip = (Number(page) - 1) * Number(limit);

    const [data, total] = await Promise.all([
      PayrollRecord.find(query)
        .populate("driverId")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      PayrollRecord.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * GET BY DRIVER (STRICT)
 */
export const getAllPayrollRecordsByDriver = async (req, res) => {
  try {
    const { driverId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(driverId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid driverId",
      });
    }

    const data = await PayrollRecord.find({
      isDeleted: false,
      driverId,
    })
      .populate("driverId")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getPayrollByDriver = async (req, res) => {
  try {
    const { driverId } = req.params;

    const records = await PayrollRecord.find({
      driverId,
      isDeleted: false,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * GET SINGLE
 */
export const getPayrollRecordById = async (req, res) => {
  try {
    const { id } = req.params;

    const record = await PayrollRecord.findOne({
      _id: id,
      isDeleted: false,
    }).populate("driverId");

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Payroll record not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: record,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * UPDATE Payroll Record
 */
export const updatePayrollRecord = async (req, res) => {
  try {
    const { id } = req.params;

    const record = await PayrollRecord.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: req.body },
      { new: true, runValidators: true },
    );

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Payroll record not found",
      });
    }

    // ================= SOCKET =================
    const io = req.app.get("io");
    if (io) io.emit("payrollUpdated", record);

    return res.status(200).json({
      success: true,
      message: "Payroll record updated successfully",
      data: record,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * SOFT DELETE
 */
export const deletePayrollRecord = async (req, res) => {
  try {
    const { id } = req.params;

    const record = await PayrollRecord.findOneAndUpdate(
      { _id: id },
      { $set: { isDeleted: true, status: "Inactive" } },
      { new: true },
    );

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Payroll record not found",
      });
    }

    // ================= SOCKET =================
    const io = req.app.get("io");
    if (io) io.emit("payrollDeleted", id);

    return res.status(200).json({
      success: true,
      message: "Payroll record deleted successfully (soft delete)",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * TOGGLE STATUS
 */
export const togglePayrollStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const record = await PayrollRecord.findById(id);

    if (!record || record.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Payroll record not found",
      });
    }

    record.status = record.status === "Active" ? "Inactive" : "Active";
    await record.save();

    // ================= SOCKET =================
    const io = req.app.get("io");
    if (io)
      io.emit("payrollStatusChanged", {
        id: record._id,
        status: record.status,
        record,
      });

    return res.status(200).json({
      success: true,
      message: "Status updated successfully",
      data: record,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
