import { Router } from 'express';
import prisma from '../prisma';
import { roles } from '../middleware/roles';

const router = Router();

router.get('/', roles('ADMIN', 'DISPATCHER', 'HOSPITAL'), async (req, res) => {
  try {
    const hospitals = await prisma.hospital.findMany();
    return res.json(hospitals);
  } catch (error) {
    console.error('Get hospitals error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/', roles('ADMIN', 'HOSPITAL'), async (req, res) => {
  try {
    const { name, latitude, longitude, bedTotal, ambulanceCount } = req.body;

    const lat = Number(latitude);
    const lng = Number(longitude);

    if (!name || typeof bedTotal !== 'number' || isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ message: 'name, latitude, longitude, and bedTotal are required' });
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ message: 'Invalid coordinates' });
    }

    const hospital = await prisma.hospital.create({
      data: {
        name,
        latitude: lat,
        longitude: lng,
        bedTotal,
        bedAvailable: bedTotal,
        ambulanceCount: ambulanceCount || 0,
      },
    });

    return res.status(201).json(hospital);
  } catch (error) {
    console.error('Create hospital error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/:id/beds', roles('ADMIN', 'HOSPITAL'), async (req, res) => {
  try {
    const { id } = req.params;
    const { bedAvailable } = req.body;

    if (typeof bedAvailable !== 'number' || bedAvailable < 0) {
      return res.status(400).json({ message: 'bedAvailable must be a non-negative number' });
    }

    const hospital = await prisma.hospital.update({
      where: { id },
      data: { bedAvailable },
    });

    return res.json(hospital);
  } catch (error) {
    console.error('Update beds error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/:id/ambulances', roles('ADMIN', 'HOSPITAL'), async (req, res) => {
  try {
    const { id } = req.params;
    const { ambulanceCount } = req.body;

    if (typeof ambulanceCount !== 'number' || ambulanceCount < 0) {
      return res.status(400).json({ message: 'ambulanceCount must be a non-negative number' });
    }

    const hospital = await prisma.hospital.update({
      where: { id },
      data: { ambulanceCount },
    });

    return res.json(hospital);
  } catch (error) {
    console.error('Update ambulances error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
