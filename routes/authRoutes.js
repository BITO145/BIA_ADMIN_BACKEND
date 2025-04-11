import { Router } from "express";
import { login, signup } from "../controllers/authController.js";

const router = Router();

//signup
router.post("/signup", signup); //tested

//login
router.post("/login", login); //tested

//logout
// router.post("/logout", logout);

export default router;
