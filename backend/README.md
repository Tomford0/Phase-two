# Emergency Response Backend - Microservices

## Architecture

Independent microservices deployed separately with asynchronous event-driven communication via RabbitMQ.

### Services

| Service | Port | Description |
|---------|------|-------------|
| Auth Service | 3001 | User registration, JWT tokens |
| Incident Service | 3002 | CRUD incidents, publishes events |
| Dispatch Service | 3003 | Automatic unit assignment via RabbitMQ |
| Tracking Service | 3004 | Vehicle location updates |
| Hospital Service | 3005 | Hospital bed/ambulance management |

## Quick Start (Docker)

```bash
docker-compose up
```

All services + PostgreSQL + RabbitMQ will be running:
- Auth: http://localhost:3001
- Incident: http://localhost:3002
- Dispatch: http://localhost:3003
- Tracking: http://localhost:3004
- Hospital: http://localhost:3005
- RabbitMQ Dashboard: http://localhost:15672 (guest/guest)

## Local Development (without Docker)

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- RabbitMQ

### Setup

1. Install dependencies for each service:
```bash
cd services/auth-service && npm install
cd ../incident-service && npm install
cd ../dispatch-service && npm install
cd ../tracking-service && npm install
cd ../hospital-service && npm install
```

2. Create `.env` file in each service directory (copy from `.env.example`)

3. Run database migrations:
```bash
cd services/auth-service && npm run prisma:migrate
cd ../incident-service && npm run prisma:migrate
cd ../dispatch-service && npm run prisma:migrate
cd ../tracking-service && npm run prisma:migrate
cd ../hospital-service && npm run prisma:migrate
```

4. Start each service in separate terminals:
```bash
cd services/auth-service && npm run dev
cd services/incident-service && npm run dev
cd services/dispatch-service && npm run dev
cd services/tracking-service && npm run dev
cd services/hospital-service && npm run dev
```

## API Endpoints

### Auth Service (3001)
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login & get JWT token

### Incident Service (3002)
- `POST /incidents` - Create incident
- `GET /incidents` - List incidents
- `GET /incidents/:id` - Get incident details
- `PUT /incidents/:id/status` - Update incident status

### Dispatch Service (3003)
- `POST /vehicles` - Register vehicle
- `GET /vehicles` - List vehicles
- `GET /vehicles/available` - List available vehicles
- `PUT /vehicles/:id/status` - Update vehicle status

### Tracking Service (3004)
- `POST /vehicles/:id/location` - Update vehicle location
- `GET /vehicles/:id/locations` - Get location history

### Hospital Service (3005)
- `GET /hospitals` - List hospitals
- `POST /hospitals` - Create hospital
- `PUT /hospitals/:id/beds` - Update available beds
- `PUT /hospitals/:id/ambulances` - Update ambulance count

## Event Flow

1. Admin creates incident → Incident Service publishes `incident.created`
2. Dispatch Service subscribes → finds nearest available vehicle
3. Dispatch Service publishes `dispatch.assigned`
4. Driver updates location → Tracking Service publishes `vehicle.location`
5. On incident resolution → updates hospital beds

## Deployment

Each service can be deployed independently:

```bash
# Build individual service
docker build -t emergency-auth-service ./services/auth-service

# Push to registry
docker push your-registry/emergency-auth-service

# Deploy (e.g., to AWS, Kubernetes, etc.)
```
