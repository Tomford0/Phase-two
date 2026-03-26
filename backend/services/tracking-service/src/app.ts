import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { authGuard } from './middleware/auth';
import trackingRouter from './routes/tracking';

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/', authGuard, trackingRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'Tracking service running' });
});

export default app;
