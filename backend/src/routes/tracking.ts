import { Router } from 'express';
import prisma from '../prisma';

const router = Router();

router.post('/vehicles/:id/location', async (req, res) => {
  const { id } = req.params;
  const { latitude, longitude, timestamp } = req.body;

  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return res.status(400).json({ message: 'latitude and longitude must be numbers' });
  }

  const vehicle = await prisma.vehicle.findUnique({ where: { id } });
  if (!vehicle) {
    return res.status(404).json({ message: 'Vehicle not found' });
  }

  const loc = await prisma.locationUpdate.create({
    data: {
      vehicleId: id,
      latitude,
      longitude,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
    },
  });

  await prisma.vehicle.update({
    where: { id },
    data: {
      currentLat: latitude,
      currentLon: longitude,
      lastSeenAt: new Date(),
      status: 'BUSY',
    },
  });

  return res.status(201).json(loc);
});

export default router;
