import { Router } from 'express';
import prisma from '../prisma';

const router = Router();

// GET /analytics/response-times
router.get('/response-times', async (req, res) => {
  try {
    const incidents = await prisma.incidentRecord.findMany({
      where: { responseTimeMs: { not: null } },
    });

    if (incidents.length === 0) return res.json({ averageResponseTimeMs: 0 });

    const total = incidents.reduce((sum, inc) => sum + (inc.responseTimeMs || 0), 0);
    const avg = total / incidents.length;

    res.json({
      averageResponseTimeMs: avg,
      totalIncidentsAssigned: incidents.length,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /analytics/incidents-by-region
// Basic grouping by truncating lat/lon bounds or just returning counts.
router.get('/incidents-by-region', async (req, res) => {
  try {
    const incidents = await prisma.incidentRecord.findMany();
    // Rough grouping by whole number lat/lon to simulate "regions"
    const regions: any = {};
    incidents.forEach(inc => {
      const regionKey = `${Math.floor(inc.latitude)},${Math.floor(inc.longitude)}`;
      if (!regions[regionKey]) regions[regionKey] = 0;
      regions[regionKey]++;
    });

    res.json(regions);
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /analytics/resource-utilization
router.get('/resource-utilization', async (req, res) => {
  try {
    const usage = await prisma.resourceUtilization.findMany({
      orderBy: { totalDispatches: 'desc' }
    });
    res.json(usage);
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
