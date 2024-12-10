import express from "express";
import morgan from "morgan";
import dotenv from "dotenv";
import cors from "cors";
import { setupProxies } from "./routes/proxy.js";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Configuration de base
app.use(morgan("dev"));
app.use(express.json({ 
  limit: "10mb",
  strict: false,  // Permet des JSON moins stricts
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      console.error("Invalid JSON:", e);
    }
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Ajout du body-parser avec option raw
app.use(express.json({ 
  limit: "10mb",
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

// Configuration CORS
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Middleware de logging amélioré
app.use((req, res, next) => {
  // Log de la requête entrante
  console.log("Incoming request:", {
    method: req.method,
    path: req.path,
    body: req.body,
    headers: req.headers,
    timestamp: new Date().toISOString(),
  });

  // Intercepter la réponse
  const oldJson = res.json;
  res.json = function (data) {
    console.log("Response data:", {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      data: data,
      timestamp: new Date().toISOString(),
    });
    return oldJson.apply(res, arguments);
  };

  // Log à la fin de la réponse
  res.on("finish", () => {
    console.log("Response completed:", {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      timestamp: new Date().toISOString(),
    });
  });

  next();
});

// Route de santé
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Configuration des proxies
setupProxies(app);

// Middleware de gestion des erreurs
app.use((err, req, res, next) => {
  console.error("Global error:", {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  res.status(500).json({
    error: "Server Error",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "An internal error occurred",
  });
});

// Démarrage du serveur
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`API Gateway started on http://localhost:${PORT}`);
  });
}

export default app;
