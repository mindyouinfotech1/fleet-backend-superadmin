import { Equipment } from "../../../models/User/Equipment/Equipment.js";
import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import { generateCode } from "../../../controllers/generateCode.js";

const getDocumentPath = (file) => {
  return `private/uploads/equipment/${file.filename}`;
};

const evaluateEligibility = (equipment, userId) => {
  const today = new Date();

  // Auto flag update based on dates
  const checkAndSet = (date, flagKey) => {
    if (date) {
      equipment.flags.set(flagKey, new Date(date) >= today);
    }
  };

  checkAndSet(
    equipment.compliance?.registrationExpiryDate,
    "registrationValid",
  );
  checkAndSet(equipment.compliance?.permitExpiryDate, "permitValid");
  checkAndSet(equipment.ownership?.insuranceExpiryDate, "insuranceValid");
  checkAndSet(
    equipment.compliance?.roadworthinessInspectionDate,
    "roadworthinessValid",
  );

  // Maintenance due
  if (equipment.maintenance?.nextMaintenanceDueDate) {
    const due = new Date(equipment.maintenance.nextMaintenanceDueDate) < today;
    equipment.flags.set("maintenanceDue", due);
  }

  // Documents uploaded check
  equipment.flags.set("documentsUploaded", equipment.documents?.length > 0);

  // Required flags for eligibility
  const requiredFlags = ["registrationValid", "insuranceValid"];
  const failedFlags = requiredFlags.filter(
    (k) => equipment.flags.get(k) === false,
  );
  const allPassed = failedFlags.length === 0;

  equipment.isEligible = allPassed;
  equipment.isExpired = !allPassed;

  if (!allPassed && equipment.equipmentStatus === "Active") {
    equipment.equipmentStatus = "Inactive";
  }

  // Push to history only if status changed
  const newStatus = allPassed ? "approved" : "rejected";
  if (equipment.status !== newStatus) {
    equipment.status = newStatus;
    equipment.isVerified = allPassed;
    equipment.verifiedBy = userId || null;
    equipment.verifiedAt = new Date();
    equipment.rejectionReason = allPassed
      ? null
      : `Failed checks: ${failedFlags.join(", ")}`;

    equipment.history.push({
      status: newStatus,
      changedBy: userId || null,
      reason: equipment.rejectionReason || "All conditions met",
    });
  }
};

export const createEquipment = async (req, res) => {
  try {
    const {
      organizationId,
      equipmentType,
      equipmentName,
      equipmentIdNo,
      modelName,
      vinOrChassisNumber,
      registrationNumber,
      registrationState,
      engineNumber,
      manufacturerName,
      manufactureYear,
      fuelType,
      equipmentStatus,
      loadCapacity,
      capacityUnit,
      noOfAxles,
      bodyType,
      color,
      compliance,
      maintenance,
      ownership,
      remarks,
    } = req.body;

    // Handle uploaded documents (multer array)
    // Expected: req.files = [{ fieldname, originalname, path/filename, ... }]
    // Frontend should also send documentsMetadata JSON array in body
    let documents = [];
    if (req.files && req.files.length > 0) {
      const metadataList = req.body.documentsMetadata
        ? JSON.parse(req.body.documentsMetadata)
        : [];

      documents = req.files.map((file, index) => ({
        documentType: metadataList[index]?.documentType || "General",
        documentName: metadataList[index]?.documentName || file.originalname,
        // documentFile: file.path,
        documentFile: getDocumentPath(file),

        documentNumber: metadataList[index]?.documentNumber || "",
        issueDate: metadataList[index]?.issueDate || null,
        expiryDate: metadataList[index]?.expiryDate || null,
        uploadedBy: req.user?._id || null,
      }));
    }

    //  iski jagah ye ek line
    const equipmentCode = await generateCode(
      organizationId,
      "Equipment",
      "EQP",
    );

    const equipment = new Equipment({
      organizationId,
      equipmentCode,
      equipmentType,
      equipmentName,
      equipmentIdNo,
      modelName,
      vinOrChassisNumber,
      registrationNumber,
      registrationState,
      engineNumber,
      manufacturerName,
      manufactureYear,
      fuelType,
      equipmentStatus,
      loadCapacity,
      capacityUnit,
      noOfAxles,
      bodyType,
      color,
      compliance: compliance ? JSON.parse(compliance) : {},
      maintenance: maintenance ? JSON.parse(maintenance) : {},
      ownership: ownership ? JSON.parse(ownership) : {},
      documents,
      remarks,
    });

    // Evaluate flags & eligibility
    evaluateEligibility(equipment, req.user?._id);

    await equipment.save();

    const io = req.app.get("io");
    if (io) io.emit("equipmentCreated", equipment);

    res.status(201).json({
      success: true,
      message: "Equipment created successfully",
      data: equipment,
    });
  } catch (error) {
    // Duplicate key error (registrationNumber)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: `Duplicate value: ${Object.keys(error.keyValue).join(", ")} already exists.`,
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteEquipmentDocument = async (req, res) => {
  try {
    const { equipmentId, documentId } = req.params;

    // Equipment find
    const equipment = await Equipment.findById(equipmentId);

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: "Equipment not found",
      });
    }

    // Document find
    const document = equipment.documents.id(documentId);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    // Physical file delete (optional)
    if (document.documentFile && fs.existsSync(document.documentFile)) {
      fs.unlinkSync(document.documentFile);
    }

    // Remove only selected document
    equipment.documents.pull(documentId);

    await equipment.save();

    const io = req.app.get("io");
    if (io) io.emit("equipmentUpdated", equipment);

    return res.status(200).json({
      success: true,
      message: "Document deleted successfully",
      data: equipment.documents,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateEquipment = async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id);
    if (!equipment) {
      return res
        .status(404)
        .json({ success: false, message: "Equipment not found" });
    }

    const {
      equipmentType,
      equipmentName,
      equipmentIdNo,
      modelName,
      vinOrChassisNumber,
      registrationNumber,
      registrationState,
      engineNumber,
      manufacturerName,
      manufactureYear,
      fuelType,
      equipmentStatus,
      loadCapacity,
      capacityUnit,
      noOfAxles,
      bodyType,
      color,
      compliance,
      maintenance,
      ownership,
      remarks,
    } = req.body;

    // Top-level fields
    const topLevelFields = {
      equipmentType,
      equipmentName,
      equipmentIdNo,
      modelName,
      vinOrChassisNumber,
      registrationNumber,
      registrationState,
      engineNumber,
      manufacturerName,
      manufactureYear,
      fuelType,
      equipmentStatus,
      loadCapacity,
      capacityUnit,
      noOfAxles,
      bodyType,
      color,
      remarks,
    };

    Object.entries(topLevelFields).forEach(([key, val]) => {
      if (val !== undefined) equipment[key] = val;
    });

    // Section-wise update (nested objects — merge, not replace)
    if (compliance) {
      const parsed =
        typeof compliance === "string" ? JSON.parse(compliance) : compliance;
      equipment.compliance = {
        ...(equipment.compliance.toObject?.() ?? equipment.compliance),
        ...parsed,
      };
    }
    if (maintenance) {
      const parsed =
        typeof maintenance === "string" ? JSON.parse(maintenance) : maintenance;
      equipment.maintenance = {
        ...(equipment.maintenance.toObject?.() ?? equipment.maintenance),
        ...parsed,
      };
    }
    if (ownership) {
      const parsed =
        typeof ownership === "string" ? JSON.parse(ownership) : ownership;
      equipment.ownership = {
        ...(equipment.ownership.toObject?.() ?? equipment.ownership),
        ...parsed,
      };
    }

    let metadataList = [];

    if (req.body.documentsMetadata) {
      metadataList =
        typeof req.body.documentsMetadata === "string"
          ? JSON.parse(req.body.documentsMetadata)
          : req.body.documentsMetadata;
    }

    let uploadedFileIndex = 0;

    for (const meta of metadataList) {
      // Delete existing document
      if (meta._delete && meta._id) {
        equipment.documents = equipment.documents.filter(
          (doc) => doc._id.toString() !== meta._id,
        );
        continue;
      }

      // Update existing document
      if (meta._id) {
        const doc = equipment.documents.id(meta._id);

        if (doc) {
          doc.documentType = meta.documentType;
          doc.documentName = meta.documentName;
          doc.documentNumber = meta.documentNumber;
          doc.issueDate = meta.issueDate || null;
          doc.expiryDate = meta.expiryDate || null;

          // Agar user ne nayi file upload ki hai
          if (req.files?.[uploadedFileIndex]) {
            // doc.documentFile = req.files[uploadedFileIndex].path;
            doc.documentFile = getDocumentPath(req.files[uploadedFileIndex]);
            uploadedFileIndex++;
          }
        }

        continue;
      }

      // New document
      if (req.files?.[uploadedFileIndex]) {
        const file = req.files[uploadedFileIndex];

        equipment.documents.push({
          documentType: meta.documentType,
          documentName: meta.documentName || file.originalname,
          documentFile: file.path,
          documentNumber: meta.documentNumber,
          issueDate: meta.issueDate || null,
          expiryDate: meta.expiryDate || null,
          uploadedBy: req.user?._id,
        });

        uploadedFileIndex++;
      }
    }

    // Re-evaluate eligibility after update
    evaluateEligibility(equipment, req.user?._id);

    await equipment.save();

    const io = req.app.get("io");
    if (io) io.emit("equipmentUpdated", equipment);

    res.status(200).json({
      success: true,
      message: "Equipment updated successfully",
      data: equipment,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: `Duplicate value: ${Object.keys(error.keyValue).join(", ")} already exists.`,
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllEquipment = async (req, res) => {
  try {
    const { equipmentStatus, fuelType, search, organizationId } = req.query;

    const filter = { organizationId };

    // Organization filter
    if (organizationId) {
      if (!mongoose.Types.ObjectId.isValid(organizationId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid organizationId",
        });
      }

      filter.organizationId = new mongoose.Types.ObjectId(organizationId);
    }

    // Status filter
    if (equipmentStatus) {
      filter.equipmentStatus = equipmentStatus;
    }

    // Fuel filter
    if (fuelType) {
      filter.fuelType = fuelType;
    }

    // Search filter
    if (search) {
      filter.$or = [
        { equipmentName: { $regex: search, $options: "i" } },
        { equipmentType: { $regex: search, $options: "i" } },
        { registrationNumber: { $regex: search, $options: "i" } },
        { equipmentIdNo: { $regex: search, $options: "i" } },
      ];
    }

    const equipments = await Equipment.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: equipments.length,
      data: equipments,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getEquipmentById = async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id).populate(
      "ownership.primaryDriver",
      "firstName lastName phoneNumber email",
    );

    if (!equipment) {
      return res
        .status(404)
        .json({ success: false, message: "Equipment not found" });
    }

    res.status(200).json({ success: true, data: equipment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addDocuments = async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id);
    if (!equipment) {
      return res
        .status(404)
        .json({ success: false, message: "Equipment not found" });
    }

    if (!req.files || req.files.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No files uploaded" });
    }

    const metadataList = req.body.documentsMetadata
      ? JSON.parse(req.body.documentsMetadata)
      : [];

    const newDocs = req.files.map((file, index) => ({
      documentType: metadataList[index]?.documentType || "General",
      documentName: metadataList[index]?.documentName || file.originalname,
      documentFile: file.path,
      documentNumber: metadataList[index]?.documentNumber || "",
      issueDate: metadataList[index]?.issueDate || null,
      expiryDate: metadataList[index]?.expiryDate || null,
      uploadedBy: req.user?._id || null,
    }));

    equipment.documents.push(...newDocs);
    equipment.flags.set("documentsUploaded", true);

    await equipment.save();

    const io = req.app.get("io");
    if (io) io.emit("equipmentUpdated", equipment);
    res.status(200).json({
      success: true,
      message: "Documents added successfully",
      data: equipment.documents,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteDocument = async (req, res) => {
  try {
    // params: equipmentId, documentId
    const equipment = await Equipment.findById(req.params.id);
    if (!equipment) {
      return res
        .status(404)
        .json({ success: false, message: "Equipment not found" });
    }

    const docIndex = equipment.documents.findIndex(
      (d) => d._id.toString() === req.params.documentId,
    );

    if (docIndex === -1) {
      return res
        .status(404)
        .json({ success: false, message: "Document not found" });
    }

    // Delete file from disk (optional, if using local storage)
    const filePath = equipment.documents[docIndex].documentFile;
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    equipment.documents.splice(docIndex, 1);

    if (equipment.documents.length === 0) {
      equipment.flags.set("documentsUploaded", false);
    }

    await equipment.save();
    const io = req.app.get("io");
    if (io) io.emit("equipmentUpdated", equipment);
    res
      .status(200)
      .json({ success: true, message: "Document deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteEquipment = async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id);
    if (!equipment) {
      return res
        .status(404)
        .json({ success: false, message: "Equipment not found" });
    }

    equipment.isDeleted = true;
    equipment.deletedBy = req.user?._id || null;
    equipment.deletedAt = new Date();
    equipment.equipmentStatus = "Inactive";
    equipment.status = "cancelled";

    equipment.history.push({
      status: "cancelled",
      changedBy: req.user?._id || null,
      reason: req.body.reason || "Deleted by admin",
    });

    await equipment.save();

    const io = req.app.get("io");
    if (io) io.emit("equipmentDeleted", equipment._id);

    res
      .status(200)
      .json({ success: true, message: "Equipment deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const restoreEquipment = async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id, null, {
      includeDeleted: true,
    });

    if (!equipment || !equipment.isDeleted) {
      return res
        .status(404)
        .json({ success: false, message: "Deleted equipment not found" });
    }

    equipment.isDeleted = false;
    equipment.deletedBy = null;
    equipment.deletedAt = null;
    equipment.equipmentStatus = "Active";
    equipment.status = "pending";

    equipment.history.push({
      status: "pending",
      changedBy: req.user?._id || null,
      reason: "Restored by admin",
    });

    await equipment.save();

    const io = req.app.get("io");
    if (io) io.emit("equipmentRestored", equipment);

    res
      .status(200)
      .json({ success: true, message: "Equipment restored successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateEquipmentStatus = async (req, res) => {
  try {
    const { equipmentStatus, reason } = req.body;

    const allowed = ["Active", "Inactive", "Under Maintenance", "Sold"];
    if (!allowed.includes(equipmentStatus)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid equipmentStatus value" });
    }

    const equipment = await Equipment.findById(req.params.id);
    if (!equipment) {
      return res
        .status(404)
        .json({ success: false, message: "Equipment not found" });
    }

    equipment.equipmentStatus = equipmentStatus;
    equipment.history.push({
      status: equipmentStatus,
      changedBy: req.user?._id || null,
      reason: reason || `Status changed to ${equipmentStatus}`,
    });

    await equipment.save();

    const io = req.app.get("io");
    if (io) io.emit("equipmentStatusChanged", equipment);

    res.status(200).json({
      success: true,
      message: `Equipment status updated to ${equipmentStatus}`,
      data: { equipmentStatus: equipment.equipmentStatus },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDeletedEquipment = async (req, res) => {
  try {
    const equipments = await Equipment.find({ isDeleted: true }, null, {
      includeDeleted: true,
    }).sort({ deletedAt: -1 });

    res.status(200).json({
      success: true,
      count: equipments.length,
      data: equipments,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
