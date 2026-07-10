# ADR-003: Firestore Schema Design

## Status

Accepted

## Date

2026-07-08

## Context

A key challenge in fashion e-commerce database design is representing variations of products (e.g., a single dress style available in sizes S, M, L and colors Blue, Floral). Each variant holds individual SKU codes, pricing adjustments, image galleries, and real-time inventory counts. We need to decide how to structure products, categories, orders, and variations in Firestore to balance read-costs, write-scalability, and query flexibility.

## Decision

We will employ a **hybrid collection/embedded schema** structure:

1.  **Product Document nesting**: Product variants will be stored as an array of nested maps directly within the parent `/products/{productId}` document.
2.  **Order Document nesting**: Order items will be snapshotted as an array of maps in the `/orders/{orderId}` document, denormalizing variables like prices and titles at the exact moment of sale.
3.  **Root collections for independent boundaries**: `users`, `products`, `orders`, `categories`, `promotions`, and `reviews` will exist as flat, top-level root collections.

### JSON Representation of Variant Nesting

```json
// Within /products/{id}
{
  "id": "prod_maxi_01",
  "basePrice": 120.0,
  "variants": [
    {
      "sku": "ZELL-DRES-FLOR-MD",
      "price": 120.0,
      "inventory": 40,
      "attributes": {
        "size": "M",
        "color": "Floral Blue"
      }
    }
  ]
}
```

## Alternatives Considered

### 1. Separate Subcollection for Variants (`/products/{id}/variants/{sku}`)

Each variant exists as a separate document in a subcollection under the product.

- _Why Rejected_: To render a product detail page, the application must select the product document and then execute a query to retrieve all documents inside the subcollection. This doubles the Firestore read cost for catalog browsing. In e-commerce, catalog reads represent 90%+ of database traffic, making this financially inefficient.

### 2. Fully Normalized Schemas (Separate Root Collection for Inventory & SKUs)

Creating a separate `/inventory` collection linked by `productId` or `sku`.

- _Why Rejected_: Firestore does not support SQL-style joins. Retrieving the stock level for a product card on a catalog list would require fetching the product list and then executing separate concurrent reads for each inventory record. This increases network latency and read costs.

## Consequences

### Benefits

- **Optimal Read Efficiency**: A single Firestore document read retrieves the product metadata, descriptions, pricing variations, and stock levels instantly.
- **Simple Indexing**: Catalog queries looking for active products can use simple single-field indices.
- **Self-Contained Orders**: Nesting order items prevents future changes in product details (like a pricing hike or description edit) from modifying historical order records.

### Trade-offs

- **Document Size Limits**: Firestore documents are limited to 1MB of data. Because product metadata and a typical set of 10-30 variants consume less than 50KB, this is not an issue for fashion products, but rules out embedding unbounded sub-resources (like user reviews).
- **Write Contention on Inventory**: Decrementing stock requires modifying the parent product document. Since order rates for a single product rarely exceed 1 check-out per second, this is acceptable. For highly popular product drops, we will implement transaction safety checks in Cloud Functions.
