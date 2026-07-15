import mongoose from "mongoose";
import fs from "fs";
import { WorkOrder } from "../../../models/User/Work_Order_Trip/WorkOrder.js";
import { generateCode } from "../../../controllers/generateCode.js";

const sendResponse = (res, status, success, message, data = null) => {
  return res.status(status).json({ success, message, data });
};

const mapUploadedFiles = (files = []) => {
  return (files || []).map((file) => ({
    fileName: file.originalname,
    fileUrl: file.path.replace(/\\/g, "/"), // windows path fix
  }));
};

const deleteFilesFromDisk = (files = []) => {
  files.forEach((file) => {
    const filePath = file.fileUrl;
    if (filePath && fs.existsSync(filePath)) {
      fs.unlink(filePath, (err) => {
        if (err) console.error("Failed to delete file:", filePath, err.message);
      });
    }
  });
};

export const createWorkOrder = async (req, res) => {
  try {
    const { organizationId } = req.user || req.body;

    const documentFiles = mapUploadedFiles(req.files?.documents);
    const podFiles = mapUploadedFiles(req.files?.pod);

    let worksite = req.body.worksite;
    if (typeof worksite === "string") {
      try {
        worksite = JSON.parse(worksite);
      } catch {
        worksite = {};
      }
    }

    let billing = req.body.billing;
    if (typeof billing === "string") {
      try {
        billing = JSON.parse(billing);
      } catch {
        billing = {};
      }
    }

    const workOrderCode = await generateCode(organizationId, "WorkOrder", "WO");

    const payload = {
      ...req.body,
      organizationId: organizationId || req.body.organizationId,
      workOrderCode,
      documents: documentFiles,
      billing,
      worksite: {
        ...(worksite || {}),
        pod: podFiles,
      },
    };

    const workOrder = await WorkOrder.create(payload);

    return sendResponse(
      res,
      201,
      true,
      "Work order created successfully",
      workOrder,
    );
  } catch (error) {
    console.error("createWorkOrder error:", error);
    // agar DB save fail ho jaye to uploaded files disk se clean kar dein
    if (req.files?.documents?.length)
      deleteFilesFromDisk(mapUploadedFiles(req.files.documents));
    if (req.files?.pod?.length)
      deleteFilesFromDisk(mapUploadedFiles(req.files.pod));
    return sendResponse(
      res,
      500,
      false,
      error.message || "Failed to create work order",
    );
  }
};


export const getAllWorkOrders = async (req, res) => {
  try {
    const {
      organizationId,
      customerId,
      workStatus,
      status,
      verifyStatus,
      jobType,
      search,
      startDate,
      endDate,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const filter = { isDeleted: false };

    if (organizationId) filter.organizationId = organizationId;
    // if (customerId) filter.customerId = customerId;
    if (workStatus) filter.workStatus = workStatus;
    if (status) filter.status = status;
    if (verifyStatus) filter.verifyStatus = verifyStatus;
    if (jobType) filter.jobType = { $regex: jobType, $options: "i" };

    if (startDate || endDate) {
      filter.startDate = {};
      if (startDate) filter.startDate.$gte = new Date(startDate);
      if (endDate) filter.startDate.$lte = new Date(endDate);
    }

    if (search) {
      filter.$or = [
        { customerName: { $regex: search, $options: "i" } },
        { projectContractId: { $regex: search, $options: "i" } },
        { "billing.invoiceNumber": { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

    const [workOrders, total] = await Promise.all([
      WorkOrder.find(filter)
        .populate("organizationId", "name")
        .sort(sort)
        .skip(skip)
        .limit(Number(limit)),
      WorkOrder.countDocuments(filter),
    ]);

    return sendResponse(res, 200, true, "Work orders fetched successfully", {
      workOrders,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("getAllWorkOrders error:", error);
    return sendResponse(
      res,
      500,
      false,
      error.message || "Failed to fetch work orders",
    );
  }
};


export const getWorkOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendResponse(res, 400, false, "Invalid work order id");
    }

    const workOrder = await WorkOrder.findOne({ _id: id, isDeleted: false })
      .populate("organizationId", "name")
      .populate("customerId", "name email phone");

    if (!workOrder) {
      return sendResponse(res, 404, false, "Work order not found");
    }

    return sendResponse(
      res,
      200,
      true,
      "Work order fetched successfully",
      workOrder,
    );
  } catch (error) {
    console.error("getWorkOrderById error:", error);
    return sendResponse(
      res,
      500,
      false,
      error.message || "Failed to fetch work order",
    );
  }
};

/**
 * @desc    Update Work Order (general fields)
 * @route   PUT /api/work-orders/:id
 * @access  Private
 */
export const updateWorkOrder = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      if (req.files?.documents?.length)
        deleteFilesFromDisk(mapUploadedFiles(req.files.documents));
      if (req.files?.pod?.length)
        deleteFilesFromDisk(mapUploadedFiles(req.files.pod));
      return sendResponse(res, 400, false, "Invalid work order id");
    }

    const existingWorkOrder = await WorkOrder.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!existingWorkOrder) {
      if (req.files?.documents?.length)
        deleteFilesFromDisk(mapUploadedFiles(req.files.documents));
      if (req.files?.pod?.length)
        deleteFilesFromDisk(mapUploadedFiles(req.files.pod));
      return sendResponse(res, 404, false, "Work order not found");
    }

    // Kabhi bhi in fields ko direct update na hone dein
    const restrictedFields = [
      "isDeleted",
      "verifyStatus",
      "verifiedAt",
      "organizationId",
    ];
    restrictedFields.forEach((field) => delete req.body[field]);

    let worksite = req.body.worksite;
    if (typeof worksite === "string") {
      try {
        worksite = JSON.parse(worksite);
      } catch {
        worksite = {};
      }
    }

    let billing = req.body.billing;
    if (typeof billing === "string") {
      try {
        billing = JSON.parse(billing);
      } catch {
        billing = {};
      }
    }

    const updateData = { ...req.body };
    if (worksite) updateData.worksite = worksite;
    if (billing) updateData.billing = billing;

    // Agar naye documents aaye hain to purane replace karein
    if (req.files?.documents?.length) {
      updateData.documents = mapUploadedFiles(req.files.documents);
    }

    // Agar naye POD files aaye hain to worksite.pod replace karein
    if (req.files?.pod?.length) {
      updateData.worksite = {
        ...(updateData.worksite ||
          existingWorkOrder.worksite?.toObject() ||
          {}),
        pod: mapUploadedFiles(req.files.pod),
      };
    }

    const workOrder = await WorkOrder.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: updateData },
      { new: true, runValidators: true },
    );

    // Purani files ko disk se remove karein sirf jab naye files successfully save ho gaye ho
    if (req.files?.documents?.length && existingWorkOrder.documents?.length) {
      deleteFilesFromDisk(existingWorkOrder.documents);
    }
    if (req.files?.pod?.length && existingWorkOrder.worksite?.pod?.length) {
      deleteFilesFromDisk(existingWorkOrder.worksite.pod);
    }

    return sendResponse(
      res,
      200,
      true,
      "Work order updated successfully",
      workOrder,
    );
  } catch (error) {
    console.error("updateWorkOrder error:", error);
    if (req.files?.documents?.length)
      deleteFilesFromDisk(mapUploadedFiles(req.files.documents));
    if (req.files?.pod?.length)
      deleteFilesFromDisk(mapUploadedFiles(req.files.pod));
    return sendResponse(
      res,
      500,
      false,
      error.message || "Failed to update work order",
    );
  }
};

/**
 * @desc    Update only Work Status (Pending / In Progress / Completed etc.)
 * @route   PATCH /api/work-orders/:id/work-status
 * @access  Private
 */
export const updateWorkStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { workStatus } = req.body;

    if (!workStatus) {
      return sendResponse(res, 400, false, "workStatus is required");
    }

    const workOrder = await WorkOrder.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: { workStatus } },
      { new: true, runValidators: true },
    );

    if (!workOrder) {
      return sendResponse(res, 404, false, "Work order not found");
    }

    return sendResponse(
      res,
      200,
      true,
      "Work status updated successfully",
      workOrder,
    );
  } catch (error) {
    console.error("updateWorkStatus error:", error);
    return sendResponse(
      res,
      500,
      false,
      error.message || "Failed to update work status",
    );
  }
};

/**
 * @desc    Update billing/payment info
 * @route   PATCH /api/work-orders/:id/billing
 * @access  Private
 */
export const updateBillingInfo = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      billingType,
      rate,
      totalEstimatedCost,
      paymentStatus,
      advanceReceived,
      paymentDueDate,
      invoiceNumber,
    } = req.body;

    const updateFields = {};
    if (billingType !== undefined)
      updateFields["billing.billingType"] = billingType;
    if (rate !== undefined) updateFields["billing.rate"] = rate;
    if (totalEstimatedCost !== undefined)
      updateFields["billing.totalEstimatedCost"] = totalEstimatedCost;
    if (paymentStatus !== undefined)
      updateFields["billing.paymentStatus"] = paymentStatus;
    if (advanceReceived !== undefined)
      updateFields["billing.advanceReceived"] = advanceReceived;
    if (paymentDueDate !== undefined)
      updateFields["billing.paymentDueDate"] = paymentDueDate;
    if (invoiceNumber !== undefined)
      updateFields["billing.invoiceNumber"] = invoiceNumber;

    const workOrder = await WorkOrder.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: updateFields },
      { new: true, runValidators: true },
    );

    if (!workOrder) {
      return sendResponse(res, 404, false, "Work order not found");
    }

    return sendResponse(
      res,
      200,
      true,
      "Billing info updated successfully",
      workOrder,
    );
  } catch (error) {
    console.error("updateBillingInfo error:", error);
    return sendResponse(
      res,
      500,
      false,
      error.message || "Failed to update billing info",
    );
  }
};

export const verifyWorkOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const workOrder = await WorkOrder.findOneAndUpdate(
      { _id: id, isDeleted: false },
      {
        $set: {
          verifyStatus: "Verified",
          verifiedAt: new Date(),
          rejectionReason: "",
        },
      },
      { new: true },
    );

    if (!workOrder) {
      return sendResponse(res, 404, false, "Work order not found");
    }

    return sendResponse(
      res,
      200,
      true,
      "Work order verified successfully",
      workOrder,
    );
  } catch (error) {
    console.error("verifyWorkOrder error:", error);
    return sendResponse(
      res,
      500,
      false,
      error.message || "Failed to verify work order",
    );
  }
};

/**
 * @desc    Reject a Work Order with reason
 * @route   PATCH /api/work-orders/:id/reject
 * @access  Private (admin/manager)
 */
export const rejectWorkOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      return sendResponse(res, 400, false, "rejectionReason is required");
    }

    const workOrder = await WorkOrder.findOneAndUpdate(
      { _id: id, isDeleted: false },
      {
        $set: {
          verifyStatus: "Rejected",
          rejectionReason,
          verifiedAt: null,
        },
      },
      { new: true },
    );

    if (!workOrder) {
      return sendResponse(res, 404, false, "Work order not found");
    }

    return sendResponse(res, 200, true, "Work order rejected", workOrder);
  } catch (error) {
    console.error("rejectWorkOrder error:", error);
    return sendResponse(
      res,
      500,
      false,
      error.message || "Failed to reject work order",
    );
  }
};

/**
 * @desc    Add document(s) to work order
 * @route   PATCH /api/work-orders/:id/documents
 * @access  Private
 */
export const addDocuments = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.files?.length) {
      return sendResponse(
        res,
        400,
        false,
        "At least one document file is required",
      );
    }

    const documents = mapUploadedFiles(req.files);

    const workOrder = await WorkOrder.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $push: { documents: { $each: documents } } },
      { new: true },
    );

    if (!workOrder) {
      deleteFilesFromDisk(documents);
      return sendResponse(res, 404, false, "Work order not found");
    }

    return sendResponse(
      res,
      200,
      true,
      "Documents added successfully",
      workOrder,
    );
  } catch (error) {
    console.error("addDocuments error:", error);
    if (req.files?.length) deleteFilesFromDisk(mapUploadedFiles(req.files));
    return sendResponse(
      res,
      500,
      false,
      error.message || "Failed to add documents",
    );
  }
};

/**
 * @desc    Add POD (proof of delivery) files to worksite
 * @route   PATCH /api/work-orders/:id/pod
 * @access  Private
 */
export const addPodFiles = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.files?.length) {
      return sendResponse(res, 400, false, "At least one POD file is required");
    }

    const pod = mapUploadedFiles(req.files);

    const workOrder = await WorkOrder.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $push: { "worksite.pod": { $each: pod } } },
      { new: true },
    );

    if (!workOrder) {
      deleteFilesFromDisk(pod);
      return sendResponse(res, 404, false, "Work order not found");
    }

    return sendResponse(
      res,
      200,
      true,
      "POD files added successfully",
      workOrder,
    );
  } catch (error) {
    console.error("addPodFiles error:", error);
    if (req.files?.length) deleteFilesFromDisk(mapUploadedFiles(req.files));
    return sendResponse(
      res,
      500,
      false,
      error.message || "Failed to add POD files",
    );
  }
};

/**
 * @desc    Add material(s) to worksite
 * @route   PATCH /api/work-orders/:id/materials
 * @access  Private
 */
export const addMaterials = async (req, res) => {
  try {
    const { id } = req.params;
    const { materials } = req.body; // array of strings

    if (!Array.isArray(materials) || materials.length === 0) {
      return sendResponse(res, 400, false, "materials array is required");
    }

    const workOrder = await WorkOrder.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $push: { "worksite.materials": { $each: materials } } },
      { new: true },
    );

    if (!workOrder) {
      return sendResponse(res, 404, false, "Work order not found");
    }

    return sendResponse(
      res,
      200,
      true,
      "Materials added successfully",
      workOrder,
    );
  } catch (error) {
    console.error("addMaterials error:", error);
    return sendResponse(
      res,
      500,
      false,
      error.message || "Failed to add materials",
    );
  }
};

/**
 * @desc    Soft delete a Work Order
 * @route   DELETE /api/work-orders/:id
 * @access  Private
 */
export const deleteWorkOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const workOrder = await WorkOrder.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: { isDeleted: true, status: "Inactive" } },
      { new: true },
    );

    if (!workOrder) {
      return sendResponse(res, 404, false, "Work order not found");
    }

    return sendResponse(
      res,
      200,
      true,
      "Work order deleted successfully",
      workOrder,
    );
  } catch (error) {
    console.error("deleteWorkOrder error:", error);
    return sendResponse(
      res,
      500,
      false,
      error.message || "Failed to delete work order",
    );
  }
};

/**
 * @desc    Restore a soft-deleted Work Order
 * @route   PATCH /api/work-orders/:id/restore
 * @access  Private
 */
export const restoreWorkOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const workOrder = await WorkOrder.findOneAndUpdate(
      { _id: id, isDeleted: true },
      { $set: { isDeleted: false, status: "Active" } },
      { new: true },
    );

    if (!workOrder) {
      return sendResponse(res, 404, false, "Deleted work order not found");
    }

    return sendResponse(
      res,
      200,
      true,
      "Work order restored successfully",
      workOrder,
    );
  } catch (error) {
    console.error("restoreWorkOrder error:", error);
    return sendResponse(
      res,
      500,
      false,
      error.message || "Failed to restore work order",
    );
  }
};

/**
 * @desc    Permanently delete a Work Order (hard delete)
 * @route   DELETE /api/work-orders/:id/permanent
 * @access  Private (super admin)
 */
export const permanentDeleteWorkOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const workOrder = await WorkOrder.findByIdAndDelete(id);

    if (!workOrder) {
      return sendResponse(res, 404, false, "Work order not found");
    }

    // Record hi delete ho raha hai, is liye related files bhi disk se clean kar dein
    if (workOrder.documents?.length) deleteFilesFromDisk(workOrder.documents);
    if (workOrder.worksite?.pod?.length)
      deleteFilesFromDisk(workOrder.worksite.pod);

    return sendResponse(res, 200, true, "Work order permanently deleted");
  } catch (error) {
    console.error("permanentDeleteWorkOrder error:", error);
    return sendResponse(
      res,
      500,
      false,
      error.message || "Failed to permanently delete work order",
    );
  }
};
