import app from './app';
import prisma from './prisma';

const PORT = Number(process.env.PORT || 3005);

const start = async () => {
  try {
    await prisma.$connect();
    
    const server = app.listen(PORT, () => {
      console.log(`Hospital service listening on port ${PORT}`);
    });

    process.on('SIGINT', async () => {
      server.close(async () => {
        await prisma.$disconnect();
        console.log('Hospital service stopped');
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('Failed to start service:', error);
    process.exit(1);
  }
};

start();
