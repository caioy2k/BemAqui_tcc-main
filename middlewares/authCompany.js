const jwt = require("jsonwebtoken");

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: "Token não informado." });
    }

    const parts = authHeader.split(" ");

    if (parts.length !== 2) {
      return res.status(401).json({ error: "Token mal formatado." });
    }

    const [scheme, token] = parts;

    if (scheme !== "Bearer") {
      return res.status(401).json({ error: "Token mal formatado." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.companyId = decoded.id;
    req.companyEmail = decoded.email;

    next();
  } catch (error) {
    return res.status(401).json({ error: "Token inválido ou expirado." });
  }
};