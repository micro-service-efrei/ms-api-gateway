import {authMiddleware} from "../middlewares/auth";

module.exports = (app) => {
  app.use('/ms-auth', authMiddleware, createProxyMiddleware({
    target: 'http://localhost:3000',
    changeOrigin: true,
  }));

  app.use('/ms-book', authMiddleware, createProxyMiddleware({
    target: 'http://localhost:3001',
    changeOrigin: true,
  }));

  app.use('/ms-notification', authMiddleware, createProxyMiddleware({
    target: 'http://localhost:3002', 
    changeOrigin: true,
  }));
};