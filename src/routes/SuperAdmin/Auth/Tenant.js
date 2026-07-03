import express from "express";
import { TenantController, upload } from "../../../controllers/SuperAdmin/Auth/Tenant.js";

const router = express.Router();


router.post("/", upload.single("logo"), TenantController.createTenant);
router.get("/", TenantController.getTenants);
router.get("/:id", TenantController.getTenantById);
router.put("/:id", upload.single("logo"), TenantController.updateTenant);
router.delete("/:id", TenantController.deleteTenant);

export default router;
