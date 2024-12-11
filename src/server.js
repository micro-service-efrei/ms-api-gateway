import express from "express";
import morgan from "morgan";
import dotenv from "dotenv";
import cors from "cors";
import { setupProxies } from "./routes/proxy.js";
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Configuration de base
app.use(morgan("dev"));

// Configuration unique du middleware JSON
app.use(
  express.json({
    limit: "10mb",
    strict: false,
    verify: (req, res, buf) => {
      try {
        JSON.parse(buf);
      } catch (e) {
        console.error("Invalid JSON:", e);
      }
      req.rawBody = buf.toString();
    },
  })
);

app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Configuration CORS
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    exposedHeaders: ["Authorization"],
  })
);

// Middleware de logging amélioré
app.use((req, res, next) => {
  console.log("Incoming request:", {
    method: req.method,
    path: req.path,
    body: req.body,
    headers: req.headers,
    timestamp: new Date().toISOString(),
  });

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

// Configuration Swagger
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Gateway Documentation',
      version: '1.0.0',
      description: 'Documentation de l\'API Gateway pour le système de microservices',
      contact: {
        name: 'API Support',
        url: 'http://localhost:4000'
      }
    },
    servers: [
      {
        url: 'http://localhost:4000',
        description: 'Serveur de développement'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: [
    './src/swagger/*.yaml',
    './src/routes/*.js'
  ].map(pattern => process.cwd() + '/' + pattern) // Utilisation des chemins absolus
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Déplacer la route Swagger AVANT la configuration des proxies et APRÈS la config CORS
app.use('/api-docs', swaggerUi.serve);
app.get('/api-docs', swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  swaggerOptions: {
    persistAuthorization: true
  }
}));

// Route de santé
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "api-gateway",
  });
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
    path: req.path,
    timestamp: new Date().toISOString(),
  });
});

// Démarrage du serveur
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`API Gateway started on http://localhost:${PORT}`);
  });
}

export default app;
