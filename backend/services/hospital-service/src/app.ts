import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { authGuard } from './middleware/auth';
import hospitalsRouter from './routes/hospitals';


const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/hospitals', authGuard, hospitalsRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'Hospital service running' });
});

export default app;
