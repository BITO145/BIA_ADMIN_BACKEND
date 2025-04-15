import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/authRoutes.js";
import superAdminRoutes from "./routes/superAdminRoutes.js";
import connectDB from "./db/db.js";

dotenv.config();

connectDB();

const app = express();

app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:8000"],
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// Rate limiting – 95 request per 15 minutes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 95,
  message: "Too many requests from this IP, please try again after 15 minutes",
});

app.use("/auth", apiLimiter, authRoutes);
app.use("/sa", apiLimiter, superAdminRoutes);

// Start the server
const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});

//complted with caching now
