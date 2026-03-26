import { Router } from 'express';
import prisma from '../prisma';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const hospitals = await prisma.hospital.findMany();
    return res.json(hospitals);
  } catch (error) {
    console.error('Get hospitals error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, address, bedTotal, ambulanceCount } = req.body;

    if (!name || !address || typeof bedTotal !== 'number') {
      return res.status(400).json({ message: 'name, address, and bedTotal are required' });
    }

    const hospital = await prisma.hospital.create({
      data: {
        name,
        address,
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

router.put('/:id/beds', async (req, res) => {
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

router.put('/:id/ambulances', async (req, res) => {
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
