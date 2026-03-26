import amqp from 'amqplib';
import prisma from '../prisma';
import { haversineDistance } from '../utils/haversine';

export const subscribeToIncidents = async (channel: amqp.Channel) => {
  try {
    const q = await channel.assertQueue('incident_queue', { durable: true });
    await channel.bindQueue(q.queue, 'emergency', 'incident.created');

    channel.consume(q.queue, async (msg) => {
      if (msg) {
        const { incidentId, latitude, longitude, type } = JSON.parse(msg.content.toString());
        console.log(`Processing incident: ${incidentId}`);

        // Find nearest available vehicle
        const vehicles = await prisma.vehicle.findMany({
          where: { status: 'AVAILABLE' },
        });

        if (vehicles.length === 0) {
          console.log('No available vehicles');
          channel.ack(msg);
          return;
        }

        let nearest = vehicles[0];
        let minDistance = haversineDistance(
          latitude,
          longitude,
          nearest.currentLat ?? 0,
          nearest.currentLon ?? 0
        );

        for (const vehicle of vehicles.slice(1)) {
          if (!vehicle.currentLat || !vehicle.currentLon) continue;
          const distance = haversineDistance(latitude, longitude, vehicle.currentLat, vehicle.currentLon);
          if (distance < minDistance) {
            nearest = vehicle;
            minDistance = distance;
          }
        }

        // Create assignment and mark vehicle busy
        const assignment = await prisma.dispatchAssignment.create({
          data: {
            incidentId,
            vehicleId: nearest.id,
            status: 'PENDING',
          },
        });

        await prisma.vehicle.update({
          where: { id: nearest.id },
          data: { status: 'BUSY' },
        });

        // Publish dispatch assigned event
        channel.publish(
          'emergency',
          'dispatch.assigned',
          Buffer.from(
            JSON.stringify({
              assignmentId: assignment.id,
              incidentId,
              vehicleId: nearest.id,
              distance: minDistance,
            })
          ),
          { persistent: true }
        );

        channel.ack(msg);
      }
    });
  } catch (error) {
    console.error('Queue subscription error:', error);
  }
};
