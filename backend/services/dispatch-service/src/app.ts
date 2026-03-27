import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { authGuard } from './middleware/auth';
import dispatchRouter from './routes/dispatch';


const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/', authGuard, dispatchRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'Dispatch service running' });
});

export default app;
