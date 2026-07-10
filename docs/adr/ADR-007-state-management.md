# ADR-007: State Management Approach

## Status

Accepted

## Date

2026-07-08

## Context

E-commerce applications handle three main categories of state:

1.  **Server State**: Catalog information, categories, and order history retrieved from database queries.
2.  **Global Client State**: Shopping cart items, applied coupons, and active user profile details.
3.  **Local UI State**: Filtering sidebars, active review pages, product image slide indices, and loading states.

Next.js App Router applications run both on the server (Server Components) and client (Client Components). We need a state management approach that handles server data fetching and client interaction without causing hydration conflicts.

## Decision

We will employ a **hybrid state management model**:

1.  **Server State**: Next.js Server Components handle direct data fetching from Firestore, eliminating client-side loading spinners.
2.  **Global Client State**: **Zustand** will manage client-side state (specifically the shopping cart and guest session states).
3.  **Local UI State**: standard React hooks (`useState`, `useReducer`) and React Context.
4.  **Search & Filtering State**: Next.js URL search parameters (`?category=dresses&size=M`) to ensure catalog listings are shareable and bookmarkable.

## Alternatives Considered

### 1. Redux / Redux Toolkit (RTK)

- _Why Rejected_: Redux is overly complex for our serverless architecture. Because server data fetching is offloaded to Next.js server components, we do not need RTK Query. Using Redux for local cart state introduces unnecessary boilerplate code and bundle bloat.

### 2. React Context API for All Client State

- _Why Rejected_: The React Context API is not optimized for high-frequency updates. Changing state (e.g., updating cart item quantities) causes all consumer components in the tree to re-render, even if they only read unrelated values. Zustand uses selector functions to subscribe components to specific state slices, preventing unnecessary re-renders.

## Consequences

### Benefits

- **Performance Optimization**: Zustand's selector mechanism ensures components only re-render when their subscribed state changes.
- **Hydration Safety**: Zustand stores can be initialized on the client side, avoiding mismatch warnings between server-rendered HTML and client-hydrated states.
- **SEO-Friendly Links**: Storing filters and search strings in the URL query parameters allows customers to copy links (e.g., sending a filtered collection page to a friend) with consistent results.

### Trade-offs

- **SSR Hydration Guarding**: We must prevent components reading Zustand stores from rendering on the server before client-side hydration completes. We will manage this using React's `useEffect` or dynamic import loading indicators.
