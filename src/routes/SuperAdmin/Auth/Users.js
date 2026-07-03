import express from "express";
import * as userController from "../../../controllers/SuperAdmin/Auth/Users.js";

const router = express.Router();

router.post("/register", userController.createUser);
router.post("/login", userController.loginUser);
router.get("/", userController.getUsers);
router.get("/:id", userController.getUserById);
router.put("/:id", userController.updateUser);
router.delete("/:id", userController.deleteUser);
router.patch("/:id/compliance", userController.updateCompliance);
router.patch("/:id/assign-vehicle", userController.assignVehicle);

export default router;
