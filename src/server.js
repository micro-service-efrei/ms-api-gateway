import express from 'express'
import morgan from 'morgan'
import dotenv from 'dotenv'
import { setupProxies } from './routes/proxy.js'
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(morgan('dev'));

setupProxies(app);

app.listen(PORT, () => {
  console.log(`API Gateway démarrée sur http://localhost:${PORT}`);
});
