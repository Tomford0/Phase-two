import app from './app';
import prisma from './prisma';

const PORT = Number(process.env.PORT || 4000);

const server = app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Emergency backend listening on port ${PORT}`);
});

process.on('SIGINT', async () => {
  server.close(async () => {
    await prisma.$disconnect();
    // eslint-disable-next-line no-console
    console.log('Server stopped');
    process.exit(0);
  });
});

process.on('SIGTERM', async () => {
  server.close(async () => {
    await prisma.$disconnect();
    // eslint-disable-next-line no-console
    console.log('Server stopped');
    process.exit(0);
  });
});
