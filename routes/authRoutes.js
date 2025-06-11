import { Router } from "express";
import {
  login,
  logout,
  profile,
  signup,
} from "../controllers/authController.js";
import { protect } from "../middlewares/protect.js";

const router = Router();

//https://localhost:3000/signup/auth

//signup
router.post("/signup", signup); //tested

//login
router.post("/login", login); //tested

//get profile
router.get("/profile", protect, profile); //tested

//logout
router.post("/logout", logout);

export default router;
