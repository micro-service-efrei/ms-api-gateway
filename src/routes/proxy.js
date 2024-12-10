const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = (app) => {
  app.use(
    '/users',
    createProxyMiddleware({
      target: 'http://localhost:5000',
      changeOrigin: true,
    })
  );

  // Proxy vers le Delivery Service
  app.use(
    '/deliveries',
    createProxyMiddleware({
      target: 'http://localhost:5001',
      changeOrigin: true,
    })
  );

  app.use(
    '/notifications',
    createProxyMiddleware({
      target: 'http://localhost:5002', 
      changeOrigin: true,
    })
  );
};
