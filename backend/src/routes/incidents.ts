import { Router } from 'express';
import prisma from '../prisma';
import { haversineDistance } from '../utils/haversine';
import { roles } from '../middleware/roles';

const router = Router();

router.post('/', roles('ADMIN', 'DISPATCHER', 'CITIZEN', 'HOSPITAL', 'AMBULANCE'), async (req, res) => {
  const { title, type, latitude, longitude, notes } = req.body;
  const createdById = req.user?.userId;

  if (!createdById) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (!title || !type || typeof latitude !== 'number' || typeof longitude !== 'number') {
    return res.status(400).json({ message: 'Missing incident fields' });
  }

  const incident = await prisma.incident.create({
    data: { title, type, latitude, longitude, notes, createdById },
  });

  // assignment logic: nearest available vehicle
  const available = await prisma.vehicle.findMany({ where: { status: 'AVAILABLE' } });
  if (available.length > 0) {
    let best = available[0];
    let bestDistance = haversineDistance(latitude, longitude, best.currentLat, best.currentLon);

    for (const vehicle of available.slice(1)) {
      const distance = haversineDistance(latitude, longitude, vehicle.currentLat, vehicle.currentLon);
      if (distance < bestDistance) {
        best = vehicle;
        bestDistance = distance;
      }
    }

    if (best) {
      await prisma.incident.update({
        where: { id: incident.id },
        data: { status: 'ASSIGNED', assignedUnitId: best.id },
      });
      await prisma.vehicle.update({
        where: { id: best.id },
        data: { status: 'BUSY' },
      });
      await prisma.dispatchAssignment.create({
        data: {
          incidentId: incident.id,
          vehicleId: best.id,
          status: 'PENDING',
        },
      });
    }
  }

  return res.status(201).json(incident);
});

router.get('/', roles('ADMIN', 'DISPATCHER', 'CITIZEN'), async (req, res) => {
  const { status } = req.query;
  const filter: any = {};
  if (status) filter.status = status;

  // Citizens can only see their own incidents
  if (req.user?.role === 'CITIZEN') {
    filter.createdById = req.user.userId;
  }

  const incidents = await prisma.incident.findMany({ where: filter });
  return res.json(incidents);
});

router.get('/:id', roles('ADMIN', 'DISPATCHER'), async (req, res) => {
  const { id } = req.params;
  const incident = await prisma.incident.findUnique({ where: { id } });
  if (!incident) return res.status(404).json({ message: 'Incident not found' });
  return res.json(incident);
});

router.put('/:id/status', roles('ADMIN', 'DISPATCHER'), async (req, res) => {
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

  return res.json(incident);
});

export default router;
