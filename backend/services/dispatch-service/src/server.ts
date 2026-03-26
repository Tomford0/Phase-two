import amqp from 'amqplib';
import app from './app';
import prisma from './prisma';
import { subscribeToIncidents } from './services/queueService';

const PORT = Number(process.env.PORT || 3003);

const start = async () => {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
    const channel = await connection.createChannel();
    await channel.assertExchange('emergency', 'topic', { durable: true });
    
    await subscribeToIncidents(channel);
    await prisma.$connect();

    const server = app.listen(PORT, () => {
      console.log(`Dispatch service listening on port ${PORT}`);
    });

    process.on('SIGINT', async () => {
      server.close(async () => {
        await prisma.$disconnect();
        await connection.close();
        console.log('Dispatch service stopped');
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('Failed to start service:', error);
    process.exit(1);
  }
};

start();
