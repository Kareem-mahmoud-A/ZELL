# ADR-009: Scalability & Search Strategy

## Status

Accepted

## Date

2026-07-08

## Context

E-commerce users expect immediate search results, autocomplete, and the ability to filter catalog products across multiple criteria (e.g., Category: Jackets, Size: L, Color: Black, Stock: In Stock). Firestore does not support native text queries, fuzzy matching, or multiple range queries on different properties. We need to implement a scalable search solution that preserves performance as the catalog grows.

## Decision

We will integrate **Algolia** as the dedicated search engine for ZELL.

1.  Catalog queries, filtering, and text searches are executed directly against Algolia's endpoints from the client.
2.  A background Cloud Function (`onDocumentUpdated` in Firestore) listens for product updates and synchronizes search indices to Algolia automatically.
3.  Firestore remains the single source of truth for transactional checkouts, cart items, and catalog records.

```
+------------------+    Firestore Trigger     +-------------------------+
|                  | -----------------------> | Firebase Cloud Function |
|  Firestore DB    |                          +-------------------------+
| (Primary Catalog)| <-----------------------              |
+------------------+     Read Details              Sync Indices
                                                           v
                                                      +----------+
                                                      | Algolia  |
                                                      +----------+
```

## Alternatives Considered

### 1. In-App Javascript Search Client-Side

Downloading the product catalog to the browser and executing local searches.

- _Why Rejected_: Only feasible for small catalogs (<500 products). As the catalog grows, downloading the entire product index to the browser consumes significant network bandwidth, delays page initialization, and is not viable on low-end mobile devices.

### 2. Firestore Document Arrays for Facets

Hacking Firestore queries by structured field arrays (e.g., checking `tags` arrays for filters).

- _Why Rejected_: Highly fragile. Firestore cannot execute range queries on multiple fields (e.g., price range and size filter simultaneously) without creating manual composite indexes for every possible query variation. It also lacks support for typo tolerance and relevance ranking.

### 3. Self-Hosted Elasticsearch on Compute Engine

- _Why Rejected_: Elasticsearch clusters require server maintenance, index mapping configurations, memory tuning, and custom node hosting, which increases infrastructure overhead. Algolia's serverless solution provides high availability and performance out-of-the-box.

## Consequences

### Benefits

- **Search Speeds**: Algolia delivers fast search responses (<50ms) with typo tolerance and autocomplete.
- **Reduced Firestore Reads**: Store searches and catalog browsing are handled by Algolia, shielding Firestore from search query loads.
- **Composite Filtering**: Complex multi-facet catalog filters are processed instantly.

### Trade-offs

- **Data Synchronization**: There is a brief latency window (typically 1-3 seconds) between editing a product in the merchant dashboard and the updates reflecting in Algolia's search indexes.
- **Cost**: Introduces a recurring third-party SaaS charge. However, this cost is offset by the reduction in Firestore read operations.
