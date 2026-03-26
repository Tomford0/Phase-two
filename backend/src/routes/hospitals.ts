import { Router } from 'express';
import prisma from '../prisma';

const router = Router();

router.get('/', async (req, res) => {
  const hospitals = await prisma.hospital.findMany();
  return res.json(hospitals);
});

router.put('/:id/beds', async (req, res) => {
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
});

export default router;
