import express from "express";

import {
  createHotel,
  getAllHotels,
  getHotelsByTrip,
  getHotelById,
  updateHotel,
  deleteHotel,
} from "../../../controllers/User/Work_Order_Trip/Hotel.js";

import { createUploader } from "../../../middleware/createUploader.js";
import { UPLOAD_PATHS } from "../../../config/uploadConfig.js";

const router = express.Router();

const upload = createUploader({
  uploadPath: UPLOAD_PATHS.HOTEL_RECEIPT,
  allowedMimeTypes: ["image/png", "image/jpeg", "image/jpg", "application/pdf"],
});

// Create Hotel
router.post("/", upload.single("receiptDocument"), createHotel);

// Get All Hotels
router.get("/", getAllHotels);

// Get Hotels By Trip
router.get("/trip/:tripId", getHotelsByTrip);

// Get Hotel By Id
router.get("/:id", getHotelById);

// Update Hotel
router.put("/:id", upload.single("receiptDocument"), updateHotel);

// Delete Hotel
router.delete("/:id", deleteHotel);

export default router;
