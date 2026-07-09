import mongoose from "mongoose";
import { Driver } from ".././../../models/User/Drivers/Driver.js";
import { DriverLicense } from ".././../../models/User/Drivers/DriverLicense.js";
import { MedicalCertificate } from ".././../../models/User/Drivers/MedicalCertificate.js";

const REQUIRED_DRIVER_FIELDS = [
  "firstName",
  "lastName",
  "dateOfBirth",
  "email",
  // "phoneNumber",
  // "nationalIdOrAadharNumber",
  // "dateOfJoining",
  // "employmentType",
  // "address",
  // "pinCode",
  "countryId",
  // "stateId",
  // "cityId",
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

// -----------------------------------------------------------------------------
// Helper: check missing required fields on a document
// -----------------------------------------------------------------------------

function findMissingFields(doc, requiredFields) {
  if (!doc) return requiredFields; // pura document hi missing hai
  return requiredFields.filter((field) => {
    const value = doc[field];
    return value === undefined || value === null || value === "";
  });
}

// -----------------------------------------------------------------------------
// Helper: License expiry check
// -----------------------------------------------------------------------------
function evaluateLicense(license, now) {
  if (!license) {
    return {
      exists: false,
      isExpired: null,
      isValid: false,
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

// -----------------------------------------------------------------------------
// Helper: Medical certificate validity check
// -----------------------------------------------------------------------------
function evaluateMedicalCertificate(cert, now) {
  if (!cert) {
    return {
      exists: false,
      isExpired: null,
      isValid: false,
      missingFields: REQUIRED_MEDICAL_FIELDS,
    };
  }

  const isExpired = cert.expiryDate ? new Date(cert.expiryDate) < now : true;
  const missingFields = findMissingFields(cert, REQUIRED_MEDICAL_FIELDS);
  const isVerified = cert.isVerified === true;
  const isValid = !isExpired && isVerified && missingFields.length === 0;

  return { exists: true, isExpired, isValid, missingFields, isVerified };
}

export const syncAllDriverStatuses = async (req, res) => {
  const now = new Date();

  try {
    const drivers = await Driver.find({ isDeleted: false }).lean(false);

    const report = {
      generatedAt: now,
      totalDriversProcessed: 0,
      organizations: {}, // orgId -> { drivers: [...] }
      expiredLicenses: [],
      validMedicalCertificates: [],
      driversWithMissingInfo: [],
    };

    for (const driver of drivers) {
      // NOTE: DriverLicense/MedicalCertificate use driverId to link back to driver.
      // Ek driver ke multiple license/medical records ho sakte hain (history),
      // isliye sabse latest record (by issueDate) le rahe hain.
      const [license, medicalCert] = await Promise.all([
        DriverLicense.findOne({ driverId: driver._id, isDeleted: false }).sort({
          issueDate: -1,
        }),
        MedicalCertificate.findOne({
          driverId: driver._id,
          isDeleted: false,
        }).sort({
          issueDate: -1,
        }),
      ]);

      const licenseEval = evaluateLicense(license, now);
      const medicalEval = evaluateMedicalCertificate(medicalCert, now);
      const driverMissingFields = findMissingFields(
        driver,
        REQUIRED_DRIVER_FIELDS,
      );

      // ---------------------------------------------------------------------
      // Update License document in DB (expiry flag + status)
      // ---------------------------------------------------------------------
      if (license) {
        license.flags = license.flags || {};
        license.flags.isExpired = licenseEval.isExpired;
        license.flags.isEligible = licenseEval.isValid;
        license.status = licenseEval.isExpired ? "Expired" : license.status;
        await license.save();
      }

      // ---------------------------------------------------------------------
      // Update Medical Certificate document in DB (expiry/eligibility)
      // ---------------------------------------------------------------------
      if (medicalCert) {
        medicalCert.flags = medicalCert.flags || {};
        medicalCert.flags.isEligible = medicalEval.isValid;
        medicalCert.status = medicalEval.isExpired
          ? "expired"
          : medicalCert.status;
        await medicalCert.save();
      }

      // ---------------------------------------------------------------------
      // Compute overall driver eligibility + status
      // Rule: driver eligible only if license valid + medical cert valid +
      // driver profile has no missing required fields.
      // ---------------------------------------------------------------------
      const isDriverEligible =
        licenseEval.isValid &&
        medicalEval.isValid &&
        driverMissingFields.length === 0;

      driver.flags = driver.flags || {};
      driver.flags.isEligible = isDriverEligible;

      // driverStatus ko sirf tab autoupdate karo jab already rejected/manually
      // set na ho — taaki admin ka manual override overwrite na ho.
      if (driver.driverStatus !== "Rejected") {
        driver.driverStatus = isDriverEligible ? "Active" : "Inactive";
      }

      await driver.save();

      // ---------------------------------------------------------------------
      // Build report entries
      // ---------------------------------------------------------------------
      const driverSummary = {
        driverId: driver._id,
        driverCode: driver.DriverCodeByOrganization,
        name: `${driver.firstName} ${driver.lastName}`,
        organizationId: driver.organizationId,
        organizationCode: driver.organizationCode,
        driverStatus: driver.driverStatus,
        isEligible: isDriverEligible,
        license: {
          exists: licenseEval.exists,
          isExpired: licenseEval.isExpired,
          isValid: licenseEval.isValid,
          expiryDate: license ? license.expiryDate : null,
        },
        medicalCertificate: {
          exists: medicalEval.exists,
          isExpired: medicalEval.isExpired,
          isValid: medicalEval.isValid,
          expiryDate: medicalCert ? medicalCert.expiryDate : null,
        },
        missingDriverFields: driverMissingFields,
      };

      const orgId = String(driver.organizationId);
      if (!report.organizations[orgId]) {
        report.organizations[orgId] = {
          organizationCode: driver.organizationCode,
          drivers: [],
        };
      }
      report.organizations[orgId].drivers.push(driverSummary);

      if (licenseEval.isExpired) {
        report.expiredLicenses.push({
          driverId: driver._id,
          driverCode: driver.DriverCodeByOrganization,
          name: `${driver.firstName} ${driver.lastName}`,
          organizationId: driver.organizationId,
          licenseExpiryDate: license ? license.expiryDate : null,
        });
      }

      if (medicalEval.isValid) {
        report.validMedicalCertificates.push({
          driverId: driver._id,
          driverCode: driver.DriverCodeByOrganization,
          name: `${driver.firstName} ${driver.lastName}`,
          organizationId: driver.organizationId,
          medicalCertExpiryDate: medicalCert ? medicalCert.expiryDate : null,
        });
      }

      if (
        driverMissingFields.length > 0 ||
        licenseEval.missingFields.length > 0 ||
        medicalEval.missingFields.length > 0
      ) {
        report.driversWithMissingInfo.push({
          driverId: driver._id,
          driverCode: driver.DriverCodeByOrganization,
          name: `${driver.firstName} ${driver.lastName}`,
          organizationId: driver.organizationId,
          missingDriverFields: driverMissingFields,
          missingLicenseFields: licenseEval.missingFields,
          missingMedicalFields: medicalEval.missingFields,
        });
      }

      report.totalDriversProcessed += 1;
    }

    return res.status(200).json({
      success: true,
      message: "All driver statuses synced successfully",
      report,
    });
  } catch (error) {
    console.error("syncAllDriverStatuses error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to sync driver statuses",
      error: error.message,
    });
  }
};

const EXPIRY_WARNING_DAYS = 7;

function getExpiryMeta(expiryDate, now) {
  if (!expiryDate) {
    return { isExpiringSoon: false, expiresInDays: null };
  }

  const msPerDay = 1000 * 60 * 60 * 24;
  const diffDays = Math.ceil((new Date(expiryDate) - now) / msPerDay);

  return {
    // abhi expire nahi hua, aur warning window (7 din) ke andar hai
    isExpiringSoon: diffDays >= 0 && diffDays <= EXPIRY_WARNING_DAYS,
    expiresInDays: diffDays, // negative matlab already expired ho chuka
  };
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

    //  NAYA: expiry-soon meta nikalo (license/medicalCert ke expiryDate field se)
    const licenseExpiryMeta = getExpiryMeta(license?.expiryDate, now);
    const medicalExpiryMeta = getExpiryMeta(medicalCert?.expiryDate, now);

    //  NAYA: evaluateLicense/evaluateMedicalCertificate ke result me merge karo
    const licenseEvalWithExpiry = { ...licenseEval, ...licenseExpiryMeta };
    const medicalEvalWithExpiry = { ...medicalEval, ...medicalExpiryMeta };

    if (license) {
      license.flags = license.flags || {};
      license.flags.isExpired = licenseEval.isExpired;
      license.flags.isEligible = licenseEval.isValid;
      license.flags.isExpiringSoon = licenseExpiryMeta.isExpiringSoon; //  NAYA
      license.status = licenseEval.isExpired ? "Expired" : license.status;
      await license.save();
    }

    if (medicalCert) {
      medicalCert.flags = medicalCert.flags || {};
      medicalCert.flags.isEligible = medicalEval.isValid;
      medicalCert.flags.isExpiringSoon = medicalExpiryMeta.isExpiringSoon; //  NAYA
      medicalCert.status = medicalEval.isExpired
        ? "expired"
        : medicalCert.status;
      await medicalCert.save();
    }

    const isDriverEligible =
      licenseEval.isValid &&
      medicalEval.isValid &&
      driverMissingFields.length === 0;

    //  NAYA: overall driver-level expiring-soon flag
    const isExpiringSoon =
      licenseExpiryMeta.isExpiringSoon || medicalExpiryMeta.isExpiringSoon;

    driver.flags = driver.flags || {};
    driver.flags.isEligible = isDriverEligible;
    driver.flags.isExpiringSoon = isExpiringSoon; //  NAYA
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
        isExpiringSoon, //  NAYA: overall flag (license ya medical, dono me se koi bhi expiring soon ho)
        license: licenseEvalWithExpiry, //  ab isme isExpiringSoon + expiresInDays bhi honge
        medicalCertificate: medicalEvalWithExpiry, //  same yahan bhi
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

// -----------------------------------------------------------------------------
// OPTIONAL: Cron job wrapper (node-cron) - daily status auto-sync
// Route file me register mat karo isko, kisi server.js / cron.js me use karo:
//
//   import cron from "node-cron";
//   import { runDailyStatusSync } from "./controllers/driverStatusController.js";
//   cron.schedule("0 1 * * *", runDailyStatusSync); // roz raat 1 AM
// -----------------------------------------------------------------------------
export const runDailyStatusSync = async () => {
  const fakeReq = {};
  const fakeRes = {
    status: () => ({
      json: (data) => {
        console.log(
          "[Driver Status Cron]",
          data.message,
          "- processed:",
          data.report?.totalDriversProcessed,
        );
      },
    }),
  };
  await syncAllDriverStatuses(fakeReq, fakeRes);
};
