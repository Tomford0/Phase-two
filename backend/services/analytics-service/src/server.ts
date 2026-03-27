import app from './app';
import prisma from './prisma';
import amqp from 'amqplib';
import { subscribeToAnalyticsEvents } from './queue';

const PORT = Number(process.env.PORT || 3006);

const startServer = async () => {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
    const channel = await connection.createChannel();
    await channel.assertExchange('emergency', 'topic', { durable: true });
    
    await subscribeToAnalyticsEvents(channel);
    console.log('Analytics Service connected to RabbitMQ');

    app.listen(PORT, () => {
      console.log(`Analytics service listening on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start Analytics Service:', error);
    process.exit(1);
  }
};

startServer();

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
