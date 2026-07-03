import multer from "multer";
import fs from "fs";
import path from "path";

const uploadFolder = path.join("./public/uploads");

// Ensure upload folder exists
if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadFolder); // save folder
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

export const upload = multer({ storage });

// import multer from "multer";
// import fs from "fs";
// import path from "path";

// const uploadFolder = path.join(
//   process.cwd(),
//   "storage",
//   "documents",
//   "drivers",
// );

// // folder create
// if (!fs.existsSync(uploadFolder)) {
//   fs.mkdirSync(uploadFolder, {
//     recursive: true,
//   });
// }

// const storage = multer.diskStorage({
//   destination(req, file, cb) {
//     cb(null, uploadFolder);
//   },

//   filename(req, file, cb) {
//     const ext = path.extname(file.originalname);

//     const name = Date.now() + "-" + Math.round(Math.random() * 999999) + ext;

//     cb(null, name);
//   },
// });

// // const fileFilter = (req, file, cb) => {
// //   const allowed = ["image/jpeg", "image/png", "application/pdf"];

// //   if (allowed.includes(file.mimetype)) {
// //     cb(null, true);
// //   } else {
// //     cb(new Error("Only image and pdf allowed"), false);
// //   }
// // };

// export const upload = multer({
//   storage,

//   // fileFilter,

//   limits: {
//     fileSize: 5 * 1024 * 1024,
//   },
// });
