import { Router } from 'express';
import prisma from '../prisma';
import { publishEvent } from '../queue';
import { roles } from '../middleware/roles';

const router = Router();

router.post('/', roles('ADMIN', 'DISPATCHER', 'CITIZEN', 'HOSPITAL', 'AMBULANCE'), async (req, res) => {
  try {
    const { citizenName, title, type, latitude, longitude, notes } = req.body;
    const createdById = req.user?.userId;

    if (!createdById) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!citizenName || !title || !type || typeof latitude !== 'number' || typeof longitude !== 'number') {
      return res.status(400).json({ message: 'Missing incident fields (citizenName, title, type, lat, lon)' });
    }

    const incident = await prisma.incident.create({
      data: { citizenName, title, type, latitude, longitude, notes, createdById, status: 'OPEN' },
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

router.get('/', roles('ADMIN', 'DISPATCHER', 'CITIZEN'), async (req, res) => {
  try {
    const { status } = req.query;
    const filter: any = {};
    if (status) filter.status = status;

    // Citizens can only see their own incidents
    if (req.user?.role === 'CITIZEN') {
      filter.createdById = req.user.userId;
    }

    const incidents = await prisma.incident.findMany({ where: filter });
    return res.json(incidents);
  } catch (error) {
    console.error('Get incidents error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/open', roles('ADMIN', 'DISPATCHER'), async (req, res) => {
  try {
    const incidents = await prisma.incident.findMany({ where: { status: 'OPEN' } });
    return res.json(incidents);
  } catch (error) {
    console.error('Get open incidents error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/:id', roles('ADMIN', 'DISPATCHER'), async (req, res) => {
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

router.put('/:id/status', roles('ADMIN', 'DISPATCHER'), async (req, res) => {
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

router.put('/:id/assign', roles('ADMIN', 'DISPATCHER'), async (req, res) => {
  try {
    const { id } = req.params;
    const { assignedUnitId } = req.body;
    
    if (!assignedUnitId) {
      return res.status(400).json({ message: 'assignedUnitId is required' });
    }

    const incident = await prisma.incident.update({
      where: { id },
      data: { 
        assignedUnitId,
        status: 'ASSIGNED'
      },
    });

    return res.json(incident);
  } catch (error) {
    console.error('Assign incident error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
