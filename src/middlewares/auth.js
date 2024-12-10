const { createProxyMiddleware } = require('http-proxy-middleware');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

const jwtSecret = process.env.JWT_SECRET;

function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
      return res.status(401).json({ error: "No token provided" });
    }

    const parts = authHeader.split(" ");
    if (parts.length !== 2) {
      return res.status(401).json({ error: "Token error" });
    }

    const [scheme, token] = parts;
    if (!/^Bearer$/i.test(scheme)) {
      return res.status(401).json({ error: "Token malformatted" });
    }

    jwt.verify(token, jwtSecret, (err, decoded) => {
      if (err) {
        return res.status(401).json({ error: "Token invalid" });
      }
      req.user = decoded;
      next();
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}

module.exports = (app) => {
    authMiddleware();
}
