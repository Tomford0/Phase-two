import amqp from 'amqplib';

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
