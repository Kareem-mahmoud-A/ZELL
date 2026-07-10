# Architecture Decision Records (ADRs)

This directory contains the Architecture Decision Records for the ZELL fashion e-commerce platform. These records document the technical decisions, alternatives considered, and trade-offs made during the system design phase.

## Record Index

- **[ADR-001: Repository Strategy](file:///C:/Users/Lenovo/Desktop/ZELL/docs/adr/ADR-001-repository-strategy.md)** - Monorepo vs. Single Repository
- **[ADR-002: Database Choice](file:///C:/Users/Lenovo/Desktop/ZELL/docs/adr/ADR-002-database-choice.md)** - Cloud Firestore NoSQL vs. Relational Databases
- **[ADR-003: Firestore Schema Design](file:///C:/Users/Lenovo/Desktop/ZELL/docs/adr/ADR-003-firestore-schema-design.md)** - Catalog modeling and variant nested data vs. collections
- **[ADR-004: Serverless Functions Strategy](file:///C:/Users/Lenovo/Desktop/ZELL/docs/adr/ADR-004-serverless-functions.md)** - Executing sensitive checkout and business logic in Cloud Functions
- **[ADR-005: Next.js App Router Rationale](file:///C:/Users/Lenovo/Desktop/ZELL/docs/adr/ADR-005-nextjs-app-router.md)** - Next.js App Router for SSR, performance, and SEO
- **[ADR-006: Authentication & Authorization Model](file:///C:/Users/Lenovo/Desktop/ZELL/docs/adr/ADR-006-authentication-authorization.md)** - Firebase Auth combined with Custom Claims (RBAC)
- **[ADR-007: State Management Approach](file:///C:/Users/Lenovo/Desktop/ZELL/docs/adr/ADR-007-state-management.md)** - Zustand and Context API state boundary definition
- **[ADR-008: Deployment & DevOps Strategy](file:///C:/Users/Lenovo/Desktop/ZELL/docs/adr/ADR-008-deployment-strategy.md)** - CI/CD deployment to Vercel and Firebase environment orchestration
- **[ADR-009: Scalability & Search Strategy](file:///C:/Users/Lenovo/Desktop/ZELL/docs/adr/ADR-009-scalability-and-search.md)** - Algolia integration for faceted product filtering and text search
