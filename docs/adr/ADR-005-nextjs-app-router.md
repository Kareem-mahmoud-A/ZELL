# ADR-005: Next.js App Router Rationale

## Status

Accepted

## Date

2026-07-08

## Context

E-commerce websites depend heavily on Search Engine Optimization (SEO) and fast performance. Search engine bots index pages using static HTML content, and users expect product pages to load under 2 seconds. A slow site increases bounce rates, directly impacting conversions. We must select a frontend rendering strategy that combines search crawler visibility with dynamic customer interactivity.

## Decision

We will build the storefront using the **Next.js App Router** (Next.js 14+), utilizing React Server Components (RSC) and Hybrid Rendering (Static generation for catalogs, Server-side rendering for accounts/checkout, Client-side hydration for cart states).

## Alternatives Considered

### 1. Client-Side Single Page Application (e.g., Vite + React)

A fully client-side rendered (CSR) SPA.

- _Why Rejected_: Vite SPAs build into a single bundle that downloads empty HTML shells. Crawlers without Javascript rendering capabilities see empty pages, harming SEO. Moreover, initial page load speeds are hindered as clients must download the entire JS bundle and perform client-side queries before displaying product lists, leading to layout shifts and delays.

### 2. Next.js Pages Router

- _Why Rejected_: The legacy Pages Router does not support React Server Components. This forces all data-fetching hooks (e.g., `getServerSideProps`) to run at the page level, meaning large components must hydrate client-side. The App Router allows component-level server actions and data fetching, resulting in smaller client bundle sizes and better performance.

## Consequences

### Benefits

- **Static Generation (SSR/ISR)**: Product and category pages are rendered into static HTML at build time or updated incrementally (Incremental Static Regeneration), resulting in instant page load speeds and SEO indexing.
- **Client JavaScript Reduction**: Components that do not require user interaction (e.g., footers, text descriptions, banners) remain server-only, reducing the amount of JavaScript sent to the browser.
- **Segmented Layouts**: Persistent layouts (e.g., global navigation, sidebar directories) do not re-render between transitions, saving rendering cycles.

### Trade-offs

- **Hydration Context Complexity**: We must clearly demarcate Server Components (default) from Client Components (marked with `"use client"`) when implementing interactive features like variant selectors, cart drawers, and forms.
- **Server Execution Cost**: Dynamic pages require Node.js runtime environments (like Vercel Serverless or Cloud Run), which are slightly more complex to deploy than static S3/GCS buckets.
