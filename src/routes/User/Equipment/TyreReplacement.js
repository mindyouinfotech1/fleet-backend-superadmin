import express from "express";
import {
  createTyreReplacement,
  getAllTyreReplacements,
  getTyreReplacementsByEquipment,
  getTyreReplacementById,
  updateTyreReplacement,
  deleteTyreReplacement,
} from "../../../controllers/User/Equipment/TyreReplacement.js";

const router = express.Router();

router.post("/", createTyreReplacement);
router.get("/", getAllTyreReplacements);
router.get("/equipment/:equipmentId", getTyreReplacementsByEquipment);
router.get("/:id", getTyreReplacementById);
router.put("/:id", updateTyreReplacement);
router.delete("/:id", deleteTyreReplacement);

export default router;
