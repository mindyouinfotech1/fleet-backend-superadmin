// middlewares/authMiddleware.js
import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // console.log("Received Authorization header:", authHeader); // Debugging log

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Bearer token missing" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded; // attach user info for role checks
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
