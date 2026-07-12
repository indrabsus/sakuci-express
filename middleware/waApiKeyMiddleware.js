require("dotenv").config();

const waApiKeyMiddleware = (req, res, next) => {
  const apiKey = req.header("x-api-key");

  if (!apiKey || apiKey !== process.env.WA_API_KEY) {
    return res.status(401).json({ status: "error", message: "API key tidak valid." });
  }

  next();
};

module.exports = waApiKeyMiddleware;
