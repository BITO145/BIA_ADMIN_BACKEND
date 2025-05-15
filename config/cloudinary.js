// utils/cloudinary.js
import cloudinary from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

const connectToCloudinary = () => {
  cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET,
  });
};

export default connectToCloudinary;