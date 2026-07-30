import mongoose from "mongoose";
import { InspectionQuestion } from "../../../models/User/Work_Order_Trip/Insp_Question.js";


const getOrgId = (req) => req.user?.organizationId || req.user?._id;


export const createInspectionQuestion = async (req, res) => {
  try {
    // const organizationId = getOrgId(req);
    const { organizationId, equipmentId, categories } = req.body;

    if (!equipmentId) {
      return res.status(400).json({
        success: false,
        message: "equipmentId is required",
      });
    }

    // Agar is equipment ke liye pehle se doc bana hai to duplicate mat banao
    const existing = await InspectionQuestion.findOne({
      organizationId,
      equipmentId,
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message:
          "Inspection questions already exist for this equipment. Use update/add-category instead.",
        data: existing,
      });
    }

    const newDoc = await InspectionQuestion.create({
      organizationId,
      equipmentId,
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
    // console.log("req.query", req.query);
    // const organizationId = getOrgId(req);
    const {
      organizationId,
      equipmentId,
      search,
      page = 1,
      limit = 10,
    } = req.query;

    const filter = { organizationId };
    if (equipmentId) filter.equipmentId = equipmentId;

    if (search) {
      filter.$or = [
        { "categories.categoryName": { $regex: search, $options: "i" } },
        { "categories.questions.question": { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [data, total] = await Promise.all([
      InspectionQuestion.find(filter)
        .populate(
          "equipmentId",
          "equipmentType equipmentName equipmentIdNo registrationNumber",
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      InspectionQuestion.countDocuments(filter),
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
    // const organizationId = getOrgId(req);
    const { organizationId, id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const doc = await InspectionQuestion.findOne({
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
    // const organizationId = getOrgId(req);
    const { organizationId, equipmentId } = req.params;

    const doc = await InspectionQuestion.findOne({
      organizationId,
      equipmentId,
    }).populate("equipmentId", "name code type");

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
    // const organizationId = getOrgId(req);
    const { id } = req.params;
    const { organizationId, categories, equipmentId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const updated = await InspectionQuestion.findOneAndUpdate(
      { _id: id, organizationId },
      {
        ...(equipmentId && { equipmentId }),
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
    // const organizationId = getOrgId(req);
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const deleted = await InspectionQuestion.findOneAndDelete({
      _id: id,
      // organizationId,
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
    // const organizationId = getOrgId(req);
    const { id } = req.params; // InspectionQuestion doc _id
    const { organizationId, categoryName, questions = [] } = req.body;

    const updated = await InspectionQuestion.findOneAndUpdate(
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
    // const organizationId = getOrgId(req);
    const { id, categoryId } = req.params;
    const { organizationId, categoryName } = req.body;

    const updated = await InspectionQuestion.findOneAndUpdate(
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
    // const organizationId = getOrgId(req);
    const { organizationId, id, categoryId } = req.params;

    const updated = await InspectionQuestion.findOneAndUpdate(
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
    // const organizationId = getOrgId(req);
    const { organizationId, id, categoryId } = req.params;
    const {
      question,
      answer,
      isMandatory = true,
      priority = "medium",
    } = req.body;

    if (!question || !answer) {
      return res.status(400).json({
        success: false,
        message: "question and answer are required",
      });
    }

    const updated = await InspectionQuestion.findOneAndUpdate(
      {
        _id: id,
        organizationId,
        "categories._id": categoryId,
      },
      {
        $push: {
          "categories.$.questions": { question, answer, isMandatory, priority },
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
    // const organizationId = getOrgId(req);
    const { organizationId, id, categoryId, questionId } = req.params;
    const { question, answer, isMandatory, priority } = req.body;

    const setFields = {};
    if (question !== undefined)
      setFields["categories.$[cat].questions.$[q].question"] = question;
    if (answer !== undefined)
      setFields["categories.$[cat].questions.$[q].answer"] = answer;
    if (isMandatory !== undefined)
      setFields["categories.$[cat].questions.$[q].isMandatory"] = isMandatory;
    if (priority !== undefined)
      setFields["categories.$[cat].questions.$[q].priority"] = priority;

    const updated = await InspectionQuestion.findOneAndUpdate(
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
    const organizationId = getOrgId(req);
    const { id, categoryId, questionId } = req.params;

    const updated = await InspectionQuestion.findOneAndUpdate(
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
