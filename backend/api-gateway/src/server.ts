import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();
const PORT = process.env.PORT || 3000;

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
const INCIDENT_SERVICE_URL = process.env.INCIDENT_SERVICE_URL || 'http://localhost:3002';
const DISPATCH_SERVICE_URL = process.env.DISPATCH_SERVICE_URL || 'http://localhost:3003';
const TRACKING_SERVICE_URL = process.env.TRACKING_SERVICE_URL || 'http://localhost:3004';
const HOSPITAL_SERVICE_URL = process.env.HOSPITAL_SERVICE_URL || 'http://localhost:3005';
const ANALYTICS_SERVICE_URL = process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3006';

app.use(cors());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'API Gateway is running' });
});

// Proxy setups
app.use('/auth', createProxyMiddleware({ target: AUTH_SERVICE_URL, changeOrigin: true }));
app.use('/incidents', createProxyMiddleware({ target: INCIDENT_SERVICE_URL, changeOrigin: true }));
app.use('/vehicles', createProxyMiddleware({ target: DISPATCH_SERVICE_URL, changeOrigin: true }));
app.use('/dispatch', createProxyMiddleware({ target: DISPATCH_SERVICE_URL, changeOrigin: true }));
app.use('/tracking', createProxyMiddleware({ target: TRACKING_SERVICE_URL, changeOrigin: true, pathRewrite: { '^/tracking': '' } }));
app.use('/hospitals', createProxyMiddleware({ target: HOSPITAL_SERVICE_URL, changeOrigin: true }));
app.use('/analytics', createProxyMiddleware({ target: ANALYTICS_SERVICE_URL, changeOrigin: true }));

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
  console.log(`  AUTH      -> ${AUTH_SERVICE_URL}`);
  console.log(`  INCIDENTS -> ${INCIDENT_SERVICE_URL}`);
  console.log(`  DISPATCH  -> ${DISPATCH_SERVICE_URL}`);
  console.log(`  TRACKING  -> ${TRACKING_SERVICE_URL}`);
  console.log(`  HOSPITALS -> ${HOSPITAL_SERVICE_URL}`);
  console.log(`  ANALYTICS -> ${ANALYTICS_SERVICE_URL}`);
});
