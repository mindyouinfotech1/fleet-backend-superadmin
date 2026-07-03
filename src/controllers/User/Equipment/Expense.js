import Expense from "../../../models/User/Maintenance/Expense.js";
import fs from "fs";

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

    const expense = await Expense.create({
      organizationId,
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

export const getAllExpenses = async (req, res) => {
  try {
    const { organizationId, driverId, equipmentId, status } = req.query;

    let filter = {};

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

export const getExpenseById = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id)
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

export const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    if (expense.receipt && fs.existsSync(expense.receipt)) {
      fs.unlinkSync(expense.receipt);
    }

    await expense.deleteOne();

    const io = req.app.get("io");
    if (io) io.emit("expenseDeleted", req.params.id);

    res.status(200).json({
      success: true,
      message: "Expense deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
