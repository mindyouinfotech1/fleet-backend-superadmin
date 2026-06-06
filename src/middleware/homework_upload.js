import multer from "multer";
import path from "path";

// Storage settings
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "/public/uploads"); // make sure this folder exists
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

export const upload = multer({ storage });
