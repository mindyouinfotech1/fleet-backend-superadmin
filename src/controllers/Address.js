import Country from "../models/Address/country.js";
import State from "../models/Address/state.js";
import City from "../models/Address/city.js";

/**
 * GET ALL Countries
 */
export const getAllCountries = async (req, res) => {
  try {
    const countries = await Country.find().sort({ name: 1 });

    return res.status(200).json({
      success: true,
      count: countries.length,
      data: countries,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * GET States BY Country ID
 */
export const getStatesByCountry = async (req, res) => {
  try {
    const { countryId } = req.params;

    if (!countryId) {
      return res.status(400).json({
        success: false,
        message: "Country ID is required",
      });
    }

    const states = await State.find({ country_id: Number(countryId) }).sort({
      name: 1,
    });

    return res.status(200).json({
      success: true,
      count: states.length,
      data: states,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * GET Cities BY State ID
 */
export const getCitiesByState = async (req, res) => {
  try {
    const { stateId } = req.params;

    if (!stateId) {
      return res.status(400).json({
        success: false,
        message: "State ID is required",
      });
    }

    const cities = await City.find({ state_id: Number(stateId) }).sort({
      name: 1,
    });

    return res.status(200).json({
      success: true,
      count: cities.length,
      data: cities,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
