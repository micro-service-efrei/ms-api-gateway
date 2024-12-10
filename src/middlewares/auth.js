import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const jwtSecret = process.env.JWT_SECRET;

export function authMiddleware(req, res, next) {
  try {
    console.log('Auth Headers:', req.headers);
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.log('No authorization header found');
      return res.status(401).json({ error: "No token provided" });
    }

    const parts = authHeader.split(" ");
    if (parts.length !== 2) {
      console.log('Invalid token format');
      return res.status(401).json({ error: "Token error" });
    }

    const [scheme, token] = parts;
    if (!/^Bearer$/i.test(scheme)) {
      console.log('Invalid token scheme');
      return res.status(401).json({ error: "Token malformatted" }); // Message harmonisé
    }

    jwt.verify(token, jwtSecret, { algorithms: ['HS256'] }, (err, decoded) => {
      if (err) {
        console.error('JWT Verification Error:', {
          error: err.message,
          token: token.substring(0, 10) + '...', // Log sécurisé du token
          secret: jwtSecret.substring(0, 3) + '...', // Log sécurisé de la clé
          timestamp: new Date().toISOString()
        });
        return res.status(401).json({ 
          error: "Token invalid",
          details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
      }
      console.log('Token decoded successfully:', {
        userId: decoded.id,
        role: decoded.role,
        timestamp: new Date().toISOString()
      });
      req.user = decoded;
      next();
    });
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    return res.status(500).json({ error: "Authentication error", message: error.message });
  }
}
