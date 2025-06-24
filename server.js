import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/authRoutes.js";
import superAdminRoutes from "./routes/superAdminRoutes.js";
import connectDB from "./db/db.js";
import connectToCloudinary from "./config/cloudinary.js";

dotenv.config();

connectDB();
connectToCloudinary();

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:8000",
      "http://localhost:5174",
      "https://bia-admin-frontend.vercel.app",
      "https://www.bitoindustriesassociation.com",
      "https://bito-membership-frontend-ilwd.vercel.app",
    ],
    credentials: true,
  })
);

// console.log("CORS Options:", corsOptions);

// app.use(cors(corsOptions));

app.use(express.json());
app.use(cookieParser());

// Rate limiting – 95 request per 15 minutes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 195,
  message: "Too many requests from this IP, please try again after 15 minutes",
});

app.use("/auth", authRoutes);
app.use("/sa", superAdminRoutes);

// Start the server
const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});

app.get("/", (req, res) => {
  res.send("API is running 🟢");
});

//complted with caching now
