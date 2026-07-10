# ADR-006: Authentication & Authorization Model

## Status

Accepted

## Date

2026-07-08

## Context

We need to verify user identities and govern access rights to system resources. The system must accommodate Guests (session-only cart states), registered Customers (personal details, orders, wishlist), and Admins (catalog curation, stock adjustment, refund triggers). The access control must be secure, low-latency, and scale without increasing database read overhead.

## Decision

We will use **Firebase Authentication** for identity management (supporting Email/Password and OAuth social sign-ins) and manage access permissions via **Firebase Custom Claims** (RBAC).

1.  On user sign-up, default claims are set to `{ role: 'customer' }`.
2.  Admin and Superadmin accounts are granted claims via secure backend operations (Cloud Functions / CLI).
3.  Access governance is enforced directly at the database layer using Firestore Security Rules and at the API boundary using Cloud Function token decoders.

## Alternatives Considered

### 1. Database Document Role Check

Checking user roles by querying the `/users/{uid}` document in Firestore during rules verification or API requests.

- _Why Rejected_: Under high database traffic, fetching the user record for every single read/write query significantly increases database operation counts, inflating Firestore costs. Since Firestore security rules charge per document read, this is financially inefficient. Custom claims are embedded directly inside the user's ID token, allowing verification at the infrastructure layer without making database queries.

### 2. Custom Auth Server & Express Middlewares

Building a bespoke user registration, JWT generation, and token verification service.

- _Why Rejected_: Developing and maintaining custom authentication mechanisms increases security vulnerability risks (credential leaks, token signing flaws, session hijack vulnerabilities). Offloading authentication to Firebase ensures compliance with industry security standards and provides automated social OAuth integrations out-of-the-box.

## Consequences

### Benefits

- **Decoupled Enforcement**: Database access checks execute inside Firebase's infrastructure without database queries, keeping read operations low.
- **Multi-Provider Integration**: Easy integration of Google and Apple OAuth sign-ins without writing separate endpoint integrations.
- **Token Expiry & Security**: Firebase handles token signatures, validation, rotation, and expiry automatically.

### Trade-offs

- **Propagation Latency**: When an admin updates a user's claim (e.g., promoting a customer to admin), the claim does not take effect until the user's ID token is refreshed (which occurs automatically every hour, or can be forced client-side).
- **Payload Size Limit**: Custom claims are limited to 1000 bytes. This is suitable for roles (e.g., `{ role: 'admin' }`) but prevents storing complex permission lists, which must be modeled via security rules configurations.
