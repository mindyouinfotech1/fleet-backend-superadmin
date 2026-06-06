// middlewares/permission.js
// import User from "../models/User.js"; // apna model path

// export const checkPermission = (moduleName, subModuleName, action) => {
//   return async (req, res, next) => {
//     try {
//       const userId = req.headers["x-user-id"];
//       const userRole = req.headers["x-user-role"];

//       console.log("==== Permission Check ====");
//       console.log("User ID:", userId);
//       console.log("User Role:", userRole);
//       console.log("Requested Module:", moduleName);
//       console.log("Requested SubModule:", subModuleName);
//       console.log("Requested Action:", action);

//       // 1️⃣ SCHOOL_ADMIN bypass
//       if (userRole && userRole.toUpperCase() === "SCHOOL_ADMIN") {
//         console.log("Full access granted (SCHOOL_ADMIN)");
//         return next();
//       }

//       // 2️⃣ User ID missing
//       if (!userId) {
//         return res.status(401).json({ message: "User ID missing" });
//       }

//       // 3️⃣ Fetch user
//       const user = await User.findById(userId);
//       if (!user || !user.isActive || user.isDeleted) {
//         return res.status(403).json({ message: "User not valid" });
//       }

//       const permissions = user.permissions || [];

//       // 4️⃣ Detailed debug logs
//       console.log(`Fetched ${permissions.length} permissions from DB`);

//       const hasPermission = permissions.some((perm, index) => {
//         const permModule = (perm.module || "").toString().trim().toLowerCase();
//         const permSubModule = (perm.subModule || "")
//           .toString()
//           .trim()
//           .toLowerCase();
//         const permActionAllowed = perm.actions && perm.actions[action] === true;

//         const moduleMatch =
//           permModule === moduleName.trim().toLowerCase() ||
//           permModule === "all";
//         const subModuleMatch =
//           permSubModule === subModuleName.trim().toLowerCase() ||
//           permSubModule === "all";

//         console.log(
//           `Checking Permission[${index}]: module='${perm.module}', subModule='${perm.subModule}', actionAllowed=${permActionAllowed} → match=${moduleMatch && subModuleMatch && permActionAllowed}`,
//         );

//         return moduleMatch && subModuleMatch && permActionAllowed;
//       });

//       if (hasPermission) {
//         console.log("Permission granted ✅");
//         return next();
//       }

//       // 5️⃣ Access denied
//       console.log("Permission denied ❌");
//       return res.status(403).json({
//         message: "Access Denied: You do not have permission",
//       });
//     } catch (err) {
//       console.error("Permission Middleware Error:", err);
//       return res.status(500).json({ message: "Internal Server Error" });
//     }
//   };
// };

import User from "../models/User.js"; // apna model path

/**
 * Middleware: Check user permission
 * @param {string} moduleName - Module name, e.g., "TransportManagement"
 * @param {string} subModuleName - SubModule name, e.g., "PickupPoints"
 * @param {string} action - Action name, e.g., "add", "view", "edit", "delete"
 */
export const checkPermission = (moduleName, subModuleName, action) => {
  return async (req, res, next) => {
    try {
      const userId = req.headers["x-user-id"];
      const userRole = req.headers["x-user-role"];

      console.log("==== Permission Check ====");
      console.log("User ID:", userId);
      console.log("User Role:", userRole);
      console.log("Requested Module:", moduleName);
      console.log("Requested SubModule:", subModuleName);
      console.log("Requested Action:", action);

      // 1️⃣ SCHOOL_ADMIN bypass
      if (userRole && userRole.toUpperCase() === "SCHOOL_ADMIN") {
        console.log("Full access granted (SCHOOL_ADMIN) ✅");
        return next();
      }

      // 2️⃣ User ID missing
      if (!userId) {
        return res.status(401).json({ message: "User ID missing" });
      }

      // 3️⃣ Fetch user from DB with permissions
      const user = await User.findById(userId).select("+permissions").lean();
      if (!user || !user.isActive || user.isDeleted) {
        return res.status(403).json({ message: "User not valid" });
      }

      const permissions = user.permissions || [];

      console.log(`Fetched ${permissions.length} permissions from DB`);

      // 4️⃣ Check permission array
      const hasPermission = permissions.some((perm, index) => {
        const permModule = (perm.module || "").toString().trim();
        const permSubModule = (perm.subModule || "").toString().trim();
        const permActions = perm.actions || {};

        const moduleMatch =
          permModule.toLowerCase() === moduleName.trim().toLowerCase() ||
          permModule.toLowerCase() === "all";
        const subModuleMatch =
          permSubModule.toLowerCase() === subModuleName.trim().toLowerCase() ||
          permSubModule.toLowerCase() === "all";

        const actionAllowed = !!permActions[action]; // true if allowed

        console.log(
          `Permission[${index}]: module='${permModule}', subModule='${permSubModule}', actionAllowed=${actionAllowed} → match=${moduleMatch && subModuleMatch && actionAllowed}`,
        );

        return moduleMatch && subModuleMatch && actionAllowed;
      });

      if (hasPermission) {
        console.log("Permission granted ✅");
        return next();
      }

      // 5️⃣ Access denied
      console.log("Permission denied ❌");
      return res.status(403).json({
        message: "Access Denied: You do not have permission",
      });
    } catch (err) {
      console.error("Permission Middleware Error:", err);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  };
};
