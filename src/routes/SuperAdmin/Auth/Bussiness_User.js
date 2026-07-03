import express from "express";
import {
  createUser,
  getAllUsers,
  getSingleUser,
  updateUser,
  deleteUser,
  changeStatus,
} from "../../../controllers/SuperAdmin/Auth/Bussiness_User.js";

const router = express.Router();

router.post("/create", createUser);
router.get("/", getAllUsers);
router.get("/:id", getSingleUser);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);
router.patch("/status/:id", changeStatus);

export default router;
