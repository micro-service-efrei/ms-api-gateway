import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import { authMiddleware } from "../middlewares/auth.js";

export const setupProxies = (app) => {
  // Middleware de logging global
  app.use((req, res, next) => {
    console.log("Requête reçue sur l'API Gateway:", {
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body,
      timestamp: new Date().toISOString(),
    });
    next();
  });

  // Configuration du proxy pour le service d'authentification
  const msAuthProxy = createProxyMiddleware({
    target: "http://ms-auth:3000",
    changeOrigin: true,
    ws: true,
    proxyTimeout: 5000,
    timeout: 5000,
    pathRewrite: null,
    onProxyReq: (proxyReq, req, res) => {
      console.log("Début de la requête proxy auth:", {
        url: req.url,
        method: req.method,
        targetPath: proxyReq.path,
        headers: proxyReq.getHeaders(),
        timestamp: new Date().toISOString(),
      });

      if (req.body && (req.method === "POST" || req.method === "PUT")) {
        const bodyData = JSON.stringify(req.body);
        console.log("Envoi du body auth:", bodyData);
        proxyReq.setHeader("Content-Type", "application/json");
        proxyReq.setHeader("Content-Length", Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
        proxyReq.end();
      }
    },
    onProxyRes: (proxyRes, req, res) => {
      console.log("Réponse reçue du service auth:", {
        statusCode: proxyRes.statusCode,
        headers: proxyRes.headers,
        url: req.url,
        timestamp: new Date().toISOString(),
      });

      if (proxyRes.headers["authorization"]) {
        res.setHeader("authorization", proxyRes.headers["authorization"]);
      }

      let responseBody = "";
      proxyRes.on("data", (chunk) => {
        responseBody += chunk;
      });

      proxyRes.on("end", () => {
        console.log("Corps de la réponse auth:", {
          body: responseBody,
          url: req.url,
        });
      });
    },
    onError: (err, req, res) => {
      console.error("Erreur de proxy auth:", {
        error: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        timestamp: new Date().toISOString(),
      });
      res.status(502).json({
        error: "Erreur de proxy",
        message: err.message,
        path: req.url,
      });
    },
    logLevel: "debug",
    logProvider: () => console,
  });

  // Configuration du proxy pour le service de livres
  const msBookProxy = createProxyMiddleware({
    target: "http://ms-book:3001",
    changeOrigin: true,
    proxyTimeout: 5000,
    timeout: 5000,
    pathRewrite: {
      "^/ms-book": "",
    },
    onProxyReq: (proxyReq, req, res) => {
      console.log("Book Proxy - Incoming Request:", {
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: req.body,
        timestamp: new Date().toISOString(),
      });

      if (req.headers.authorization) {
        proxyReq.setHeader("Authorization", req.headers.authorization);
      }

      if ((req.method === "POST" || req.method === "PUT") && req.body) {
        proxyReq.removeHeader("Content-Length");

        const bodyData = JSON.stringify(req.body);
        console.log("Book Proxy - Preparing to send body:", bodyData);

        proxyReq.setHeader("Content-Type", "application/json");
        proxyReq.setHeader("Content-Length", Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
        proxyReq.end();
      }
    },
    onProxyRes: (proxyRes, req, res) => {
      let responseBody = "";
      proxyRes.on("data", (chunk) => {
        responseBody += chunk;
      });

      proxyRes.on("end", () => {
        console.log("Book Service Response:", {
          statusCode: proxyRes.statusCode,
          headers: proxyRes.headers,
          body: responseBody,
          timestamp: new Date().toISOString(),
        });

        if (proxyRes.statusCode === 400 && !responseBody.trim()) {
          res.status(400).json({
            error: "Bad Request",
            message: "Invalid book data format",
          });
        }
      });
    },
    onError: (err, req, res) => {
      console.error("Book Proxy Error:", {
        error: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        timestamp: new Date().toISOString(),
      });
      res.status(502).json({
        error: "Proxy Error",
        message: err.message,
      });
    },
    logLevel: "debug",
  });

  // Configuration du proxy pour le service de notifications
  const msNotificationProxy = createProxyMiddleware({
    target: "http://ms-notification:3002",
    changeOrigin: true,
    ws: true,
    proxyTimeout: 5000,
    timeout: 5000,
    pathRewrite: null,
    onProxyReq: (proxyReq, req, res) => {
      console.log("Début de la requête proxy notification:", {
        url: req.url,
        method: req.method,
        targetPath: proxyReq.path,
        headers: proxyReq.getHeaders(),
        timestamp: new Date().toISOString(),
      });

      if (req.body && (req.method === "POST" || req.method === "PUT")) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader("Content-Type", "application/json");
        proxyReq.setHeader("Content-Length", Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
        proxyReq.end();
      }
    },
    onProxyRes: (proxyRes, req, res) => {
      let responseBody = "";
      proxyRes.on("data", (chunk) => {
        responseBody += chunk;
      });

      proxyRes.on("end", () => {
        console.log("Notification Service Response:", {
          statusCode: proxyRes.statusCode,
          headers: proxyRes.headers,
          body: responseBody,
          timestamp: new Date().toISOString(),
        });
      });
    },
    onError: (err, req, res) => {
      console.error("Erreur de proxy notification:", {
        error: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
      });
      res.status(502).json({
        error: "Erreur de proxy",
        message: err.message,
      });
    },
    logLevel: "debug",
  });

  // Application des routes
  app.use("/ms-auth", msAuthProxy);

  // Routes du service book avec authentification conditionnelle
  app.use("/ms-book/books", (req, res, next) => {
    console.log("Processing book request:", {
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body,
    });

    if (req.method === "GET") {
      return msBookProxy(req, res, next);
    }

    authMiddleware(req, res, () => {
      console.log("Auth successful, forwarding to book service");
      msBookProxy(req, res, next);
    });
  });

  // Autres routes du service book
  app.use("/ms-book", authMiddleware, msBookProxy);

  // Routes notifications
  app.use("/ms-notification", authMiddleware, msNotificationProxy);

  // Middleware pour les routes non trouvées
  app.use((req, res) => {
    console.log("Route non trouvée:", {
      method: req.method,
      url: req.url,
      timestamp: new Date().toISOString(),
    });
    res.status(404).json({
      error: "Route non trouvée",
      path: req.url,
      method: req.method,
    });
  });
};
