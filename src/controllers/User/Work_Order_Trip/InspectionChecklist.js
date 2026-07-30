import mongoose from "mongoose";
import { InspectionChecklist } from "../../../models/User/Work_Order_Trip/InspectionChecklist.js";

import { inspectionChecklist } from "../../../config/inspectionChecklist.js";

export const createInspectionQuestion = async (req, res) => {
  try {
    const {
      organizationId,
      equipmentId,
      inspectionType,
      inspectionTripType,
      categories,
    } = req.body;

    if (!equipmentId) {
      return res.status(400).json({
        success: false,
        message: "equipmentId is required",
      });
    }

    // Agar is equipment + inspectionType + inspectionTripType ke liye
    // pehle se doc bana hai to duplicate mat banao
    const existing = await InspectionChecklist.findOne({
      organizationId,
      equipmentId,
      inspectionType,
      inspectionTripType,
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message:
          "Inspection questions already exist for this equipment/inspection combination. Use update/add-category instead.",
        data: existing,
      });
    }

    const newDoc = await InspectionChecklist.create({
      organizationId,
      equipmentId,
      inspectionType,
      inspectionTripType,
      categories: categories || [],
    });

    return res.status(201).json({
      success: true,
      message: "Inspection question set created successfully",
      data: newDoc,
    });
  } catch (error) {
    console.error("createInspectionQuestion error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create inspection question",
      error: error.message,
    });
  }
};

export const getAllInspectionQuestions = async (req, res) => {
  try {
    const {
      organizationId,
      equipmentId,
      inspectionType,
      inspectionTripType,
      search,
      page = 1,
      limit = 10,
    } = req.query;

    const filter = { organizationId };
    if (equipmentId) filter.equipmentId = equipmentId;
    if (inspectionType) filter.inspectionType = inspectionType;
    if (inspectionTripType) filter.inspectionTripType = inspectionTripType;

    if (search) {
      filter.$or = [
        { "categories.categoryName": { $regex: search, $options: "i" } },
        { "categories.questions.question": { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [data, total] = await Promise.all([
      InspectionChecklist.find(filter)
        .populate(
          "equipmentId",
          "equipmentType equipmentName equipmentIdNo registrationNumber",
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      InspectionChecklist.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      count: data.length,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      data,
    });
  } catch (error) {
    console.error("getAllInspectionQuestions error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch inspection questions",
      error: error.message,
    });
  }
};

export const getInspectionQuestionById = async (req, res) => {
  try {
    const { organizationId, id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const doc = await InspectionChecklist.findOne({
      _id: id,
      organizationId,
    }).populate("equipmentId", "name code type");

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: "Inspection question set not found",
      });
    }

    return res.status(200).json({ success: true, data: doc });
  } catch (error) {
    console.error("getInspectionQuestionById error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch inspection question",
      error: error.message,
    });
  }
};

export const getInspectionQuestionByEquipment = async (req, res) => {
  try {
    const { organizationId, equipmentId } = req.params;
    const { inspectionType, inspectionTripType } = req.query;

    const filter = { organizationId, equipmentId };
    if (inspectionType) filter.inspectionType = inspectionType;
    if (inspectionTripType) filter.inspectionTripType = inspectionTripType;

    const doc = await InspectionChecklist.findOne(filter).populate(
      "equipmentId",
      "name code type",
    );

    if (!doc) {
      // 404 ki jagah empty structure return karna better UX hai
      return res.status(200).json({
        success: true,
        data: null,
        message: "No inspection questions set for this equipment yet",
      });
    }

    return res.status(200).json({ success: true, data: doc });
  } catch (error) {
    console.error("getInspectionQuestionByEquipment error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch inspection question",
      error: error.message,
    });
  }
};

export const updateInspectionQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      organizationId,
      categories,
      equipmentId,
      inspectionType,
      inspectionTripType,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const updated = await InspectionChecklist.findOneAndUpdate(
      { _id: id, organizationId },
      {
        ...(equipmentId && { equipmentId }),
        ...(inspectionType && { inspectionType }),
        ...(inspectionTripType && { inspectionTripType }),
        ...(categories && { categories }),
      },
      { new: true, runValidators: true },
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Inspection question set not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Inspection questions updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("updateInspectionQuestion error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update inspection question",
      error: error.message,
    });
  }
};

export const deleteInspectionQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const { organizationId } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const deleted = await InspectionChecklist.findOneAndDelete({
      _id: id,
      organizationId,
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Inspection question set not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Inspection question set deleted successfully",
    });
  } catch (error) {
    console.error("deleteInspectionQuestion error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete inspection question",
      error: error.message,
    });
  }
};

export const addCategory = async (req, res) => {
  try {
    const { id } = req.params; // InspectionChecklist doc _id
    const { organizationId, categoryName, questions = [] } = req.body;

    const updated = await InspectionChecklist.findOneAndUpdate(
      { _id: id, organizationId },
      {
        $push: {
          categories: { categoryName, questions },
        },
      },
      { new: true, runValidators: true },
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Inspection question set not found",
      });
    }

    return res.status(201).json({
      success: true,
      message: "Category added successfully",
      data: updated,
    });
  } catch (error) {
    console.error("addCategory error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add category",
      error: error.message,
    });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { id, categoryId } = req.params;
    const { organizationId, categoryName } = req.body;

    const updated = await InspectionChecklist.findOneAndUpdate(
      {
        _id: id,
        organizationId,
        "categories._id": categoryId,
      },
      {
        $set: { "categories.$.categoryName": categoryName },
      },
      { new: true, runValidators: true },
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("updateCategory error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update category",
      error: error.message,
    });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { organizationId, id, categoryId } = req.params;

    const updated = await InspectionChecklist.findOneAndUpdate(
      { _id: id, organizationId },
      {
        $pull: { categories: { _id: categoryId } },
      },
      { new: true },
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Inspection question set not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Category deleted successfully",
      data: updated,
    });
  } catch (error) {
    console.error("deleteCategory error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete category",
      error: error.message,
    });
  }
};

export const addQuestion = async (req, res) => {
  try {
    const { organizationId, id, categoryId } = req.params;
    const {
      question,
      expectedValue,
      isMandatory = true,
      priority = "medium",
    } = req.body;

    if (!question) {
      return res.status(400).json({
        success: false,
        message: "question is required",
      });
    }

    const updated = await InspectionChecklist.findOneAndUpdate(
      {
        _id: id,
        organizationId,
        "categories._id": categoryId,
      },
      {
        $push: {
          "categories.$.questions": {
            question,
            expectedValue,
            isMandatory,
            priority,
          },
        },
      },
      { new: true, runValidators: true },
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    return res.status(201).json({
      success: true,
      message: "Question added successfully",
      data: updated,
    });
  } catch (error) {
    console.error("addQuestion error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add question",
      error: error.message,
    });
  }
};

export const updateQuestion = async (req, res) => {
  try {
    const { organizationId, id, categoryId, questionId } = req.params;
    const { question, expectedValue, isMandatory, priority } = req.body;

    const setFields = {};
    if (question !== undefined)
      setFields["categories.$[cat].questions.$[q].question"] = question;
    if (expectedValue !== undefined)
      setFields["categories.$[cat].questions.$[q].expectedValue"] =
        expectedValue;
    if (isMandatory !== undefined)
      setFields["categories.$[cat].questions.$[q].isMandatory"] = isMandatory;
    if (priority !== undefined)
      setFields["categories.$[cat].questions.$[q].priority"] = priority;

    const updated = await InspectionChecklist.findOneAndUpdate(
      { _id: id, organizationId },
      { $set: setFields },
      {
        new: true,
        runValidators: true,
        arrayFilters: [{ "cat._id": categoryId }, { "q._id": questionId }],
      },
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Inspection question set not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Question updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("updateQuestion error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update question",
      error: error.message,
    });
  }
};

export const deleteQuestion = async (req, res) => {
  try {
    const { organizationId, id, categoryId, questionId } = req.params;

    const updated = await InspectionChecklist.findOneAndUpdate(
      {
        _id: id,
        organizationId,
        "categories._id": categoryId,
      },
      {
        $pull: { "categories.$.questions": { _id: questionId } },
      },
      { new: true },
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Question deleted successfully",
      data: updated,
    });
  } catch (error) {
    console.error("deleteQuestion error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete question",
      error: error.message,
    });
  }
};

export const generateAiInspectionQuestions = async (req, res) => {
  try {
    const { organizationId, equipmentId, equipmentName, equipmentType } =
      req.body;

    if (!equipmentType) {
      return res.status(400).json({
        success: false,
        message: "equipmentType is required",
      });
    }

    // Truck -> truck convert karega
    const type = equipmentType.toLowerCase();

    const data = inspectionChecklist[type];

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Checklist not found for this equipment type",
      });
    }

    return res.status(200).json({
      success: true,
      equipment: {
        organizationId,
        equipmentId,
        equipmentName,
        equipmentType,
      },
      data,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
