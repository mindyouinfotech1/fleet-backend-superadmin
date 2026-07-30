import { Expense } from "../../../models/User/Work_Order_Trip/Expense.js";

import mongoose from "mongoose";

// CREATE EXPENSE
export const createExpense = async (req, res) => {
  try {
    const {
      organizationId,
      tripId,
      driverId,
      expenseType,
      expenseName,
      date,
      amount,
      description,
      additionalDetails,
    } = req.body;

    let receiptFile = "";

    if (req.files?.receipt) {
      receiptFile = `/uploads/expenses/${req.files.receipt[0].filename}`;
    }

    const expense = await Expense.create({
      organizationId,
      tripId,
      driverId,
      expenseType,
      expenseName,
      date,
      amount,
      description,
      additionalDetails: additionalDetails ? JSON.parse(additionalDetails) : {},
      receiptFile,
    });

    // SOCKET
    if (req.io) {
      req.io.to(organizationId.toString()).emit("expenseCreated", expense);
    }

    return res.status(201).json({
      success: true,
      message: "Expense created successfully",
      data: expense,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET ALL EXPENSE
export const getAllExpenses = async (req, res) => {
  try {
    const { organizationId, tripId, driverId } = req.query;

    let filter = {
      isDeleted: false,
    };

    if (organizationId) filter.organizationId = organizationId;

    if (tripId) filter.tripId = tripId;

    if (driverId) filter.driverId = driverId;

    const expenses = await Expense.find(filter)
      .populate("organizationId")
      .populate("tripId")
      .populate("driverId")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: expenses,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET BY ID
export const getExpenseById = async (req, res) => {
  try {
    const expense = await Expense.findOne({
      _id: req.params.id,
      isDeleted: false,
    })
      .populate("organizationId")
      .populate("tripId")
      .populate("driverId");

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    res.json({
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

export const getExpensesByTripId = async (req, res) => {
  try {
    const { tripId } = req.params;

    const expenses = await Expense.find({
      tripId: tripId,
      isDeleted: false,
    })
      .populate("organizationId")
      .populate("tripId")
      .populate("driverId")
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



// UPDATE EXPENSE
export const updateExpense = async (req, res) => {
  try {
    const updateData = {
      ...req.body,
    };

    if (req.files?.receipt) {
      updateData.receiptFile = `/uploads/expenses/${req.files.receipt[0].filename}`;
    }

    const expense = await Expense.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });

    if (req.io) {
      req.io
        .to(expense.organizationId.toString())
        .emit("expenseUpdated", expense);
    }

    res.json({
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

// DELETE EXPENSE (SOFT DELETE)
export const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findByIdAndUpdate(
      req.params.id,
      {
        isDeleted: true,
      },
      {
        new: true,
      },
    );

    if (req.io) {
      req.io
        .to(expense.organizationId.toString())
        .emit("expenseDeleted", expense._id);
    }

    res.json({
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

// UPDATE STATUS
export const updateExpenseStatus = async (req, res) => {
  try {
    const expense = await Expense.findByIdAndUpdate(
      req.params.id,
      {
        status: req.body.status,
      },
      {
        new: true,
      },
    );

    if (req.io) {
      req.io
        .to(expense.organizationId.toString())
        .emit("expenseStatusUpdated", expense);
    }

    res.json({
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
