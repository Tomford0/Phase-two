import { Router } from 'express';
import prisma from '../prisma';

const router = Router();

router.post('/vehicles', async (req, res) => {
  try {
    const { plateNumber, type } = req.body;
    if (!plateNumber || !type) {
      return res.status(400).json({ message: 'plateNumber and type required' });
    }

    const existing = await prisma.vehicle.findUnique({
      where: { plateNumber }
    });
    if (existing) {
      return res.status(409).json({ message: 'Vehicle with that plate number already exists' });
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        plateNumber,
        type,
        status: 'AVAILABLE',
      },
    });

    return res.status(201).json(vehicle);
  } catch (error) {
    console.error('Register vehicle error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/vehicles', async (req, res) => {
  try {
    const vehicles = await prisma.vehicle.findMany();
    return res.json(vehicles);
  } catch (error) {
    console.error('Get vehicles error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/vehicles/available', async (req, res) => {
  try {
    const vehicles = await prisma.vehicle.findMany({ where: { status: 'AVAILABLE' } });
    return res.json(vehicles);
  } catch (error) {
    console.error('Get available vehicles error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/vehicles/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const valid = ['AVAILABLE', 'BUSY', 'OFFLINE'];
    if (!valid.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const vehicle = await prisma.vehicle.update({
      where: { id },
      data: { status },
    });
    return res.json(vehicle);
  } catch (error) {
    console.error('Update vehicle status error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
