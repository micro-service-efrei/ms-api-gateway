const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = (app) => {
  app.use(
    '/ms-auth',
    createProxyMiddleware({
      target: 'http://localhost:3000',
      changeOrigin: true,
    })
  );

  app.use(
    '/ms-book',
    createProxyMiddleware({
      target: 'http://localhost:3001',
      changeOrigin: true,
    })
  );

  app.use(
    '/ms-notification',
    createProxyMiddleware({
      target: 'http://localhost:3002', 
      changeOrigin: true,
    })
  );
};
