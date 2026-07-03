import { MedicalCertificate } from "../../../models/User/Drivers/MedicalCertificate.js";

// ================= CREATE MEDICAL CERTIFICATE =================

export const createMedicalCertificate = async (req, res) => {
  try {
    const {
      driverId,
      certificateNumber,
      countryCode,
      issuingAuthority,
      doctorName,
      hospitalOrClinic,
      issueDate,
      expiryDate,
      fitnessStatus,
      restrictions,
      remarks,
    } = req.body;

    let certificateUpload = [];

    if (req.files && req.files.length > 0) {
      certificateUpload = req.files.map((file) => ({
        certificatename: file.originalname,
        certificatefile: `/uploads/${file.filename}`,
      }));
    }

    const certificate = await MedicalCertificate.create({
      driverId,
      certificateNumber,
      countryCode,
      issuingAuthority,
      doctorName,
      hospitalOrClinic,
      issueDate,
      expiryDate,
      certificateUpload,
      fitnessStatus,
      restrictions:
        typeof restrictions === "string"
          ? restrictions.split(",")
          : restrictions,
      remarks,
      status: "pending",
      isVerified: false,
    });

    //  SOCKET EVENT
    const io = req.app.get("io");
    if (io) io.emit("medicalCertificateCreated", certificate);

    return res.status(201).json({
      success: true,
      message: "Medical certificate created successfully",
      data: certificate,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= GET ALL CERTIFICATES =================

export const getMedicalCertificates = async (req, res) => {
  try {
    const certificates = await MedicalCertificate.find({
      isDeleted: false,
    })
      .populate("driverId")
      .populate("verifiedBy")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: certificates.length,
      data: certificates,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= GET BY DRIVER =================

export const getMedicalCertificatesByDriver = async (req, res) => {
  try {
    const { driverId } = req.params;

    const certificates = await MedicalCertificate.find({
      isDeleted: false,
      driverId,
    })
      .populate("driverId")
      .populate("verifiedBy")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: certificates.length,
      data: certificates,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= GET SINGLE =================

export const getMedicalCertificateById = async (req, res) => {
  try {
    const certificate = await MedicalCertificate.findOne({
      _id: req.params.id,
      isDeleted: false,
    })
      .populate("driverId")
      .populate("verifiedBy");

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: "Certificate not found",
      });
    }

    return res.json({
      success: true,
      data: certificate,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= UPDATE =================

export const updateMedicalCertificate = async (req, res) => {
  try {
    const updateData = { ...req.body };

    if (req.files && req.files.length > 0) {
      updateData.certificateUpload = req.files.map((file) => ({
        certificatename: file.originalname,
        certificatefile: `/uploads/${file.filename}`,
      }));
    }

    const certificate = await MedicalCertificate.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true },
    );

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: "Certificate not found",
      });
    }

    //  SOCKET EVENT
    const io = req.app.get("io");
    if (io) io.emit("medicalCertificateUpdated", certificate);

    return res.json({
      success: true,
      message: "Updated successfully",
      data: certificate,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= VERIFY =================

export const verifyMedicalCertificate = async (req, res) => {
  try {
    const { status, reason } = req.body;
    const adminId = req.user?._id;

    const certificate = await MedicalCertificate.findById(req.params.id);

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: "Certificate not found",
      });
    }

    certificate.status = status;

    if (status === "approved") {
      certificate.isVerified = true;
      certificate.verifiedBy = adminId;
      certificate.verifiedAt = new Date();
      certificate.isEligible = true;
    }

    if (status === "rejected") {
      certificate.isVerified = false;
      certificate.rejectionReason = reason;
      certificate.isEligible = false;
    }

    certificate.history.push({
      status,
      changedBy: adminId,
      reason,
    });

    await certificate.save();

    //  SOCKET EVENT
    const io = req.app.get("io");
    if (io)
      io.emit("medicalCertificateVerified", {
        id: certificate._id,
        status: certificate.status,
        certificate,
      });

    return res.json({
      success: true,
      message: `Certificate ${status}`,
      data: certificate,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= SOFT DELETE =================

export const deleteMedicalCertificate = async (req, res) => {
  try {
    const adminId = req.user?._id;

    const certificate = await MedicalCertificate.findByIdAndUpdate(
      req.params.id,
      {
        isDeleted: true,
        deletedBy: adminId,
        deletedAt: new Date(),
      },
      { new: true },
    );

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: "Certificate not found",
      });
    }

    //  SOCKET EVENT
    const io = req.app.get("io");
    if (io) io.emit("medicalCertificateDeleted", certificate._id);

    return res.json({
      success: true,
      message: "Certificate deleted",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= RESTORE =================

export const restoreMedicalCertificate = async (req, res) => {
  try {
    const certificate = await MedicalCertificate.findByIdAndUpdate(
      req.params.id,
      {
        isDeleted: false,
        deletedBy: null,
        deletedAt: null,
      },
      { new: true },
    );

    //  SOCKET EVENT
    const io = req.app.get("io");
    if (io) io.emit("medicalCertificateRestored", certificate);

    return res.json({
      success: true,
      message: "Certificate restored",
      data: certificate,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
