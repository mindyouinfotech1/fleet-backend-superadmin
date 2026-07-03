import express from "express";
import {
  getAllCountries,
  getStatesByCountry,
  getCitiesByState,
} from "../controllers/Address.js";

const router = express.Router();

router.get("/countries", getAllCountries);
router.get("/states/:countryId", getStatesByCountry);
router.get("/cities/:stateId", getCitiesByState);

export default router;
