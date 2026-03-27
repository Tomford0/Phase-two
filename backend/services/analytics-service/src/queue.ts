import amqp from 'amqplib';
import prisma from './prisma';

export const subscribeToAnalyticsEvents = async (channel: amqp.Channel) => {
  try {
    const q = await channel.assertQueue('analytics_queue', { durable: true });

    // Bind to all relevant events
    await channel.bindQueue(q.queue, 'emergency', 'incident.created');
    await channel.bindQueue(q.queue, 'emergency', 'dispatch.assigned');
    await channel.bindQueue(q.queue, 'emergency', 'incident.status.updated');

    channel.consume(q.queue, async (msg) => {
      if (msg) {
        const routingKey = msg.fields.routingKey;
        const data = JSON.parse(msg.content.toString());

        try {
          if (routingKey === 'incident.created') {
            await prisma.incidentRecord.create({
              data: {
                incidentId: data.incidentId,
                type: data.type,
                latitude: data.latitude,
                longitude: data.longitude,
                createdAt: new Date(),
              }
            });
          } else if (routingKey === 'dispatch.assigned') {
            const incident = await prisma.incidentRecord.findUnique({ where: { incidentId: data.incidentId } });
            if (incident) {
              const assignedAt = new Date();
              const responseTimeMs = assignedAt.getTime() - incident.createdAt.getTime();
              
              await prisma.incidentRecord.update({
                where: { incidentId: data.incidentId },
                data: { assignedAt, responseTimeMs }
              });
            }

            // Update resource utilization
            await prisma.resourceUtilization.upsert({
              where: { vehicleId: data.vehicleId },
              create: {
                vehicleId: data.vehicleId,
                vehicleType: 'UNKNOWN', // type would ideally be sent in event payload
                totalDispatches: 1,
                lastAssignedAt: new Date()
              },
              update: {
                totalDispatches: { increment: 1 },
                lastAssignedAt: new Date()
              }
            });
          } else if (routingKey === 'incident.status.updated') {
            await prisma.incidentRecord.updateMany({
              where: { incidentId: data.incidentId },
              data: { status: data.status }
            });
          }
        } catch (dbError) {
          console.error(`Error processing ${routingKey}:`, dbError);
        }
        
        channel.ack(msg);
      }
    });
  } catch (error) {
    console.error('Queue subscription error:', error);
  }
};
