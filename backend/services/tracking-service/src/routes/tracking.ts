import { Router } from 'express';
import amqp from 'amqplib';
import prisma from '../prisma';
import { roles } from '../middleware/roles';

const router = Router();

router.post('/vehicles/:id/location', roles('ADMIN', 'AMBULANCE'), async (req, res) => {
  try {
    const { id } = req.params;
    const { latitude, longitude, timestamp, stationId, incidentId, vehicleStatus } = req.body;

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return res.status(400).json({ message: 'latitude and longitude must be numbers' });
    }

    const loc = await prisma.locationUpdate.create({
      data: {
        vehicleId: id,
        stationId,
        incidentId,
        vehicleStatus,
        latitude,
        longitude,
        timestamp: timestamp ? new Date(timestamp) : new Date(),
      },
    });

    // Publish location update event to RabbitMQ
    try {
      const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
      const channel = await connection.createChannel();
      await channel.assertExchange('emergency', 'topic', { durable: true });
      
      channel.publish(
        'emergency',
        'vehicle.location',
        Buffer.from(
          JSON.stringify({
            vehicleId: id,
            stationId,
            incidentId,
            vehicleStatus,
            latitude,
            longitude,
            timestamp: loc.timestamp,
          })
        ),
        { persistent: true }
      );
      
      await connection.close();
    } catch (queueError) {
      console.error('Failed to publish location event:', queueError);
    }

    return res.status(201).json(loc);
  } catch (error) {
    console.error('Update location error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/vehicles/:id/location', roles('ADMIN', 'DISPATCHER', 'AMBULANCE'), async (req, res) => {
  try {
    const { id } = req.params;
    const location = await prisma.locationUpdate.findFirst({
      where: { vehicleId: id },
      orderBy: { timestamp: 'desc' },
    });
    if (!location) return res.status(404).json({ message: 'No location found' });
    return res.json(location);
  } catch (error) {
    console.error('Get location error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/vehicles/:id/locations', roles('ADMIN', 'DISPATCHER', 'AMBULANCE'), async (req, res) => {
  try {
    const { id } = req.params;
    const locations = await prisma.locationUpdate.findMany({
      where: { vehicleId: id },
      orderBy: { timestamp: 'desc' },
      take: 50,
    });
    return res.json(locations);
  } catch (error) {
    console.error('Get locations error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
