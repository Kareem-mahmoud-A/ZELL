# ZELL Workspace Rules

## Security Constraints — Payment Processing & Credentials

1. **No Sensitive Payment Data**:
   - Raw payment credentials, card numbers, card verification codes (CVV/CVC), bank details, provider API secrets, or raw payment processor payloads must **NEVER** enter `@zell/shared` domain models or Firestore documents.
   - Sensitive vendor payloads and API responses must remain strictly inside external provider adapters and serverless functions (secure adapters/actions).

2. **Allowed Payment Entity Data**:
   - Payment entities, schemas, and order collections may only store:
     - Provider reference identifiers (e.g., Stripe PaymentIntent ID, Transaction ID)
     - Transaction state/status (e.g., `PENDING`, `COMPLETED`, `FAILED`)
     - Amounts and currencies (using the `Money` value object)
     - Timestamps (e.g., `paidAt`, `createdAt`)
     - Audit metadata (e.g., reference reasons, user reference IDs)
