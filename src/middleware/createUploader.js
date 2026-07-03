// import multer from "multer";
// import fs from "fs";
// import path from "path";

// const uploadPath = "private/uploads/driver-licenses";

// // Create folder if not exists
// if (!fs.existsSync(uploadPath)) {
//   fs.mkdirSync(uploadPath, { recursive: true });
// }

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, uploadPath);
//   },

//   filename: function (req, file, cb) {
//     const fileName =
//       Date.now() +
//       "-" +
//       Math.round(Math.random() * 1e9) +
//       path.extname(file.originalname);

//     cb(null, fileName);
//   },
// });

// const fileFilter = (req, file, cb) => {
//   const allowed = ["image/png", "image/jpeg", "image/jpg", "application/pdf"];

//   if (allowed.includes(file.mimetype)) {
//     cb(null, true);
//   } else {
//     cb(new Error("Only Image and PDF files are allowed"));
//   }
// };

// export default multer({
//   storage,
//   fileFilter,
// });

import multer from "multer";
import fs from "fs";
import path from "path";

export const createUploader = ({ uploadPath, allowedMimeTypes }) => {
  // Create folder if not exists
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadPath);
    },

    filename: (req, file, cb) => {
      const fileName =
        Date.now() +
        "-" +
        Math.round(Math.random() * 1e9) +
        path.extname(file.originalname);

      cb(null, fileName);
    },
  });

  const fileFilter = (req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("File type not allowed"));
    }
  };

  return multer({
    storage,
    fileFilter,
  });
};
