const express = require('express');
const morgan = require('morgan');
const dotenv = require('dotenv');
const authenticateToken = require('./middlewares/auth');
const setupProxies = require('./routes/proxy');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(morgan('dev'));

app.use(authenticateToken);

setupProxies(app);

app.listen(PORT, () => {
  console.log(`API Gateway démarrée sur http://localhost:${PORT}`);
});
