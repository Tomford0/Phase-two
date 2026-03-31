import app from './app';
import prisma from './prisma';
import { connectQueue, subscribeToDispatchAssigned } from './queue';

const PORT = Number(process.env.PORT || 3002);

const start = async () => {
  try {
    await connectQueue();
    await subscribeToDispatchAssigned();
    await prisma.$connect();
    
    const server = app.listen(PORT, () => {
      console.log(`Incident service listening on port ${PORT}`);
    });

    process.on('SIGINT', async () => {
      server.close(async () => {
        await prisma.$disconnect();
        console.log('Incident service stopped');
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('Failed to start service:', error);
    process.exit(1);
  }
};

start();
