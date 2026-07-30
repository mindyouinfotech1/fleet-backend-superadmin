import { StatusConfig } from "../../models/StatusConfig/StatusConfig.js";

export const createStatusConfig = async (req, res) => {
  try {
    const { module, fieldKey, fieldLabel, options } = req.body;

    if (!module || !fieldKey || !fieldLabel || !options) {
      return res.status(400).json({
        success: false,
        message: "module, fieldKey, fieldLabel aur options zaroori hain.",
      });
    }

    const existing = await StatusConfig.findOne({ module, fieldKey });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Is module aur fieldKey ka combination pehle se maujood hai.",
      });
    }

    const newConfig = await StatusConfig.create({
      module,
      fieldKey,
      fieldLabel,
      options,
    });

    return res.status(201).json({ success: true, data: newConfig });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllStatusConfigs = async (req, res) => {
  try {
    const configs = await StatusConfig.find().sort({ module: 1, fieldKey: 1 });
    return res.status(200).json({ success: true, data: configs });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getStatusConfigByModuleAndField = async (req, res) => {
  try {
    const { module, fieldKey } = req.query;

    if (!module || !fieldKey) {
      return res.status(400).json({
        success: false,
        message: "module aur fieldKey query params me zaroori hain.",
      });
    }

    const config = await StatusConfig.findOne({
      module,
      fieldKey,
      isActive: true,
    });

    if (!config) {
      return res.status(404).json({
        success: false,
        message: "Config nahi mila.",
      });
    }

    // Sirf active options hi dropdown me bhejna (disabled options chhupa dena)
    const activeOptions = config.options
      .filter((opt) => opt.isActive)
      .sort((a, b) => a.order - b.order);

    return res.status(200).json({
      success: true,
      data: {
        fieldLabel: config.fieldLabel,
        options: activeOptions,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getStatusConfigsByModule = async (req, res) => {
  try {
    const { module } = req.params;

    const configs = await StatusConfig.find({ module, isActive: true });

    return res.status(200).json({ success: true, data: configs });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateStatusConfig = async (req, res) => {
  try {
    const { id } = req.params;
    const { fieldLabel, options, isActive } = req.body;

    const config = await StatusConfig.findById(id);
    if (!config) {
      return res
        .status(404)
        .json({ success: false, message: "Config nahi mila." });
    }

    if (fieldLabel !== undefined) config.fieldLabel = fieldLabel;
    if (options !== undefined) config.options = options;
    if (isActive !== undefined) config.isActive = isActive;

    await config.save(); // pre-save hook (duplicate key check) yaha chalega

    return res.status(200).json({ success: true, data: config });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const addOption = async (req, res) => {
  try {
    const { id } = req.params;
    const { key, label, order } = req.body;

    if (!key || !label) {
      return res.status(400).json({
        success: false,
        message: "key aur label zaroori hain.",
      });
    }

    const config = await StatusConfig.findById(id);
    if (!config) {
      return res
        .status(404)
        .json({ success: false, message: "Config nahi mila." });
    }

    const keyExists = config.options.some(
      (opt) => opt.key.toLowerCase() === key.toLowerCase(),
    );
    if (keyExists) {
      return res.status(409).json({
        success: false,
        message: "Ye key pehle se maujood hai is group me.",
      });
    }

    config.options.push({ key, label, order: order || 0 });
    await config.save();

    return res.status(200).json({ success: true, data: config });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateOptionLabel = async (req, res) => {
  try {
    const { id, key } = req.params;
    const { label, order, isActive } = req.body;

    const config = await StatusConfig.findById(id);
    if (!config) {
      return res
        .status(404)
        .json({ success: false, message: "Config nahi mila." });
    }

    const option = config.options.find(
      (opt) => opt.key.toLowerCase() === key.toLowerCase(),
    );
    if (!option) {
      return res
        .status(404)
        .json({ success: false, message: "Option nahi mila." });
    }

    if (label !== undefined) option.label = label;
    if (order !== undefined) option.order = order;
    if (isActive !== undefined) option.isActive = isActive;

    await config.save();

    return res.status(200).json({ success: true, data: config });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const disableOption = async (req, res) => {
  try {
    const { id, key } = req.params;

    const config = await StatusConfig.findById(id);
    if (!config) {
      return res
        .status(404)
        .json({ success: false, message: "Config nahi mila." });
    }

    const option = config.options.find(
      (opt) => opt.key.toLowerCase() === key.toLowerCase(),
    );
    if (!option) {
      return res
        .status(404)
        .json({ success: false, message: "Option nahi mila." });
    }

    option.isActive = false;
    await config.save();

    return res.status(200).json({ success: true, data: config });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteStatusConfig = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await StatusConfig.findByIdAndDelete(id);
    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, message: "Config nahi mila." });
    }

    return res
      .status(200)
      .json({ success: true, message: "Config delete ho gaya." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
