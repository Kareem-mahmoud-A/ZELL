# ADR-008: Deployment & DevOps Strategy

## Status

Accepted

## Date

2026-07-08

## Context

Deploying an e-commerce platform requires high availability, automated previews for feature checking, and automated rollback workflows. Developers need distinct environments (Development, Staging, Production) to isolate staging databases, API endpoints, and Stripe credentials from active production customers.

## Decision

We will deploy the platform using the following multi-environment strategy:

1.  **Frontend Deployment**: Deploy Next.js to **Vercel** or **Firebase Hosting** (integrated with GitHub for automatic preview deploys on Pull Requests).
2.  **Backend Deployment**: Deploy Cloud Functions to **Firebase Environments** (using separate Firebase Projects for dev, staging, and production).
3.  **CI/CD Pipeline**: **GitHub Actions** will orchestrate deployments, running lints, tests, and environment-specific deployment scripts upon branch merges.

### Environments Configurations

| Environment     | Branch      | Firebase Project | Stripe Mode | Deploy Trigger                  |
| :-------------- | :---------- | :--------------- | :---------- | :------------------------------ |
| **Development** | `develop`   | `zell-dev`       | Test Mode   | Automatic push to `develop`     |
| **Staging**     | `release/*` | `zell-staging`   | Test Mode   | Pull request to `main`          |
| **Production**  | `main`      | `zell-prod`      | Live Mode   | Release tags or merge to `main` |

## Alternatives Considered

### 1. Manual Deployments via CLI

Developers executing `firebase deploy` and `vercel deploy` locally.

- _Why Rejected_: Introduces human error risks, where a developer might deploy local files using incorrect environment variables (e.g., deploying staging endpoints pointing to production databases). It also bypasses lint check workflows.

### 2. Self-Hosted Infrastructure (Docker, Kubernetes on GCP GKE)

Deploying Next.js and backend containers to Kubernetes nodes.

- _Why Rejected_: GKE clusters require significant setup, network configuration, ingress control, node pool sizing, and monitoring. This exceeds the project's complexity and team capacity. The managed Vercel and Firebase serverless platforms provide high performance with minimal configuration.

## Consequences

### Benefits

- **Safe Experimentation**: Separate development and staging databases ensure that logic updates and data model migrations are fully tested before production release.
- **Preview Builds**: Developers and clients can test UI updates on automated Vercel preview links before merging.
- **Automated Verification**: Integrates tests into the deployment pipeline, preventing failing builds from reaching production.

### Trade-offs

- **Credential Overhead**: Requires managing multiple sets of environment variables and API keys across GitHub Secrets, Firebase environments, and Next.js settings.
