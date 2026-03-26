import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import authRouter from './routes/auth';
import incidentsRouter from './routes/incidents';
import vehiclesRouter from './routes/vehicles';
import trackingRouter from './routes/tracking';
import hospitalsRouter from './routes/hospitals';
import { authGuard } from './middleware/auth';
import { notFound, errorHandler } from './middleware/error';

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());
app.use(morgan('dev'));

app.use('/auth', authRouter);
app.use('/incidents', authGuard, incidentsRouter);
app.use('/vehicles', authGuard, vehiclesRouter);
app.use('/', authGuard, trackingRouter);
app.use('/hospitals', authGuard, hospitalsRouter);

app.use(notFound);
app.use(errorHandler);

export default app;
