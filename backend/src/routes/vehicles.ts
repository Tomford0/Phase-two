import { Router } from 'express';
import prisma from '../prisma';
import { roles } from '../middleware/roles';

const router = Router();

router.post('/register', roles('ADMIN'), async (req, res) => {
  const { plateNumber, type, hospitalId, currentLat, currentLon } = req.body;
  if (!plateNumber || !type || typeof currentLat !== 'number' || typeof currentLon !== 'number')
    return res.status(400).json({ message: 'plateNumber, type, currentLat, and currentLon are required' });

  const vehicle = await prisma.vehicle.create({
    data: {
      plateNumber,
      type,
      hospitalId,
      currentLat,
      currentLon,
      status: 'AVAILABLE',
    },
  });

  return res.status(201).json(vehicle);
});

router.get('/', roles('ADMIN', 'DISPATCHER', 'AMBULANCE'), async (req, res) => {
  const vehicles = await prisma.vehicle.findMany();
  return res.json(vehicles);
});

router.get('/available', roles('ADMIN', 'DISPATCHER', 'AMBULANCE'), async (req, res) => {
  const vehicles = await prisma.vehicle.findMany({ where: { status: 'AVAILABLE' } });
  return res.json(vehicles);
});

router.put('/:id/status', roles('ADMIN', 'DISPATCHER', 'AMBULANCE'), async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const valid = ['AVAILABLE', 'BUSY', 'OFFLINE'];
  if (!valid.includes(status)) return res.status(400).json({ message: 'Invalid status' });

  const vehicle = await prisma.vehicle.update({ where: { id }, data: { status } });
  return res.json(vehicle);
});

export default router;
