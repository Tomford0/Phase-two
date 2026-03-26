import { Router } from 'express';
import prisma from '../prisma';
import { publishEvent } from '../queue';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const { title, type, latitude, longitude, notes } = req.body;
    const createdById = req.user?.userId;

    if (!createdById) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!title || !type || typeof latitude !== 'number' || typeof longitude !== 'number') {
      return res.status(400).json({ message: 'Missing incident fields' });
    }

    const incident = await prisma.incident.create({
      data: { title, type, latitude, longitude, notes, createdById, status: 'OPEN' },
    });

    // Publish event for dispatch service to pick up
    await publishEvent('incident.created', {
      incidentId: incident.id,
      latitude: incident.latitude,
      longitude: incident.longitude,
      type: incident.type,
    });

    return res.status(201).json(incident);
  } catch (error) {
    console.error('Create incident error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    const filter: any = {};
    if (status) filter.status = status;

    const incidents = await prisma.incident.findMany({ where: filter });
    return res.json(incidents);
  } catch (error) {
    console.error('Get incidents error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const incident = await prisma.incident.findUnique({ where: { id } });
    if (!incident) return res.status(404).json({ message: 'Incident not found' });
    return res.json(incident);
  } catch (error) {
    console.error('Get incident error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const valid = ['OPEN', 'ASSIGNED', 'ENROUTE', 'ARRIVED', 'RESOLVED', 'CLOSED'];
    if (!valid.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const incident = await prisma.incident.update({
      where: { id },
      data: { status },
    });

    // Publish status change event
    await publishEvent('incident.status.updated', {
      incidentId: id,
      status,
    });

    return res.json(incident);
  } catch (error) {
    console.error('Update incident status error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
