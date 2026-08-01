import mongoose from "mongoose";
import { Driver } from ".././../../models/User/Drivers/Driver.js";
import { DriverLicense } from ".././../../models/User/Drivers/DriverLicense.js";
import { MedicalCertificate } from ".././../../models/User/Drivers/MedicalCertificate.js";

const REQUIRED_DRIVER_FIELDS = [
  "firstName",
  "lastName",
  "dateOfBirth",
  "email",
  "countryId",
];

const REQUIRED_LICENSE_FIELDS = [
  "licenseNumber",
  "licenseType",
  "issueDate",
  "expiryDate",
  "issuingAuthority",
  "licenseFront",
  "licenseBack",
];

const REQUIRED_MEDICAL_FIELDS = [
  "certificateNumber",
  "doctorName",
  "hospitalOrClinic",
  "issueDate",
  "expiryDate",
  "fitnessStatus",
];

function findMissingFields(doc, requiredFields) {
  if (!doc) return requiredFields;
  return requiredFields.filter((field) => {
    const value = doc[field];
    return value === undefined || value === null || value === "";
  });
}

function getExpiryMeta(expiryDate, now, thresholdDays = 30) {
  if (!expiryDate) {
    return { isExpiringSoon: false, expiresInDays: null };
  }
  const expiry = new Date(expiryDate);
  const diffMs = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  // agar already expired hai toh "expiring soon" nahi kahenge, wo "expired" hai
  const isExpiringSoon = diffDays >= 0 && diffDays <= thresholdDays;

  return { isExpiringSoon, expiresInDays: diffDays };
}

function evaluateLicense(license, now) {
  if (!license) {
    return {
      exists: false,
      isExpired: null,
      isValid: false,
      isVerified: false,
      missingFields: REQUIRED_LICENSE_FIELDS,
    };
  }

  const isExpired = license.expiryDate
    ? new Date(license.expiryDate) < now
    : true;
  const missingFields = findMissingFields(license, REQUIRED_LICENSE_FIELDS);
  const isVerified = license.verified === true;
  const isValid = !isExpired && isVerified && missingFields.length === 0;

  return { exists: true, isExpired, isValid, missingFields, isVerified };
}

function evaluateMedicalCertificate(cert, now) {
  if (!cert) {
    return {
      exists: false,
      isExpired: null,
      isValid: false,
      isVerified: false,
      missingFields: REQUIRED_MEDICAL_FIELDS,
    };
  }

  const isExpired = cert.expiryDate ? new Date(cert.expiryDate) < now : true;
  const missingFields = findMissingFields(cert, REQUIRED_MEDICAL_FIELDS);
  const isVerified = cert.isVerified === true;
  const isValid = !isExpired && isVerified && missingFields.length === 0;

  return { exists: true, isExpired, isValid, missingFields, isVerified };
}

export const syncSingleDriverStatus = async (req, res) => {
  const { driverId } = req.params;
  const now = new Date();

  if (!mongoose.Types.ObjectId.isValid(driverId)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid driverId" });
  }

  try {
    const driver = await Driver.findOne({ _id: driverId, isDeleted: false });
    if (!driver) {
      return res
        .status(404)
        .json({ success: false, message: "Driver not found" });
    }

    const [license, medicalCert] = await Promise.all([
      DriverLicense.findOne({ driverId: driver._id, isDeleted: false }).sort({
        issueDate: -1,
      }),
      MedicalCertificate.findOne({
        driverId: driver._id,
        isDeleted: false,
      }).sort({ issueDate: -1 }),
    ]);

    const licenseEval = evaluateLicense(license, now);
    const medicalEval = evaluateMedicalCertificate(medicalCert, now);
    const driverMissingFields = findMissingFields(
      driver,
      REQUIRED_DRIVER_FIELDS,
    );

    const licenseExpiryMeta = getExpiryMeta(license?.expiryDate, now);
    const medicalExpiryMeta = getExpiryMeta(medicalCert?.expiryDate, now);

    const licenseEvalWithExpiry = { ...licenseEval, ...licenseExpiryMeta };
    const medicalEvalWithExpiry = { ...medicalEval, ...medicalExpiryMeta };

    if (license) {
      license.flags = license.flags || {};
      license.flags.isExpired = licenseEval.isExpired;
      license.flags.isEligible = licenseEval.isValid;
      license.flags.isExpiringSoon = licenseExpiryMeta.isExpiringSoon;
      license.status = licenseEval.isExpired ? "Expired" : license.status;
      await license.save();
    }

    if (medicalCert) {
      medicalCert.flags = medicalCert.flags || {};
      medicalCert.flags.isEligible = medicalEval.isValid;
      medicalCert.flags.isExpiringSoon = medicalExpiryMeta.isExpiringSoon;
      medicalCert.status = medicalEval.isExpired
        ? "expired"
        : medicalCert.status;
      await medicalCert.save();
    }

    const isDriverEligible =
      licenseEval.isValid &&
      medicalEval.isValid &&
      driverMissingFields.length === 0;

    const isExpiringSoon =
      licenseExpiryMeta.isExpiringSoon || medicalExpiryMeta.isExpiringSoon;

    driver.flags = driver.flags || {};
    driver.flags.isEligible = isDriverEligible;
    driver.flags.isExpiringSoon = isExpiringSoon;
    if (driver.driverStatus !== "Rejected") {
      driver.driverStatus = isDriverEligible ? "Active" : "Inactive";
    }
    await driver.save();

    return res.status(200).json({
      success: true,
      message: "Driver status synced",
      data: {
        driverId: driver._id,
        driverStatus: driver.driverStatus,
        isEligible: isDriverEligible,
        isExpiringSoon,
        license: licenseEvalWithExpiry,
        medicalCertificate: medicalEvalWithExpiry,
        missingDriverFields: driverMissingFields,
      },
    });
  } catch (error) {
    console.error("syncSingleDriverStatus error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to sync driver status",
      error: error.message,
    });
  }
};
