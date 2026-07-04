export const basicAuthMiddleware = (req, res, next) => {
  try {
    const basicHeader = req.headers["x-basic-auth"];

    if (!basicHeader || !basicHeader.startsWith("Basic ")) {
      return res
        .status(401)
        .json({ message: "Basic token missing or invalid" });
    }

    const token = basicHeader.split(" ")[1];

    if (token === process.env.BASIC_TOKEN) {
      return next();
    }

    return res.status(401).json({ message: "Invalid Basic token" });
  } catch (err) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
