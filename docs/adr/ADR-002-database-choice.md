# ADR-002: Cloud Firestore NoSQL Database Choice

## Status

Accepted

## Date

2026-07-08

## Context

E-commerce catalogs demand elastic read performance to support spike traffic (promotional sales, drops). Additionally, client features require low-latency synchronization of states (e.g., dynamic updates on inventory changes or order status tracking). We need a storage technology that is scalable, low-maintenance, and integrates with our authentication system.

## Decision

We will use **Google Cloud Firestore (NoSQL Document Database)** as the primary transactional database for ZELL.

## Alternatives Considered

### 1. Relational Databases (e.g., PostgreSQL / Google Cloud SQL)

Traditional relational database schemas.

- _Why Rejected_: Relational databases require server provisioning, connection pool management, database migrations, and complex replication setups to achieve high availability. The client desires a serverless infrastructure with minimal DevOps overhead. Furthermore, relational databases do not offer native, real-time client sync listeners out-of-the-box, which would require building and maintaining WebSocket gateways.

### 2. Alternative NoSQL Databases (e.g., MongoDB Atlas)

- _Why Rejected_: While MongoDB Atlas is a capable document store, it lacks the direct client-side integration and SDK support provided by Firebase. Cloud Firestore allows the frontend client to query the database directly using client SDKs, governed safely by Firestore Security Rules. This avoids writing boilerplate CRUD APIs for basic read operations.

## Consequences

### Benefits

- **Zero Operational Overhead**: Fully managed serverless structure that scales horizontally automatically.
- **Offline Mode & Client Sync**: Out-of-the-box support for offline data persistence and real-time listeners on web clients.
- **Integrated Security Rules**: Securing data directly at the database layer based on user auth tokens, reducing API routing overhead.

### Trade-offs

- **No Joins**: Relational queries requiring `JOIN` operations must be resolved in code via document aggregation, pre-calculated denormalization, or client-side batch fetches.
- **Query Restrictions**: Queries are limited to single-path collection paths. We cannot search across multiple independent properties using range queries without composite indices.
- **Write Throughput Limits**: Individual document write frequency is capped at 1 write/second (standard Firestore limit), requiring careful management of counter documents (e.g., product views).
