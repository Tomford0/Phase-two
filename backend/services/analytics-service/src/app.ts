import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import analyticsRouter from './routes/analytics';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

// For gateway
app.use('/', analyticsRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'Analytics service running' });
});

export default app;
