import express from "express";
import {
  createPartReplacement,
  getAllPartReplacements,
  getPartReplacementById,
  updatePartReplacement,
  deletePartReplacement,
} from "../../../controllers/User/Equipment/PartReplacement.js";

const router = express.Router();

router.post("/", createPartReplacement);
router.get("/", getAllPartReplacements);
router.get("/:id", getPartReplacementById);
router.put("/:id", updatePartReplacement);
router.delete("/:id", deletePartReplacement);

export default router;