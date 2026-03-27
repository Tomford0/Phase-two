# Phase 2 Product Requirements Document (PRD)

## 1. Product Overview
- **Product**: Emergency Response & Dispatch Coordination System.
- **Goal**: Enable admins to log incidents, assign responders, dispatch units, and track them in real-time.
- **Outcome**: Reduce response time and improve coordination.

## 2. Scope for Phase 2
- **Includes**: APIs, databases, authentication, message queue, assignment logic, tracking.
- **Excludes**: Full UI, advanced analytics, mobile apps.

## 3. Core Features
- Authentication System (JWT)
- Incident Management (CRUD + status)
- Dispatch System (vehicle assignment)
- Real-time Tracking (GPS updates)
- Hospital Management (beds + ambulances)
- Message Queue Events

## 4. User Stories
- Admin logs incidents and assigns responders.
- Driver sends location updates.
- Hospital admin updates bed availability.

## 5. Functional Requirements
- Incident creation with name, type, location, notes.
- Assignment logic using availability + nearest unit (Haversine).
- Vehicle tracking with lat/long/timestamp.
- JWT authentication and role-based access.

## 6. Non-Functional Requirements
- Performance: <2s response.
- Security: JWT + HTTPS.
- Scalability: Modular architecture.
- Reliability: Message queue retry.

## 7. System Architecture
- Services: Auth, Incident, Dispatch, Tracking, Hospital, Message Broker.
- Architecture Style: Modular Monolith (can evolve to microservices).

## 8. API Requirements
- Auth: POST /auth/register, POST /auth/login
- Incident: POST /incidents, GET /incidents/:id, PUT /incidents/:id/status
- Dispatch: POST /vehicles/register, GET /vehicles
- Tracking: POST /vehicles/:id/location
- Hospital: GET /hospitals, PUT /hospitals/:id/beds

## 9. Technology Stack (FINAL)
- Backend: Node.js + Express
- Database: PostgreSQL
- ORM: Prisma
- Authentication: JWT
- Message Queue: RabbitMQ
- Realtime: Socket.IO (optional) or polling
- Testing: Postman
- Deployment: Docker (optional) *[User noted no docker installed locally]*

## 10. Milestones
- Week 1: Setup + Auth
- Week 2: Incident + Dispatch APIs
- Week 3: Tracking + Queue + Integration

## 11. Success Criteria
Incident created → responder assigned → vehicle tracked → incident resolved.

## 12. Risks
- Overengineering microservices.
- Realtime complexity.
- Message queue bugs.

## 13. Deliverables
- Working backend APIs.
- Database implementation.
- Postman collection.
- Documentation.
