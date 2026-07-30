// import express from "express";
// import {
//   createCategory,
//   getAllCategories,
//   getCategoryById,
//   updateCategory,
//   deleteCategory,
//   changeCategoryStatus,
// } from "../../../controllers/User/Work_Order_Trip/Isp_Category.js";

// const router = express.Router();

// router.post("/", createCategory);

// router.get("/", getAllCategories);

// router.get("/:id", getCategoryById);

// router.put("/:id", updateCategory);

// router.delete("/:id", deleteCategory);

// router.patch("/status/:id", changeCategoryStatus);

// export default router;

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
  generateAiInspectionQuestions,
} from "../../../controllers/User/Work_Order_Trip/InspectionChecklist.js";

const router = express.Router();

/* ======================================================
   AI SUGGESTION — equipmentType ke basis pe ready-made
   checklist template suggest karta hai (DB me save nahi karta)
====================================================== */
router.post("/ai-generate", generateAiInspectionQuestions);

/* ======================================================
   FULL DOC LEVEL — Create / List / Get / Update / Delete
====================================================== */
router.post("/", createInspectionQuestion);
router.get("/", getAllInspectionQuestions);

// equipmentId se seedha fetch — "/equipment" literal segment hone
// ki wajah se "/:organizationId/:id" wale route se conflict nahi hoga
router.get(
  "/equipment/:organizationId/:equipmentId",
  getInspectionQuestionByEquipment,
);

router.get("/:organizationId/:id", getInspectionQuestionById);
router.put("/:id", updateInspectionQuestion);
router.delete("/:id", deleteInspectionQuestion);

/* ======================================================
   CATEGORY LEVEL — Add / Update / Delete
====================================================== */
router.post("/:id/category", addCategory);
router.put("/:id/category/:categoryId", updateCategory);
router.delete("/:organizationId/:id/category/:categoryId", deleteCategory);

/* ======================================================
   QUESTION LEVEL — Add / Update / Delete
====================================================== */
router.post("/:organizationId/:id/category/:categoryId/question", addQuestion);
router.put(
  "/:organizationId/:id/category/:categoryId/question/:questionId",
  updateQuestion,
);
router.delete(
  "/:organizationId/:id/category/:categoryId/question/:questionId",
  deleteQuestion,
);

export default router;
