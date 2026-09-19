# Architecture

## Preferred Direction

- **Frontend:** React / Next.js
- **Backend:** Supabase
- **Database:** PostgreSQL through Supabase
- **Storage:** Supabase Storage (for visitor photographs)
- **Authentication:** Supabase Auth for admin only
- **Visitor Access:** Public controlled flow
- **Hosting:** Vercel or equivalent
- **QR:** Generated verification/pass token

## Architecture Rules

### 1. Single Source of Truth
- **Supabase** is the absolute single source of truth.
- Supabase manages: employees, visitor requests, employee-to-push-device mappings, visitor photos, notification attempts, approval workflow data, and gate-pass records.
- **Firebase Usage is Strictly Limited:** Firebase is ONLY permitted for **Firebase Cloud Messaging (FCM)** delivery.
- DO NOT introduce Firestore, Firebase Realtime Database, Firebase Storage, Firebase Authentication, Firebase Hosting, or Firebase Functions.

### 2. General constraints
- Do not over-engineer the architecture.
- Do not introduce microservices.
- Do not introduce Kubernetes.
- Do not introduce unnecessary queues or distributed systems.
- Use a dedicated, separate Supabase project. Do not link to the existing HRMS database.
