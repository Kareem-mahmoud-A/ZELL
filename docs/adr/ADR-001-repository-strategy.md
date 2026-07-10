# ADR-001: Monorepo Repository Strategy

## Status

Accepted

## Date

2026-07-08

## Context

The ZELL platform is comprised of three primary logical workspaces:

1.  **`web/`**: The client-facing Next.js storefront and internal Admin Merchant dashboard.
2.  **`functions/`**: The Node.js Firebase Cloud Functions backend logic.
3.  **`firebase/`**: Configuration rules, security criteria, indices, and asset bindings.

We require a repository architecture that supports ease of local development, consistent version control of shared schemas (TypeScript types/interfaces), and automated unified CI/CD pipelines.

## Decision

We will employ a **Monorepo** strategy utilizing npm workspaces. The root directory coordinates configuration, while each application resides in its own isolated workspace directory.

## Alternatives Considered

### 1. Multi-Repository Strategy

Each workspace (`web`, `functions`, `firebase`) would reside in its own Git repository.

- _Why Rejected_: Fashion e-commerce features require rapid synchronization of interface schemas. For instance, modifying the `ProductVariant` type would require updating the core library repo, releasing a package, and updating dependencies across multiple distinct repositories. This adds significant overhead, increases PR counts, and introduces risk of version skew in production.

### 2. Single Repository without Workspaces (Flat Folder)

A single repository where Next.js and Firebase Cloud Functions share a flat node module dependency tree.

- _Why Rejected_: Next.js App Router and Firebase Cloud Functions have contrasting compilation, execution, and Node.js version runtimes (e.g., Cloud Functions running on Node 20/22 with specific bundling, vs Next.js running its own webpack/turbopack). A flat structure results in dependency pollution, build-time compilation collisions, and dependency bloating.

## Consequences

### Benefits

- **Single Source of Truth**: Shared type definitions (e.g., `Order`, `Product`, `Customer`) are referenceable directly via workspaces (e.g., `import { Order } from '@zell/types'`).
- **Simplified Refactoring**: Code changes impacting database models and UI representations can be implemented, tested, and reviewed in a single Pull Request.
- **Unified CI/CD**: A single GitHub Actions pipeline tracks file changes and triggers appropriate deployments.

### Trade-offs

- **Complex Tooling**: Requires setup of npm workspaces, workspace-specific scripts, and careful path configuration in developer environments.
- **Large Workspace Size**: Deleting node_modules or cloning the repository downloads packages for both frontend and backend configurations simultaneously.
