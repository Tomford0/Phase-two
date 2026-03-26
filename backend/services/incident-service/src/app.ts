import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { authGuard } from './middleware/auth';
import incidentsRouter from './routes/incidents';

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/incidents', authGuard, incidentsRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'Incident service running' });
});

export default app;
