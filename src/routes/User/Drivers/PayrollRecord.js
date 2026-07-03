import express from "express";
import {
  createPayrollRecord,
  getAllPayrollRecords,
  getAllPayrollRecordsByDriver,
  getPayrollRecordById,
  updatePayrollRecord,
  deletePayrollRecord,
  getPayrollByDriver,
  togglePayrollStatus,
} from "../../../controllers/User/Drivers/PayrollRecord.js";

const router = express.Router();

router.post("/", createPayrollRecord);
router.get("/", getAllPayrollRecords);
router.get("/driver/:driverId", getAllPayrollRecordsByDriver);
router.get("/:id", getPayrollRecordById);
router.put("/:id", updatePayrollRecord);
router.delete("/:id", deletePayrollRecord);

router.get("/driver/:driverId", getPayrollByDriver);
router.patch("/:id/toggle-status", togglePayrollStatus);

export default router;
