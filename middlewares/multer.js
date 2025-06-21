// middleware/multer.js
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";

import fs from "fs";
const uploadDir = path.join(process.cwd(), "uploads");

// Auto-create uploads folder if it doesn't exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // make sure 'uploads' folder exists
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, uuidv4() + ext); // unique filename
  },
});

const upload = multer({
  storage,
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Only .png, .jpg and .jpeg format allowed!"));
  },
});

export default upload;
