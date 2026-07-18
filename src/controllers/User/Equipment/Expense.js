import Expense from "../../../models/User/Maintenance/Expense.js";
import fs from "fs";
import path from "path";

import { generateCode } from "../../../controllers/generateCode.js";

export const createExpense = async (req, res) => {
  try {
    const {
      organizationId,
      equipmentId,
      driverId,
      expenseType,
      date,
      amount,
      description,
      paymentMode,
      tripId,
      status,
    } = req.body;

    const expenseCode = await generateCode(organizationId, "expense", "EXP");
    const expense = await Expense.create({
      organizationId,
      expenseCode,
      equipmentId,
      driverId,
      expenseType,
      date,
      amount,
      description,
      paymentMode,
      tripId: tripId || null,
      status,
      receipt: req.file ? `private/uploads/expense/${req.file.filename}` : "",
    });

    const io = req.app.get("io");
    if (io) io.emit("expenseCreated", expense);

    res.status(201).json({
      success: true,
      message: "Expense created successfully",
      data: expense,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteExpenseReceipt = async (req, res) => {
  try {
    const { expenseId } = req.params;

    const expense = await Expense.findById(expenseId);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    if (!expense.receipt) {
      return res.status(404).json({
        success: false,
        message: "Receipt not found",
      });
    }

    // Delete physical file (optional)
    const filePath = path.join(process.cwd(), expense.receipt);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Remove receipt from database
    expense.receipt = "";
    await expense.save();

    const io = req.app.get("io");
    if (io) io.emit("expenseUpdated", expense);

    return res.status(200).json({
      success: true,
      message: "Receipt deleted successfully",
      data: expense,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllExpenses = async (req, res) => {
  try {
    const { organizationId, driverId, equipmentId, status } = req.query;

    let filter = { isDeleted: false };

    if (organizationId) filter.organizationId = organizationId;
    if (driverId) filter.driverId = driverId;
    if (equipmentId) filter.equipmentId = equipmentId;
    if (status) filter.status = status;

    const expenses = await Expense.find(filter)
      .populate("organizationId")
      .populate("equipmentId")
      .populate("driverId")
      // .populate("tripId")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: expenses.length,
      data: expenses,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getExpensesByEquipment = async (req, res) => {
  try {
    const { equipmentId } = req.params;

    if (!equipmentId) {
      return res.status(400).json({
        success: false,
        message: "Equipment ID is required",
      });
    }

    const expenses = await Expense.find({
      equipmentId: equipmentId,
      isDeleted: false,
    })
      .populate("organizationId")
      .populate("equipmentId")
      .populate("driverId")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: expenses.length,
      data: expenses,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getExpenseById = async (req, res) => {
  try {
    const expense = await Expense.findOne({
      _id: req.params.id,
      isDeleted: false,
    })
      .populate("organizationId")
      .populate("equipmentId")
      .populate("driverId")
      .populate("tripId");

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    res.status(200).json({
      success: true,
      data: expense,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    if (req.file) {
      if (expense.receipt && fs.existsSync(expense.receipt)) {
        fs.unlinkSync(expense.receipt);
      }

      expense.receipt = `private/uploads/expense/${req.file.filename}`;
    }

    expense.organizationId = req.body.organizationId || expense.organizationId;

    expense.equipmentId = req.body.equipmentId || expense.equipmentId;

    expense.driverId = req.body.driverId || expense.driverId;

    expense.expenseType = req.body.expenseType || expense.expenseType;

    expense.date = req.body.date || expense.date;

    expense.amount = req.body.amount || expense.amount;

    expense.description = req.body.description || expense.description;

    expense.paymentMode = req.body.paymentMode || expense.paymentMode;

    expense.tripId = req.body.tripId || expense.tripId;

    expense.status = req.body.status || expense.status;

    await expense.save();

    const io = req.app.get("io");
    if (io) io.emit("expenseUpdated", expense);

    res.status(200).json({
      success: true,
      message: "Expense updated successfully",
      data: expense,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// export const deleteExpense = async (req, res) => {
//   try {
//     const expense = await Expense.findById(req.params.id);

//     if (!expense) {
//       return res.status(404).json({
//         success: false,
//         message: "Expense not found",
//       });
//     }

//     if (expense.receipt && fs.existsSync(expense.receipt)) {
//       fs.unlinkSync(expense.receipt);
//     }

//     await expense.deleteOne();

//     const io = req.app.get("io");
//     if (io) io.emit("expenseDeleted", req.params.id);

//     res.status(200).json({
//       success: true,
//       message: "Expense deleted successfully",
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

export const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    expense.isDeleted = true;
    expense.deletedAt = new Date();
    await expense.save();

    const io = req.app.get("io");
    if (io) io.emit("expenseDeleted", req.params.id);

    res.status(200).json({
      success: true,
      message: "Expense deleted successfully (soft delete)",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const restoreExpense = async (req, res) => {
  try {
    const expense = await Expense.findByIdAndUpdate(
      req.params.id,
      { isDeleted: false, deletedAt: null },
      { new: true },
    );

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    const io = req.app.get("io");
    if (io) io.emit("expenseRestored", expense);

    res.status(200).json({
      success: true,
      message: "Expense restored successfully",
      data: expense,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
