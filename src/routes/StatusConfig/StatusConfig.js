import express from "express";
import {
  createStatusConfig,
  getAllStatusConfigs,
  getStatusConfigByModuleAndField,
  getStatusConfigsByModule,
  updateStatusConfig,
  addOption,
  updateOptionLabel,
  disableOption,
  deleteStatusConfig,
} from "../../controllers/StatusConfig/StatusConfig.js";

const router = express.Router();

router.post("/", createStatusConfig);
router.get("/", getAllStatusConfigs);
router.get("/lookup", getStatusConfigByModuleAndField); 
router.get("/module/:module", getStatusConfigsByModule);
router.put("/:id", updateStatusConfig);
router.post("/:id/options", addOption);
router.put("/:id/options/:key", updateOptionLabel);
router.patch("/:id/options/:key/disable", disableOption);
router.delete("/:id", deleteStatusConfig);

export default router;
