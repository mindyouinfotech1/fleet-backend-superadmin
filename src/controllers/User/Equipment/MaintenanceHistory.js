import { MaintenanceHistory } from "../../../models/User/Maintenance/MaintenanceHistory.js";
import { Maintenance } from "../../../models/User/Maintenance/maintenanceDue.js";
import { generateCode } from "../../../controllers/generateCode.js";

const emitToOrg = (req, organizationId, equipmentId, event, payload) => {
  const io = req.app.get("io");
  if (!io) return;

  io.to(`org_${organizationId}`).emit(event, payload);
  if (equipmentId) {
    io.to(`equipment_${equipmentId}`).emit(event, payload);
  }
};

export const createMaintenanceHistory = async (req, res) => {
  try {
    const organizationId = req.body.organizationId || req.user?.organizationId;

    const {
      equipment,
      driverId,
      workshopId,
      serviceNameId,
      otherServiceName,
      service_type,
      last_service_date,
      current_service_date,
      service_km,
      service_interval_km,
      service_hours,
      service_interval_hours,
      current_km,
      current_hours,
      mechanic_or_shop_name,
      service_cost,
      service_description,
    } = req.body;

    if (!organizationId || !equipment || !driverId || !service_type) {
      return res.status(400).json({
        success: false,
        message:
          "organizationId, equipment, driverId and service_type are required",
      });
    }

    const invoice_file = req.file ? req.file.path : null;

    // Find the open due-tracker record for this equipment + tracking basis
    const dueRecord = await Maintenance.findOne({
      equipment,
      maintenance_type: service_type,
      status: "pending",
      isDeleted: false,
    });

    const maintenanceCode = await generateCode(
      organizationId,
      "maintenanceHistory",
      "MH",
    );

    const historyDoc = await MaintenanceHistory.create({
      organizationId,
      maintenanceCode,
      equipment,
      maintenanceId: dueRecord?._id || null,
      driverId,
      workshopId: workshopId || null,
      serviceNameId: serviceNameId || null,
      otherServiceName: otherServiceName || null,
      service_type,
      last_service_date,
      current_service_date,
      service_km: service_km ?? null,
      service_interval_km:
        service_interval_km ?? dueRecord?.service_interval_km ?? null,
      service_hours: service_hours ?? null,
      service_interval_hours:
        service_interval_hours ?? dueRecord?.service_interval_hours ?? null,
      current_km: current_km ?? null,
      current_hours: current_hours ?? null,
      mechanic_or_shop_name,
      service_cost,
      invoice_file,
      service_description,
      status: "pending",
      history: [{ status: "pending", reason: "Maintenance history created" }],
    });

    // Refresh the due-tracker so the next cycle starts from this service
    if (dueRecord) {
      const update = {
        last_service_date: current_service_date,
        status: "pending",
      };

      if (service_km !== undefined && service_km !== null) {
        const interval = service_interval_km ?? dueRecord.service_interval_km;
        update.start_km = service_km;
        update.current_km = current_km ?? service_km;
        update.next_service_due_km =
          interval != null ? service_km + interval : null;
        update.remaining_km = interval ?? null;
      }

      if (service_hours !== undefined && service_hours !== null) {
        const interval =
          service_interval_hours ?? dueRecord.service_interval_hours;
        update.start_hours = service_hours;
        update.current_hours = current_hours ?? service_hours;
        update.next_service_due_hours =
          interval != null ? service_hours + interval : null;
        update.remaining_hours = interval ?? null;
      }

      await Maintenance.findByIdAndUpdate(dueRecord._id, {
        $set: update,
        $push: {
          history: {
            status: "pending",
            reason: `New cycle started after service on ${new Date(current_service_date).toDateString()}`,
          },
        },
      });
    }

    emitToOrg(
      req,
      organizationId,
      equipment,
      "maintenanceHistory:created",
      historyDoc,
    );

    if (dueRecord) {
      const refreshedDue = await Maintenance.findById(dueRecord._id);
      emitToOrg(
        req,
        organizationId,
        equipment,
        "maintenanceDue:updated",
        refreshedDue,
      );
    }

    return res.status(201).json({ success: true, data: historyDoc });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteMaintenanceInvoice = async (req, res) => {
  try {
    const { maintenanceHistoryId } = req.params;

    const maintenanceHistory =
      await MaintenanceHistory.findById(maintenanceHistoryId);

    if (!maintenanceHistory) {
      return res.status(404).json({
        success: false,
        message: "Maintenance history not found",
      });
    }

    if (!maintenanceHistory.invoice_file) {
      return res.status(404).json({
        success: false,
        message: "Invoice file not found",
      });
    }

    // remove file path from database
    maintenanceHistory.invoice_file = null;

    await maintenanceHistory.save();

    return res.status(200).json({
      success: true,
      message: "Invoice deleted successfully",
      data: maintenanceHistory,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllMaintenanceHistory = async (req, res) => {
  try {
    const { organizationId } = req.query;

    if (!organizationId) {
      return res
        .status(400)
        .json({ success: false, message: "organizationId is required" });
    }

    const records = await MaintenanceHistory.find({
      organizationId,
      isDeleted: false,
    })
      .populate("equipment")
      .populate("driverId")
      .populate("workshopId")
      .populate("serviceNameId")
      .populate("maintenanceId")
      .sort({ current_service_date: -1 });

    return res.status(200).json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getMaintenanceHistoryByEquipment = async (req, res) => {
  try {
    const { equipmentId } = req.params;

    const records = await MaintenanceHistory.find({
      equipment: equipmentId,
      isDeleted: false,
    })
      .populate("organizationId")
      .populate("equipment")
      .populate("driverId")
      .populate("workshopId")
      .populate("serviceNameId")
      .populate("maintenanceId")
      .sort({ current_service_date: -1 });

    return res.status(200).json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getMaintenanceHistoryById = async (req, res) => {
  try {
    const record = await MaintenanceHistory.findOne({
      _id: req.params.id,
      isDeleted: false,
    })
      .populate("organizationId")
      .populate("equipment")
      .populate("driverId")
      .populate("workshopId")
      .populate("serviceNameId")
      .populate("maintenanceId");

    if (!record) {
      return res
        .status(404)
        .json({ success: false, message: "Record not found" });
    }

    return res.status(200).json({ success: true, data: record });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateMaintenanceHistory = async (req, res) => {
  try {
    const { id } = req.params;

    const record = await MaintenanceHistory.findOne({
      _id: id,
      isDeleted: false,
    });
    if (!record) {
      return res
        .status(404)
        .json({ success: false, message: "Record not found" });
    }

    if (req.file) {
      req.body.invoice_file = req.file.path;
    }

    const updated = await MaintenanceHistory.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true, runValidators: true },
    );

    emitToOrg(
      req,
      updated.organizationId,
      updated.equipment,
      "maintenanceHistory:updated",
      updated,
    );

    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyMaintenanceHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body; // status: "approved" | "rejected" | "completed"

    const record = await MaintenanceHistory.findOne({
      _id: id,
      isDeleted: false,
    });
    if (!record) {
      return res
        .status(404)
        .json({ success: false, message: "Record not found" });
    }

    record.status = status;
    record.isVerified = status === "approved" || status === "completed";
    record.verifiedAt = new Date();
    record.rejectionReason =
      status === "rejected" ? rejectionReason || null : null;
    record.history.push({
      status,
      reason:
        status === "rejected" ? rejectionReason : `Status changed to ${status}`,
    });

    await record.save();

    emitToOrg(
      req,
      record.organizationId,
      record.equipment,
      "maintenanceHistory:verified",
      record,
    );

    return res.status(200).json({ success: true, data: record });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteMaintenanceHistory = async (req, res) => {
  try {
    const { id } = req.params;

    const record = await MaintenanceHistory.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: { isDeleted: true, deletedAt: new Date() } },
      { new: true },
    );

    if (!record) {
      return res
        .status(404)
        .json({ success: false, message: "Record not found" });
    }

    emitToOrg(
      req,
      record.organizationId,
      record.equipment,
      "maintenanceHistory:deleted",
      {
        _id: record._id,
      },
    );

    return res
      .status(200)
      .json({ success: true, message: "Deleted successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
