import app from './app';
import prisma from './prisma';

const PORT = Number(process.env.PORT || 3001);

const server = app.listen(PORT, () => {
  console.log(`Auth service listening on port ${PORT}`);
});

process.on('SIGINT', async () => {
  server.close(async () => {
    await prisma.$disconnect();
    console.log('Auth service stopped');
    process.exit(0);
  });
});
