// // middlewares/basicAuthMiddleware.js
// export const basicAuthMiddleware = (req, res, next) => {
//   try {
//     const authHeader = req.headers.authorization;

//     if (!authHeader || !authHeader.startsWith("Basic ")) {
//       return res
//         .status(401)
//         .json({ message: "Basic token missing or invalid" });
//     }

//     const base64 = authHeader.split(" ")[1];
//     const decoded = Buffer.from(base64, "base64").toString();
//     const [username, password] = decoded.split(":");

//     // TODO: Replace with your actual username/password from env variables
//     if (
//       username === process.env.BASIC_USER &&
//       password === process.env.BASIC_PASSWORD
//     ) {
//       return next();
//     }

//     return res.status(401).json({ message: "Invalid Basic token" });
//   } catch (err) {
//     return res.status(500).json({ message: "Internal Server Error" });
//   }
// };

export const basicAuthMiddleware = (req, res, next) => {
  try {
    const basicHeader = req.headers["x-basic-auth"];
    // const userId = req.headers["x-user-id"];
    // const userRole = req.headers["x-user-role"];
    // console.log("Received X-Basic-Auth header:", basicHeader);
    // console.log("User ID:", userId);
    // console.log("User Role:", userRole);

    if (!basicHeader || !basicHeader.startsWith("Basic ")) {
      return res
        .status(401)
        .json({ message: "Basic token missing or invalid" });
    }

    const token = basicHeader.split(" ")[1];

    // console.log("Received Basic token:", token);
    // console.log("Expected Basic token:", process.env.BASIC_TOKEN);

    if (token === process.env.BASIC_TOKEN) {
      return next();
    }

    return res.status(401).json({ message: "Invalid Basic token" });
  } catch (err) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
