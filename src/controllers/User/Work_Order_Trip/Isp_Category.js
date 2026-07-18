import { Category } from "../../../models/User/Work_Order_Trip/Isp_Category.js";
import mongoose from "mongoose";

export const createCategory = async (req, res) => {
  try {
    const { organizationId, equipmentId, categoryName, description } = req.body;

    if (!organizationId || !categoryName) {
      return res.status(400).json({
        success: false,
        message: "OrganizationId and Category Name are required.",
      });
    }

    const existingCategory = await Category.findOne({
      organizationId,
      equipmentId: equipmentId || null,
      categoryName,
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: "Category already exists.",
      });
    }

    const category = await Category.create({
      organizationId,
      equipmentId: equipmentId || null,
      categoryName,
      description,
    });

    res.status(201).json({
      success: true,
      message: "Category created successfully.",
      data: category,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllCategories = async (req, res) => {
  try {
    const { organizationId, equipmentId, status } = req.query;

    let filter = {};

    if (organizationId) filter.organizationId = organizationId;

    if (equipmentId) filter.equipmentId = equipmentId;

    if (status !== undefined) {
      filter.status = status === "true";
    }

    const categories = await Category.find(filter)
      .populate("organizationId", "name email")
      .populate("equipmentId", "equipmentName")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Category Id",
      });
    }

    const category = await Category.findById(id)
      .populate("organizationId", "name email")
      .populate("equipmentId", "equipmentName");

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found.",
      });
    }

    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const { organizationId, equipmentId, categoryName, description, status } =
      req.body;

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found.",
      });
    }

    if (
      categoryName &&
      (categoryName !== category.categoryName ||
        String(category.organizationId) !== organizationId ||
        String(category.equipmentId) !== String(equipmentId))
    ) {
      const duplicate = await Category.findOne({
        _id: { $ne: id },
        organizationId,
        equipmentId: equipmentId || null,
        categoryName,
      });

      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: "Category already exists.",
        });
      }
    }

    category.organizationId = organizationId;
    category.equipmentId = equipmentId || null;
    category.categoryName = categoryName;
    category.description = description;
    category.status = status;

    await category.save();

    res.status(200).json({
      success: true,
      message: "Category updated successfully.",
      data: category,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found.",
      });
    }

    await category.deleteOne();

    res.status(200).json({
      success: true,
      message: "Category deleted successfully.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const changeCategoryStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found.",
      });
    }

    category.status = !category.status;

    await category.save();

    res.status(200).json({
      success: true,
      message: "Category status updated successfully.",
      data: category,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
