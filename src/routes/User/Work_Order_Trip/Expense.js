import express from "express";

import {
  createExpense,
  getAllExpenses,
  getExpenseById,
  getExpensesByTripId,
  updateExpense,
  deleteExpense,
  updateExpenseStatus,
} from "../../../controllers/User/Work_Order_Trip/Expense.js";

import { createUploader } from "../../../middleware/createUploader.js";
import { UPLOAD_PATHS } from "../../../config/uploadConfig.js";

const router = express.Router();

const upload = createUploader({
  uploadPath: UPLOAD_PATHS.EXPENSE,

  allowedMimeTypes: ["image/png", "image/jpeg", "image/jpg", "application/pdf"],
});

router.post(
  "/",
  upload.fields([
    {
      name: "receipt",
      maxCount: 1,
    },
  ]),
  createExpense,
);

router.get("/", getAllExpenses);

router.get("/:id", getExpenseById);

router.get("/trip/:tripId", getExpensesByTripId);

router.put(
  "/:id",
  upload.fields([
    {
      name: "receipt",
      maxCount: 1,
    },
  ]),
  updateExpense,
);

router.delete("/:id", deleteExpense);

router.patch("/:id/status", updateExpenseStatus);

export default router;
