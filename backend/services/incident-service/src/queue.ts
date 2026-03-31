import amqp from 'amqplib';
import prisma from './prisma';

let channel: amqp.Channel;

export const connectQueue = async () => {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
    channel = await connection.createChannel();
    
    // Declare exchanges
    await channel.assertExchange('emergency', 'topic', { durable: true });
    
    console.log('RabbitMQ connected');
    return channel;
  } catch (error) {
    console.error('RabbitMQ connection failed:', error);
    throw error;
  }
};

/**
 * Subscribes to dispatch.assigned events from the dispatch-service.
 * When a vehicle is auto-assigned, updates the incident record with
 * the assigned vehicle and moves its status from OPEN → ASSIGNED.
 */
export const subscribeToDispatchAssigned = async () => {
  const q = await channel.assertQueue('incident_dispatch_feedback', { durable: true });
  await channel.bindQueue(q.queue, 'emergency', 'dispatch.assigned');

  channel.consume(q.queue, async (msg) => {
    if (!msg) return;
    try {
      const { incidentId, vehicleId } = JSON.parse(msg.content.toString());

      await prisma.incident.update({
        where: { id: incidentId },
        data: {
          status: 'ASSIGNED',
          assignedUnitId: vehicleId,
        },
      });

      console.log(`Incident ${incidentId} auto-assigned to vehicle ${vehicleId}`);
      channel.ack(msg);
    } catch (error) {
      console.error('Failed to process dispatch.assigned event:', error);
      // nack without requeue to avoid infinite loop on bad messages
      channel.nack(msg, false, false);
    }
  });

  console.log('Subscribed to dispatch.assigned events');
};

export const getChannel = () => channel;

export const publishEvent = async (routingKey: string, payload: any) => {
  try {
    channel.publish(
      'emergency',
      routingKey,
      Buffer.from(JSON.stringify(payload)),
      { persistent: true }
    );
    console.log(`Published event: ${routingKey}`, payload);
  } catch (error) {
    console.error('Failed to publish event:', error);
  }
};
