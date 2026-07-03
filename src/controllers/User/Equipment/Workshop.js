import Workshop from "../../../models/User/Equipment/Workshop.js";
import country from "../../../models/Address/country.js";
import state from "../../../models/Address/state.js";
import city from "../../../models/Address/city.js";

export const createWorkshop = async (req, res) => {
  try {
    const {
      organizationId,
      workshopName,
      workshopOwner,
      workshopEmail,
      workshopPhone,
      country,
      state,
      city,
      address,
      status,
    } = req.body;

    const workshop = await Workshop.create({
      organizationId,
      workshopName,
      workshopOwner,
      workshopEmail,
      workshopPhone,
      country,
      state,
      city,
      address,
      status,
    });

    //  SOCKET EVENT EMIT
    const io = req.app.get("io");
    if (io) io.emit("workshopCreated", workshop);

    return res.status(201).json({
      success: true,
      message: "Workshop created successfully",
      data: workshop,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllWorkshops = async (req, res) => {
  try {
    const { organizationId, status } = req.query;

    let filter = {};
    if (organizationId) filter.organizationId = organizationId;
    if (status) filter.status = status;

    const workshops = await Workshop.find(filter)
      .populate("organizationId")
      .populate({ path: "country", select: "name", model: "Country" })
      .populate({ path: "state", select: "name", model: "State" })
      .populate({ path: "city", select: "name", model: "City" })
      .sort({ createdAt: -1 });

    const result = workshops.map((w) => {
      const obj = w.toObject();
      obj.country = obj.country?.name || null;
      obj.state = obj.state?.name || null;
      obj.city = obj.city?.name || null;
      return obj;
    });

    return res.status(200).json({
      success: true,
      count: result.length,
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * GET SINGLE Workshop BY ID
 */
export const getWorkshopById = async (req, res) => {
  try {
    const { id } = req.params;

    const workshop = await Workshop.findById(id).populate("organizationId");

    if (!workshop) {
      return res.status(404).json({
        success: false,
        message: "Workshop not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: workshop,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * UPDATE Workshop
 */
export const updateWorkshop = async (req, res) => {
  try {
    const { id } = req.params;

    const updatedWorkshop = await Workshop.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedWorkshop) {
      return res.status(404).json({
        success: false,
        message: "Workshop not found",
      });
    }

    //  SOCKET EVENT EMIT
    const io = req.app.get("io");
    if (io) io.emit("workshopUpdated", updatedWorkshop);

    return res.status(200).json({
      success: true,
      message: "Workshop updated successfully",
      data: updatedWorkshop,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * DELETE Workshop
 */
export const deleteWorkshop = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedWorkshop = await Workshop.findByIdAndDelete(id);

    if (!deletedWorkshop) {
      return res.status(404).json({
        success: false,
        message: "Workshop not found",
      });
    }

    //  SOCKET EVENT EMIT
    const io = req.app.get("io");
    if (io) io.emit("workshopDeleted", id);

    return res.status(200).json({
      success: true,
      message: "Workshop deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
