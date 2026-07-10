# ADR-004: Serverless Functions Strategy

## Status

Accepted

## Date

2026-07-08

## Context

While Cloud Firestore allows frontend clients to perform direct database writes (governed by Security Rules), certain business workflows must remain secure, tamper-proof, and isolated from the user's environment. Operations such as coupon application, tax calculation, checkout inventory locks, order payment capturing, and admin tasks (processing refunds) require execution in a trusted environment.

## Decision

We will employ **Firebase Cloud Functions** (HTTP Callable and background event triggers) as our serverless backend boundary for write operations containing computations.

1.  Direct client-side creations/updates on the `/orders` and `/promotions` collections are blocked.
2.  Checkout is routed exclusively through a `checkoutCart` HTTP Callable function.
3.  Product reviews are evaluated for spam or abuse via background trigger functions before status updates.

## Alternatives Considered

### 1. Direct Client-Side Writes with Firestore Security Rules

Performing inventory decrement checks, tax additions, and Stripe charging on the client, and updating Firestore documents directly.

- _Why Rejected_: Firestore Security Rules are expressive but cannot integrate with third-party payment APIs (Stripe). They also cannot prevent race conditions where two customers attempt to purchase the final remaining inventory item simultaneously. Directly writing to `/orders` from the client introduces risks of price manipulation, where a malicious user could modify the total price field in transit.

### 2. Dedicated Node.js Express Backend on Compute Engine / App Engine

- _Why Rejected_: A dedicated server environment adds maintenance burdens, VM patching, scaling rule management, and persistent idle costs. Our architecture benefits from a fully serverless, pay-per-use environment that scales to zero when traffic is low.

## Consequences

### Benefits

- **Encapsulation of Secrets**: Sensitive API keys (Stripe Secret Key, EasyPost credentials, TaxJar tokens) are stored securely in GCP Secret Manager and accessed exclusively by Cloud Functions.
- **Transactional Guarantees**: Inventory decrements and order creation are executed inside a single, atomic Firestore transaction.
- **Decoupled Frontend**: The Next.js frontend has no direct dependencies on third-party service SDKs for payment or shipping calculations, reducing bundle sizes.

### Trade-offs

- **Cold Starts**: Serverless functions experience initialization delays (cold starts) when spinning up from zero instances. We will mitigate this using Node 20+, keeping code dependencies light, and optionally setting a minimum instance count (`minInstances: 1`) on the critical `checkoutCart` function.
- **Execution Costs**: High execution rates can accumulate costs. However, our serverless strategy confines functions to checkout operations, where execution costs are fully offset by business transactions.
