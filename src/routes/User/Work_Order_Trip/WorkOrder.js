import express from "express";

import {
  createWorkOrder,
  deleteWorkOrderDocument,
  getAllWorkOrders,
  getWorkOrderById,
  updateWorkOrder,
  updateWorkStatus,
  updateBillingInfo,
  verifyWorkOrder,
  rejectWorkOrder,
  addDocuments,
  addPodFiles,
  addMaterials,
  deleteWorkOrder,
  restoreWorkOrder,
  permanentDeleteWorkOrder,
} from "../../../controllers/User/Work_Order_Trip/WorkOrder.js";

import { createUploader } from "../../../middleware/createUploader.js";
import { UPLOAD_PATHS } from "../../../config/uploadConfig.js";

const router = express.Router();

const documentsUploader = createUploader({
  uploadPath: UPLOAD_PATHS.WORK_ORDER_DOCUMENTS,
  allowedMimeTypes: ["image/png", "image/jpeg", "image/jpg", "application/pdf"],
});

const podUploader = createUploader({
  uploadPath: UPLOAD_PATHS.WORK_ORDER_POD,
  allowedMimeTypes: ["image/png", "image/jpeg", "image/jpg", "application/pdf"],
});

const combinedUploader = createUploader({
  uploadPath: UPLOAD_PATHS.WORK_ORDER_DOCUMENTS, // dono field isi base folder mein save honge
  allowedMimeTypes: ["image/png", "image/jpeg", "image/jpg", "application/pdf"],
});

// Basic CRUD
router.post(
  "/create",
  combinedUploader.fields([
    { name: "documents", maxCount: 10 },
    { name: "pod", maxCount: 10 },
  ]),
  /* protect, */ createWorkOrder,
);

router.delete(
  "/delete-document/:workOrderId/:documentId",
  deleteWorkOrderDocument,
);

router.get("/", /* protect, */ getAllWorkOrders);
router.get("/:id", /* protect, */ getWorkOrderById);

router.put(
  "/update/:id",
  combinedUploader.fields([
    { name: "documents", maxCount: 10 },
    { name: "pod", maxCount: 10 },
  ]),
  /* protect, */ updateWorkOrder,
);

router.delete("/delete/:id", /* protect, */ deleteWorkOrder);
router.delete("/:id/permanent", /* protect, */ permanentDeleteWorkOrder);
router.patch("/restore/:id", /* protect, */ restoreWorkOrder);

// Status updates
router.patch("/:id/work-status", /* protect, */ updateWorkStatus);
router.patch("/:id/billing", /* protect, */ updateBillingInfo);

// Verification
router.patch("/verify/:id", /* protect, */ verifyWorkOrder);
router.patch("/reject/:id", /* protect, */ rejectWorkOrder);

// Documents / POD / Materials
router.patch(
  "/:id/documents",
  documentsUploader.array("documents", 10),
  /* protect, */ addDocuments,
);
router.patch(
  "/:id/pod",
  podUploader.array("pod", 10),
  /* protect, */ addPodFiles,
);
router.patch("/:id/materials", /* protect, */ addMaterials);

export default router;
