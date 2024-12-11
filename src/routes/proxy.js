import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import { authMiddleware } from "../middlewares/auth.js";

export const setupProxies = (app) => {
  // Middleware de logging global
  app.use((req, res, next) => {
    console.log("Gateway Request:", {
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
    onProxyReq: (proxyReq, req, res) => {
      console.log("Auth Proxy Request:", {
        url: req.url,
        method: req.method,
        body: req.body,
        headers: proxyReq.getHeaders(),
        timestamp: new Date().toISOString(),
      });

      if (req.body && (req.method === "POST" || req.method === "PUT")) {
        const bodyData = JSON.stringify(req.body);
        // Reset Content-Length
        proxyReq.removeHeader("Content-Length");
        proxyReq.setHeader("Content-Type", "application/json");
        proxyReq.setHeader("Content-Length", Buffer.byteLength(bodyData));
        console.log("Sending body to auth service:", bodyData);
        proxyReq.write(bodyData);
      }
    },
    onProxyRes: (proxyRes, req, res) => {
      console.log("Auth Service Response Headers:", {
        statusCode: proxyRes.statusCode,
        headers: proxyRes.headers,
        url: req.url,
      });

      if (proxyRes.headers["authorization"]) {
        res.setHeader("authorization", proxyRes.headers["authorization"]);
      }

      let responseBody = "";
      proxyRes.on("data", (chunk) => {
        responseBody += chunk;
      });

      proxyRes.on("end", () => {
        console.log("Auth Service Response Body:", {
          statusCode: proxyRes.statusCode,
          body: responseBody,
          url: req.url,
        });
      });
    },
    onError: (err, req, res) => {
      console.error("Auth Proxy Error:", {
        error: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
      });
      res.status(502).json({
        error: "Proxy Error",
        message: err.message,
        path: req.url,
      });
    },
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
      if (req.headers.authorization) {
        proxyReq.setHeader("Authorization", req.headers.authorization);
      }

      if ((req.method === "POST" || req.method === "PUT") && req.body) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.removeHeader("Content-Length");
        proxyReq.setHeader("Content-Type", "application/json");
        proxyReq.setHeader("Content-Length", Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
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
          body: responseBody,
          url: req.url,
        });
      });
    },
    onError: (err, req, res) => {
      console.error("Book Proxy Error:", {
        error: err.message,
        stack: err.stack,
        url: req.url,
      });
      res.status(502).json({
        error: "Proxy Error",
        message: err.message,
      });
    },
  });

  // Configuration du proxy pour le service de notifications
  const msNotificationProxy = createProxyMiddleware({
    target:
      process.env.MS_NOTIFICATION_URL || "http://notification-service:3002",
    changeOrigin: true,
    ws: true,
    proxyTimeout: 30000,
    timeout: 30000,
    pathRewrite: {
      "^/ms-notification": "",
    },
    onError: (err, req, res) => {
      console.error("Notification Proxy Error:", {
        error: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        targetUrl: process.env.MS_NOTIFICATION_URL + req.url,
        networkInfo: {
          target: process.env.MS_NOTIFICATION_URL,
          originalUrl: req.originalUrl,
        },
      });
      res.status(502).json({
        error: "Proxy Error",
        message: err.message,
        path: req.url,
      });
    },
    onProxyReq: (proxyReq, req, res) => {
      console.log("Debug Notification Request:", {
        originalUrl: req.originalUrl,
        targetUrl: `${process.env.MS_NOTIFICATION_URL}${req.url}`,
        method: req.method,
        body: req.body,
        headers: req.headers,
      });
      if (req.headers.authorization) {
        proxyReq.setHeader("Authorization", req.headers.authorization);
      }

      if (req.body && (req.method === "POST" || req.method === "PUT")) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.removeHeader("Content-Length");
        proxyReq.setHeader("Content-Type", "application/json");
        proxyReq.setHeader("Content-Length", Buffer.byteLength(bodyData));
        console.log("Sending notification request:", bodyData);
        proxyReq.write(bodyData);
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
          body: responseBody,
          url: req.url,
          method: req.method,
          timestamp: new Date().toISOString(),
        });
      });
    },
  });

  // Application des routes
  // Route Auth sans middleware d'authentification
  app.use("/ms-auth", msAuthProxy);

  // Routes Book avec authentification conditionnelle
  app.use("/ms-book/books", (req, res, next) => {
    if (req.method === "GET") {
      return msBookProxy(req, res, next);
    }
    authMiddleware(req, res, () => msBookProxy(req, res, next));
  });

  // Autres routes Book
  app.use("/ms-book", authMiddleware, msBookProxy);

  // Routes Notification avec authentification
  app.use("/ms-notification", authMiddleware, (req, res, next) => {
    const targetPath = req.url.replace("/ms-notification", "");
    console.log("Notification routing debug:", {
      originalUrl: req.originalUrl,
      url: req.url,
      targetPath: targetPath,
      fullTargetUrl: `${process.env.MS_NOTIFICATION_URL}${targetPath}`,
    });
    req.url = targetPath; // Modification de l'URL pour le proxy
    return msNotificationProxy(req, res, next);
  });

  // Middleware pour les routes non trouvées
  app.use((req, res) => {
    console.log("Route not found:", {
      method: req.method,
      url: req.url,
      timestamp: new Date().toISOString(),
    });
    res.status(404).json({
      error: "Route not found",
      path: req.url,
      method: req.method,
      timestamp: new Date().toISOString(),
    });
  });
};
