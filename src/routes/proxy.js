import { createProxyMiddleware } from 'http-proxy-middleware';
import { authMiddleware } from "../middlewares/auth.js";

export const setupProxies = (app) => {
  app.use('/ms-auth', createProxyMiddleware({
    target: 'http://ms-auth:3000',
    changeOrigin: true,
  }));

  app.use('/ms-book', authMiddleware, createProxyMiddleware({
    target: 'http://ms-book:3001',
    changeOrigin: true,
  }));

  app.use('/ms-notification', authMiddleware, createProxyMiddleware({
    target: 'http://ms-notification:3002',
    changeOrigin: true,
  }));
};
