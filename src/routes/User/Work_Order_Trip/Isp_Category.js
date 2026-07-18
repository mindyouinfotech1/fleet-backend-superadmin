import express from "express";
import {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  changeCategoryStatus,
} from "../../../controllers/User/Work_Order_Trip/Isp_Category.js";

const router = express.Router();

router.post("/", createCategory);

router.get("/", getAllCategories);

router.get("/:id", getCategoryById);

router.put("/:id", updateCategory);

router.delete("/:id", deleteCategory);

router.patch("/status/:id", changeCategoryStatus);

export default router;
