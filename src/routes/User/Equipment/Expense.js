import express from "express";

import { createUploader } from "../../../middleware/createUploader.js";
import { UPLOAD_PATHS } from "../../../config/uploadConfig.js";

import {
  createExpense,
  deleteExpenseReceipt,
  getAllExpenses,
  getExpensesByEquipment,
  getExpenseById,
  updateExpense,
  deleteExpense,
  restoreExpense,
} from "../../../controllers/User/Equipment/Expense.js";

const router = express.Router();

const upload = createUploader({
  uploadPath: UPLOAD_PATHS.EXPENSE,
  allowedMimeTypes: ["image/png", "image/jpeg", "image/jpg", "application/pdf"],
});


router.delete("/delete-receipt/:expenseId", deleteExpenseReceipt);
router.post("/", upload.single("receipt"), createExpense);
router.get("/", getAllExpenses);
router.get("/equipment/:equipmentId", getExpensesByEquipment);
router.get("/:id", getExpenseById);
router.put("/:id", upload.single("receipt"), updateExpense);
router.delete("/:id", deleteExpense);
router.patch("/restore/:id", restoreExpense);
export default router;
