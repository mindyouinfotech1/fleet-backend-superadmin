import express from "express";
import {
  createInspectionQuestion,
  getAllInspectionQuestions,
  getInspectionQuestionById,
  updateInspectionQuestion,
  deleteInspectionQuestion,
  addCategoryToInspectionQuestion,
  deleteCategoryFromInspectionQuestion,
  addQuestionToCategory,
  updateQuestionInCategory,
  deleteQuestionFromCategory,
  generateAiInspectionQuestions,
} from "../../../controllers/User/Work_Order_Trip/EquipmentQuestion.js";

const router = express.Router();

// Main document CRUD
router.post("/", createInspectionQuestion);
router.get("/", getAllInspectionQuestions);
router.get("/:id", getInspectionQuestionById);
router.put("/:id", updateInspectionQuestion);
router.delete("/:id", deleteInspectionQuestion);

// Category level
router.post("/:id/category", addCategoryToInspectionQuestion);
router.delete(
  "/:id/category/:categoryId",
  deleteCategoryFromInspectionQuestion,
);

// Question level (inside a category)
router.post("/:id/category/:categoryId/question", addQuestionToCategory);
router.put(
  "/:id/category/:categoryId/question/:questionId",
  updateQuestionInCategory,
);
router.delete(
  "/:id/category/:categoryId/question/:questionId",
  deleteQuestionFromCategory,
);

router.post("/ai-generate", generateAiInspectionQuestions);

export default router;
