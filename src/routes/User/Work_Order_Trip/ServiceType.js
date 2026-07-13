import express from "express";

import {
  createServiceType,
  updateServiceType,
  deleteServiceType,
  getServiceType,
  getServiceTypes,
  changeServiceTypeStatus,
} from "../../../controllers/User/Work_Order_Trip/ServiceType.js";

const router = express.Router();

router.post("/create", createServiceType);

router.get("/all/:organizationId", getServiceTypes);

router.get("/:id", getServiceType);

router.put("/update/:id", updateServiceType);

router.patch("/status/:id", changeServiceTypeStatus);

router.delete("/delete/:id", deleteServiceType);

export default router;
