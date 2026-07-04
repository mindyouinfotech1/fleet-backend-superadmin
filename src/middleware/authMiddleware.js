import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

// Verify JWT — from cookie or Authorization header
export const verifyToken = (req, res, next) => {
  try {
    const token =
      req.cookies?.token ||
      (req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.split(" ")[1]
        : null);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided, please login",
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { userId, email, roleId, orgId, isOrgAdmin }
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token, please login again",
    });
  }
};

// Only the main org admin can pass — used to protect sub-admin creation
export const isOrgAdmin = (req, res, next) => {
  if (!req.user?.isOrgAdmin) {
    return res.status(403).json({
      success: false,
      message: "Only the organization admin can perform this action",
    });
  }
  next();
};
