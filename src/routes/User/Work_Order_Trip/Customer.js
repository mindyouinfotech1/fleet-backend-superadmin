import express from "express";

import {
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomer,
  getCustomers,
  changeCustomerStatus,
  restoreCustomer,
} from "../../../controllers/User/Work_Order_Trip/Customer.js";

const router = express.Router();

router.post("/create", createCustomer);
router.get("/all/:organizationId", getCustomers);
router.get("/:id", getCustomer);
router.put("/update/:id", updateCustomer);
router.patch("/status/:id", changeCustomerStatus);
router.delete("/delete/:id", deleteCustomer);

router.patch("/restore/:id", restoreCustomer);

export default router;
