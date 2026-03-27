# Phase 2 Completion & Frontend Handoff State

This document serves as the absolute source of truth for the completed Phase 2 Backend Architecture. 
Provide this to any new AI agent so they immediately understand the backend infrastructure before building the Phase 3 Frontend/Client Interface.

## 🏗️ Architecture Overview
The backend is a strictly distributed **Node.js/Express Microservice Architecture** utilizing **Prisma (PostgreSQL)** for the database layer and **RabbitMQ** for asynchronous event-driven communication.

Instead of hitting individual ports, all frontend traffic must be routed through the **API Gateway** running on port `3000`.

### 1. The Microservices
1. **API Gateway** (`:3000`) - The central proxy. Routes all traffic to other services based on URL prefix.
2. **Auth Service** (`:3001`) - Manages identity, roles, and issues JWTs.
3. **Incident Service** (`:3002`) - Manages emergency logs (citizens, accident types, coords).
4. **Dispatch Service** (`:3003`) - Manages emergency vehicle registrations and availability. Subscribes to RabbitMQ to auto-assign nearest vehicles to incidents via Haversine distance algorithms.
5. **Tracking Service** (`:3004`) - Records live streaming GPS coordinates of vehicles.
6. **Hospital Service** (`:3005`) - Tracks hospital bed capacities and ambulance counts.
7. **Analytics Service** (`:3006`) - Listens to RabbitMQ events and calculates response latency, resource utilization, and regional incident groupings.

---

## 💾 Database Strategy
We utilized a **"Database-per-Service" pattern via Logical Isolation**. 
There is only one physical PostgreSQL connection string, but EVERY microservice writes to its own isolated Postgres schema to completely prevent data pollution:
- `?schema=auth`
- `?schema=incident`
- `?schema=dispatch`
- `?schema=tracking`
- `?schema=hospital`
- `?schema=analytics`

*(Note: Prisma generates distinct Typescript definitions for each service. If schemas change, `npx prisma db push --force-reset` must be run in the specific service directory).*

---

## 🔑 Authentication
- **JWT (JSON Web Tokens)** are used universally.
- Frontend must pass tokens in the HTTP Header: `Authorization: Bearer <token>`
- Secrets are dynamically scoped to completely prevent ES6 import `dotenv` module caching glitches.

---

## 📡 API Gateway Endpoints (Port 3000)

### Auth (`/auth`)
- `POST /auth/register` - Creates user (Requires `name`, `email`, `password`, `role`).
- `POST /auth/login` - Returns JWT.
- `GET /auth/profile` - Protected. Returns decoded user.
- `POST /auth/refresh-token` - Protected. Returns fresh JWT.

### Incidents (`/incidents`)
- `POST /incidents` - Protected. Requires `title`, `type`, `latitude`, `longitude`, `citizenName`. Auto-publishes to RabbitMQ.
- `GET /incidents` - Protected. Returns all.
- `GET /incidents/open` - Protected. Returns only 'OPEN' incidents.
- `PUT /incidents/:id/assign` - Protected. Manually assigns a unit.
- `PUT /incidents/:id/status` - Protected. Updates status (`OPEN`, `RESOLVED`, etc).

### Dispatch/Vehicles (`/vehicles`)
- `POST /vehicles` - Protected. Registers new vehicle (checks for duplicate `plateNumber` and safely returns 409 Conflict if existing).
- `GET /vehicles` - Protected. Returns all vehicles.
- `GET /vehicles/available` - Protected. 
- `PUT /vehicles/:id/status` - Protected.

### Tracking (`/tracking/vehicles`)
- `POST /tracking/vehicles/:id/location` - Protected. Submits GPS point along with `stationId`, `incidentId`, and `vehicleStatus`.
- `GET /tracking/vehicles/:id/location` - Protected. Returns singular current location.
- `GET /tracking/vehicles/:id/locations` - Protected. Returns array of history.

### Hospitals (`/hospitals`)
- `POST /hospitals` - Protected. Registers a hospital.
- `GET /hospitals` - Protected.
- `PUT /hospitals/:id/beds` - Protected. Updates `bedAvailable`.

### Analytics (`/analytics`)
- `GET /analytics/response-times` - Protected.
- `GET /analytics/incidents-by-region` - Protected.
- `GET /analytics/resource-utilization` - Protected.

---

## 🐇 RabbitMQ Event Dictionary
Exchange: `emergency` (Topic)
1. `incident.created` - Published by Incident Service. Consumed by Dispatch (auto-assigns vehicle) and Analytics (logs creation time).
2. `dispatch.assigned` - Published by Dispatch Service. Consumed by Incident (updates assignment ID) and Analytics (calculates response time).
3. `incident.status.updated` - Published by Incident Service. Consumed by Analytics.
4. `vehicle.location` - Published by Tracking Service. (Future: WebSocket consumption for frontend live maps).

## 🚀 Frontend Next Steps
The next AI session should initialize a React/Next.js client in the root workspace. The client will need a Login/Auth context, a dispatcher dashboard to view `GET /incidents/open`, a Google Map component to plot `/tracking/vehicles/:id/location`, and an Analytics dashboard. All HTTP calls should point strictly to `http://localhost:3000`.
