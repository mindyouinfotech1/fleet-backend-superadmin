import { Customer } from "../../../models/User/Work_Order_Trip/Customer.js";
import { User as BusinessUser } from "../../../models/SuperAdmin/Auth/Bussiness_User.js";
import { generateCode } from "../../../controllers/generateCode.js";

// ================= CREATE CUSTOMER =================

export const createCustomer = async (req, res) => {
  try {
    const {
      organizationId,
      customerName,
      phone,
      email,
      country,
      state,
      city,
      address,
      status,
    } = req.body;

    if (!organizationId || !customerName) {
      return res.status(400).json({
        success: false,
        message: "Required fields are missing.",
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

    // Duplicate Email

    const emailExists = await Customer.findOne({
      organizationId,
      email,
      isDeleted: false,
    });

    if (emailExists) {
      return res.status(409).json({
        success: false,
        code: "DUPLICATE_EMAIL",
        message: "Customer email already exists.",
      });
    }
    // Duplicate Phone
    const phoneExists = await Customer.findOne({
      organizationId,
      phone,
      isDeleted: false,
    });

    if (phoneExists) {
      return res.status(409).json({
        success: false,
        code: "DUPLICATE_PHONE",
        message: "Customer phone already exists.",
      });
    }

    // Auto Customer ID
    const customerCode = await generateCode(organizationId, "customer", "CUST");

    const customer = await Customer.create({
      organizationId,
      customerName,
      customerCode,
      customerId: customerCode,
      phone,
      email,
      country,
      state,
      city,
      address,
      status,
    });

    // SOCKET EVENT
    const io = req.app.get("io");

    if (io) {
      io.emit("customerCreated", customer);
    }

    return res.status(201).json({
      success: true,
      message: "Customer created successfully.",
      data: customer,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Error creating customer.",
    });
  }
};

// ================= UPDATE CUSTOMER =================

export const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await Customer.findById(id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    // Email Duplicate Check

    if (req.body.email) {
      const emailExists = await Customer.findOne({
        organizationId: customer.organizationId,
        email: req.body.email,
        _id: { $ne: id },
        isDeleted: false,
      });

      if (emailExists) {
        return res.status(409).json({
          success: false,
          code: "DUPLICATE_EMAIL",
          message: "Customer email already exists.",
        });
      }
    }

    // Phone Duplicate Check

    if (req.body.phone) {
      const phoneExists = await Customer.findOne({
        organizationId: customer.organizationId,
        phone: req.body.phone,
        _id: { $ne: id },
        isDeleted: false,
      });

      if (phoneExists) {
        return res.status(409).json({
          success: false,
          code: "DUPLICATE_PHONE",
          message: "Customer phone already exists.",
        });
      }
    }

    const updatedCustomer = await Customer.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    // SOCKET EVENT

    const io = req.app.get("io");

    if (io) {
      io.emit("customerUpdated", updatedCustomer);
    }

    return res.status(200).json({
      success: true,
      message: "Customer updated successfully.",
      data: updatedCustomer,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Error updating customer.",
    });
  }
};

// ================= DELETE CUSTOMER =================

// export const deleteCustomer = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const customer = await Customer.findById(id);

//     if (!customer) {
//       return res.status(404).json({
//         success: false,
//         message: "Customer not found.",
//       });
//     }

//     await customer.deleteOne();

//     // SOCKET EVENT

//     const io = req.app.get("io");

//     if (io) {
//       io.emit("customerDeleted", {
//         _id: id,
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Customer deleted successfully.",
//     });
//   } catch (error) {
//     console.error(error);

//     return res.status(500).json({
//       success: false,
//       message: "Error deleting customer.",
//     });
//   }
// };

export const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await Customer.findById(id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    customer.isDeleted = true;
    customer.deletedAt = new Date();
    await customer.save();

    // SOCKET EVENT
    const io = req.app.get("io");

    if (io) {
      io.emit("customerDeleted", { _id: id });
    }

    return res.status(200).json({
      success: true,
      message: "Customer deleted successfully (soft delete).",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Error deleting customer.",
    });
  }
};

export const restoreCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await Customer.findByIdAndUpdate(
      id,
      { isDeleted: false, deletedAt: null },
      { new: true },
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    const io = req.app.get("io");
    if (io) io.emit("customerRestored", customer);

    return res.status(200).json({
      success: true,
      message: "Customer restored successfully.",
      data: customer,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error restoring customer.",
    });
  }
};

// ================= GET SINGLE CUSTOMER =================

export const getCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    // const customer = await Customer.findById(id);
    const customer = await Customer.findOne({ _id: id, isDeleted: false });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching customer.",
    });
  }
};

// ================= GET ALL CUSTOMERS =================

export const getCustomers = async (req, res) => {
  try {
    const { organizationId } = req.params;

    const customers = await Customer.find({
      organizationId,
      isDeleted: false,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: customers.length,
      data: customers,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching customers.",
    });
  }
};

// ================= CHANGE STATUS =================

export const changeCustomerStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await Customer.findById(id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    customer.status = customer.status === "Active" ? "Inactive" : "Active";

    await customer.save();

    // SOCKET EVENT

    const io = req.app.get("io");

    if (io) {
      io.emit("customerStatusChanged", customer);
    }

    return res.status(200).json({
      success: true,
      message: "Customer status updated.",
      data: customer,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error updating status.",
    });
  }
};
