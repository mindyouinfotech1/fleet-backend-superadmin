import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import {
  createEquipment,
  getAllEquipment,
  getEquipmentById,
  updateEquipment,
  addDocuments,
  deleteDocument,
  deleteEquipment,
  restoreEquipment,
  updateEquipmentStatus,
  getDeletedEquipment,
} from "../../../controllers/User/Equipment/Equipment.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {

    const dir = path.join(process.cwd(), "private/uploads/equipment");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /pdf|jpg|jpeg|png|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    if (ext) return cb(null, true);
    cb(new Error("Only PDF, JPG, PNG, WEBP files are allowed"));
  },
});


router.post("/", upload.array("documents", 20), createEquipment);
router.get("/", getAllEquipment);
router.get("/deleted", getDeletedEquipment);
router.get("/:id", getEquipmentById);
router.put("/:id", upload.array("documents", 20), updateEquipment);
router.delete("/:id", deleteEquipment);

router.post("/:id/documents", upload.array("documents", 20), addDocuments);
router.delete("/:id/documents/:documentId", deleteDocument);

router.patch("/:id/status", updateEquipmentStatus);
router.patch("/:id/restore", restoreEquipment);

export default router;
