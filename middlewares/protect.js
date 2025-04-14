import jwt from "jsonwebtoken";
import centralUserModel from "../models/centralUserModel.js";

// Middleware for role based access: Checks if a user can access a specified feature.
export const requireFeature = (featureName) => {
  return async (req, res, next) => {
    try {
      const token = req.cookies.token; // Ensure you use cookie-parser middleware in express.
      if (!token) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await centralUserModel.findById(decoded.id);
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }
      // Superadmins are always allowed. Subadmins need specific feature permission.
      if (
        (user.role === "superadmin" || user.role === "subadmin") &&
        (user.role === "superadmin" ||
          (user.allowedFeatures &&
            user.allowedFeatures.some(
              (f) => f.feature === featureName && f.allowed
            )))
      ) {
        req.user = user;
        next();
      } else {
        return res
          .status(403)
          .json({ error: "Access denied for this feature" });
      }
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  };
};

export const protect = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await centralUserModel.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};
