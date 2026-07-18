import { ServiceType } from "../../../models/User/Work_Order_Trip/ServiceType.js";
import { User as BusinessUser } from "../../../models/SuperAdmin/Auth/Bussiness_User.js";
import { generateCode } from "../../../controllers/generateCode.js";

// ================= CREATE SERVICE TYPE =================

export const createServiceType = async (req, res) => {
  try {
    const {
      organizationId,
      serviceTypeName,
      category,
      defaultInterval,
      intervalType,
      estimatedCost,
      duration,
      description,
      status,
    } = req.body;

   
    if (!organizationId || !serviceTypeName) {
      return res.status(400).json({
        success: false,
        message: "Organization and Service Type Name are required.",
      });
    }
 

    // Organization Check

    const businessUser = await BusinessUser.findById(organizationId);

    if (!businessUser) {
      return res.status(404).json({
        success: false,
        message: "Organization not found.",
      });
    }


    // Duplicate Check

    const existingService = await ServiceType.findOne({
      organizationId,
      serviceTypeName,
    });
    console.log("4");

    if (existingService) {
      return res.status(409).json({
        success: false,
        code: "DUPLICATE_SERVICE_TYPE",
        message: "This service type already exists in your organization.",
      });
    }

    // Auto Generate Service Type ID

    const serviceTypeCode = await generateCode(
      organizationId,
      "serviceType",
      "SERV",
    );
  

    const serviceType = await ServiceType.create({
      organizationId,
      serviceTypeCode,
      ServiceTypeId: serviceTypeCode,

      serviceTypeName,

      category,

      defaultInterval,

      intervalType,

      estimatedCost,

      duration,

      description,

      status,
    });

    // SOCKET EVENT

    const io = req.app.get("io");

    if (io) {
      io.emit("serviceTypeCreated", serviceType);
    }

    return res.status(201).json({
      success: true,

      message: "Service Type created successfully.",

      data: serviceType,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,

      message: "Error creating service type.",
    });
  }
};

// ================= UPDATE SERVICE TYPE =================

export const updateServiceType = async (req, res) => {
  try {
    const { id } = req.params;

    const serviceType = await ServiceType.findById(id);

    if (!serviceType) {
      return res.status(404).json({
        success: false,

        message: "Service Type not found.",
      });
    }

    // Duplicate Check

    if (req.body.serviceTypeName) {
      const duplicate = await ServiceType.findOne({
        organizationId: serviceType.organizationId,

        serviceTypeName: req.body.serviceTypeName,

        _id: {
          $ne: id,
        },
      });

      if (duplicate) {
        return res.status(409).json({
          success: false,

          code: "DUPLICATE_SERVICE_TYPE",

          message: "Service Type already exists.",
        });
      }
    }

    const updatedServiceType = await ServiceType.findByIdAndUpdate(
      id,

      req.body,

      {
        new: true,
        runValidators: true,
      },
    );

    // SOCKET EVENT

    const io = req.app.get("io");

    if (io) {
      io.emit("serviceTypeUpdated", updatedServiceType);
    }

    return res.status(200).json({
      success: true,

      message: "Service Type updated successfully.",

      data: updatedServiceType,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,

      message: "Error updating service type.",
    });
  }
};

// ================= DELETE SERVICE TYPE =================

// export const deleteServiceType = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const serviceType = await ServiceType.findById(id);

//     if (!serviceType) {
//       return res.status(404).json({
//         success: false,

//         message: "Service Type not found.",
//       });
//     }

//     await serviceType.deleteOne();

//     // SOCKET EVENT

//     const io = req.app.get("io");

//     if (io) {
//       io.emit("serviceTypeDeleted", {
//         _id: id,
//       });
//     }

//     return res.status(200).json({
//       success: true,

//       message: "Service Type deleted successfully.",
//     });
//   } catch (error) {
//     console.error(error);

//     return res.status(500).json({
//       success: false,

//       message: "Error deleting service type.",
//     });
//   }
// };

export const deleteServiceType = async (req, res) => {
  try {
    const { id } = req.params;

    const serviceType = await ServiceType.findById(id);

    if (!serviceType) {
      return res.status(404).json({
        success: false,
        message: "Service Type not found.",
      });
    }

    serviceType.isDeleted = true;
    serviceType.deletedAt = new Date();
    await serviceType.save();

    // SOCKET EVENT
    const io = req.app.get("io");

    if (io) {
      io.emit("serviceTypeDeleted", { _id: id });
    }

    return res.status(200).json({
      success: true,
      message: "Service Type deleted successfully (soft delete).",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Error deleting service type.",
    });
  }
};

// ================= GET SINGLE =================

export const getServiceType = async (req, res) => {
  try {
    const { id } = req.params;

    const serviceType = await ServiceType.findById(id);

    if (!serviceType) {
      return res.status(404).json({
        success: false,

        message: "Service Type not found.",
      });
    }

    return res.status(200).json({
      success: true,

      data: serviceType,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,

      message: "Error fetching service type.",
    });
  }
};

// ================= GET ALL =================

export const getServiceTypes = async (req, res) => {
  try {
    const { organizationId } = req.params;

    const serviceTypes = await ServiceType.find({
      organizationId,
    }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,

      count: serviceTypes.length,

      data: serviceTypes,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,

      message: "Error fetching service types.",
    });
  }
};

// ================= CHANGE STATUS =================

export const changeServiceTypeStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const serviceType = await ServiceType.findById(id);

    if (!serviceType) {
      return res.status(404).json({
        success: false,

        message: "Service Type not found.",
      });
    }

    serviceType.status =
      serviceType.status === "Active" ? "Inactive" : "Active";

    await serviceType.save();

    // SOCKET EVENT

    const io = req.app.get("io");

    if (io) {
      io.emit("serviceTypeStatusChanged", serviceType);
    }

    return res.status(200).json({
      success: true,

      message: "Status updated successfully.",

      data: serviceType,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,

      message: "Error changing status.",
    });
  }
};

export const restoreServiceType = async (req, res) => {
  try {
    const { id } = req.params;

    const serviceType = await ServiceType.findByIdAndUpdate(
      id,
      { isDeleted: false, deletedAt: null },
      { new: true },
    );

    if (!serviceType) {
      return res.status(404).json({
        success: false,
        message: "Service Type not found.",
      });
    }

    const io = req.app.get("io");
    if (io) io.emit("serviceTypeRestored", serviceType);

    return res.status(200).json({
      success: true,
      message: "Service Type restored successfully.",
      data: serviceType,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error restoring service type.",
    });
  }
};
