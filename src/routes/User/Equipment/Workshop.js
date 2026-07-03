import express from "express";
import {
  createWorkshop,
  getAllWorkshops,
  getWorkshopById,
  updateWorkshop,
  deleteWorkshop,
} from "../../../controllers/User/Equipment/Workshop.js";

const router = express.Router();

router.post("/", createWorkshop);
router.get("/", getAllWorkshops);
router.get("/:id", getWorkshopById);
router.put("/:id", updateWorkshop);
router.delete("/:id", deleteWorkshop);

export default router;
