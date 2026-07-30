import express from "express";
import {
  createInspectionQuestion,
  getAllInspectionQuestions,
  getInspectionQuestionById,
  getInspectionQuestionByEquipment,
  updateInspectionQuestion,
  deleteInspectionQuestion,
  addCategory,
  updateCategory,
  deleteCategory,
  addQuestion,
  updateQuestion,
  deleteQuestion,
} from "../../../controllers/User/Work_Order_Trip/Insp_Question.js";

import { generateAiInspectionQuestions } from "../../../controllers/User/Work_Order_Trip/EquipmentQuestion.js";

const router = express.Router();

/* ---------- Document Level ---------- */
router.post("/", createInspectionQuestion);
router.get("/", getAllInspectionQuestions);
router.get("/equipment/:equipmentId", getInspectionQuestionByEquipment);
router.get("/:id", getInspectionQuestionById);
router.put("/:id", updateInspectionQuestion);
router.delete("/:id", deleteInspectionQuestion);

/* ---------- Category Level ---------- */
router.post("/:id/categories", addCategory);
router.put("/:id/categories/:categoryId", updateCategory);
router.delete("/:id/categories/:categoryId", deleteCategory);

/* ---------- Question Level ---------- */
router.post("/:id/categories/:categoryId/questions", addQuestion);
router.put("/:id/categories/:categoryId/questions/:questionId", updateQuestion);
router.delete(
  "/:id/categories/:categoryId/questions/:questionId",
  deleteQuestion,
);

router.post("/ai-generate", generateAiInspectionQuestions);

export default router;
