// import User from "../models/User.js";
import centralUserModel from "../models/centralUserModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// Signup controller for superadmin only (remains unchanged)
export const signup = async (req, res) => {
  try {
    const { name, email, password, username, role } = req.body;
    if (role !== "superadmin") {
      return res.status(401).json({ error: "Only superadmin can sign up" });
    }
    const existingUser = await centralUserModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await centralUserModel.create({
      name,
      email,
      password: hashedPassword,
      username,
      role,
    });
    res
      .status(201)
      .json({ message: "Superadmin created successfully", user: newUser });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

// Login controller for both superadmin and subadmin with JWT sent as cookie
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await centralUserModel.findOne({ username });
    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid password" });
    }
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );
    // Send token in an httpOnly cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // use true in production
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });
    res.status(200).json({ message: "Login successful" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};
