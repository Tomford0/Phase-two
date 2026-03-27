import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'API Gateway is running' });
});

// Proxy setups
app.use('/auth', createProxyMiddleware({ target: 'http://localhost:3001', changeOrigin: true }));
app.use('/incidents', createProxyMiddleware({ target: 'http://localhost:3002', changeOrigin: true }));
app.use('/vehicles', createProxyMiddleware({ target: 'http://localhost:3003', changeOrigin: true })); // Dispatch service for vehicles
app.use('/tracking', createProxyMiddleware({ target: 'http://localhost:3004', changeOrigin: true, pathRewrite: { '^/tracking': '' } })); // Tracking might overlap
app.use('/hospitals', createProxyMiddleware({ target: 'http://localhost:3005', changeOrigin: true }));
app.use('/analytics', createProxyMiddleware({ target: 'http://localhost:3006', changeOrigin: true }));

app.listen(PORT, () => {
  console.log(`API Gateway running on http://localhost:${PORT}`);
});
