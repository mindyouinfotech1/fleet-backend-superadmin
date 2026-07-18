import mongoose from "mongoose";
import { InspectionQuestion } from "../../../models/User/Work_Order_Trip/EquipmentQuestion.js";

export const createInspectionQuestion = async (req, res) => {
  try {
    const { organizationId, equipmentId, categories } = req.body;

    if (!organizationId || !equipmentId) {
      return res.status(400).json({
        success: false,
        message: "organizationId and equipmentId are required",
      });
    }

    if (!Array.isArray(categories) || categories.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one category with questions is required",
      });
    }

    // Basic validation - har category me categoryId aur questions honi chahiye
    for (const cat of categories) {
      if (!cat.categoryId) {
        return res.status(400).json({
          success: false,
          message: "categoryId is required in every category",
        });
      }
      if (!Array.isArray(cat.questions) || cat.questions.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Each category must have at least one question",
        });
      }
      for (const q of cat.questions) {
        if (!q.question || !q.answer) {
          return res.status(400).json({
            success: false,
            message: "Each question must have both 'question' and 'answer'",
          });
        }
      }
    }

    const inspectionQuestion = await InspectionQuestion.create({
      organizationId,
      equipmentId,
      categories,
    });

    const io = req.app.get("io");
    if (io) io.emit("inspectionQuestionCreated", inspectionQuestion);

    return res.status(201).json({
      success: true,
      message: "Inspection question created successfully",
      data: inspectionQuestion,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllInspectionQuestions = async (req, res) => {
  try {
    const { organizationId, equipmentId, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (organizationId) filter.organizationId = organizationId;
    if (equipmentId) filter.equipmentId = equipmentId;

    const skip = (Number(page) - 1) * Number(limit);

    const [data, total] = await Promise.all([
      InspectionQuestion.find(filter)
        .populate("organizationId", "name email") // apni BusinessUser fields ke hisab se adjust karo
        .populate("equipmentId", "name") // apni Equipment fields ke hisab se adjust karo
        .populate("categories.categoryId", "name") // apni Category fields ke hisab se adjust karo
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      InspectionQuestion.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: "Inspection questions fetched successfully",
      total,
      page: Number(page),
      limit: Number(limit),
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getInspectionQuestionById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid inspection question ID",
      });
    }

    const inspectionQuestion = await InspectionQuestion.findById(id)
      .populate("organizationId", "name email")
      .populate("equipmentId", "name")
      .populate("categories.categoryId", "name");

    if (!inspectionQuestion) {
      return res.status(404).json({
        success: false,
        message: "Inspection question not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Inspection question fetched successfully",
      data: inspectionQuestion,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateInspectionQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const { organizationId, equipmentId, categories } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid inspection question ID",
      });
    }

    const existing = await InspectionQuestion.findById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Inspection question not found",
      });
    }

    if (organizationId) existing.organizationId = organizationId;
    if (equipmentId) existing.equipmentId = equipmentId;
    if (Array.isArray(categories)) existing.categories = categories;

    const updated = await existing.save();

    const io = req.app.get("io");
    if (io) io.emit("inspectionQuestionUpdated", updated);

    return res.status(200).json({
      success: true,
      message: "Inspection question updated successfully",
      data: updated,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const addCategoryToInspectionQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const { categoryId, questions } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid inspection question ID",
      });
    }

    if (!categoryId || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: "categoryId and at least one question are required",
      });
    }

    const inspectionQuestion = await InspectionQuestion.findById(id);
    if (!inspectionQuestion) {
      return res.status(404).json({
        success: false,
        message: "Inspection question not found",
      });
    }

    inspectionQuestion.categories.push({ categoryId, questions });
    await inspectionQuestion.save();

    const io = req.app.get("io");
    if (io) io.emit("inspectionCategoryAdded", inspectionQuestion);

    return res.status(201).json({
      success: true,
      message: "Category added successfully",
      data: inspectionQuestion,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const addQuestionToCategory = async (req, res) => {
  try {
    const { id, categoryId } = req.params;
    const { question, answer } = req.body;

    if (!question || !answer) {
      return res.status(400).json({
        success: false,
        message: "question and answer are required",
      });
    }

    const inspectionQuestion = await InspectionQuestion.findById(id);
    if (!inspectionQuestion) {
      return res.status(404).json({
        success: false,
        message: "Inspection question not found",
      });
    }

    const category = inspectionQuestion.categories.id(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    category.questions.push({ question, answer });
    await inspectionQuestion.save();

    const io = req.app.get("io");
    if (io) io.emit("inspectionQuestionAdded", inspectionQuestion);

    return res.status(201).json({
      success: true,
      message: "Question added successfully",
      data: inspectionQuestion,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateQuestionInCategory = async (req, res) => {
  try {
    const { id, categoryId, questionId } = req.params;
    const { question, answer } = req.body;

    const inspectionQuestion = await InspectionQuestion.findById(id);
    if (!inspectionQuestion) {
      return res.status(404).json({
        success: false,
        message: "Inspection question not found",
      });
    }

    const category = inspectionQuestion.categories.id(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    const questionDoc = category.questions.id(questionId);
    if (!questionDoc) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    if (question) questionDoc.question = question;
    if (answer) questionDoc.answer = answer;

    await inspectionQuestion.save();

    const io = req.app.get("io");
    if (io) io.emit("inspectionQuestionUpdated", inspectionQuestion);

    return res.status(200).json({
      success: true,
      message: "Question updated successfully",
      data: inspectionQuestion,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteQuestionFromCategory = async (req, res) => {
  try {
    const { id, categoryId, questionId } = req.params;

    const inspectionQuestion = await InspectionQuestion.findById(id);
    if (!inspectionQuestion) {
      return res.status(404).json({
        success: false,
        message: "Inspection question not found",
      });
    }

    const category = inspectionQuestion.categories.id(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    const questionDoc = category.questions.id(questionId);
    if (!questionDoc) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    questionDoc.deleteOne(); // subdocument remove
    await inspectionQuestion.save();

    const io = req.app.get("io");
    if (io)
      io.emit("inspectionQuestionDeleted", { id, categoryId, questionId });

    return res.status(200).json({
      success: true,
      message: "Question deleted successfully",
      data: inspectionQuestion,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteCategoryFromInspectionQuestion = async (req, res) => {
  try {
    const { id, categoryId } = req.params;

    const inspectionQuestion = await InspectionQuestion.findById(id);
    if (!inspectionQuestion) {
      return res.status(404).json({
        success: false,
        message: "Inspection question not found",
      });
    }

    const category = inspectionQuestion.categories.id(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    category.deleteOne();
    await inspectionQuestion.save();

    const io = req.app.get("io");
    if (io) io.emit("inspectionCategoryDeleted", { id, categoryId });

    return res.status(200).json({
      success: true,
      message: "Category deleted successfully",
      data: inspectionQuestion,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteInspectionQuestion = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid inspection question ID",
      });
    }

    const deleted = await InspectionQuestion.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Inspection question not found",
      });
    }

    const io = req.app.get("io");
    if (io) io.emit("inspectionQuestionDeleted", { id });

    return res.status(200).json({
      success: true,
      message: "Inspection question deleted successfully",
      data: deleted,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
