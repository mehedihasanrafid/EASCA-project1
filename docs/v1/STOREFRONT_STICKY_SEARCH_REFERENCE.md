# Storefront Sticky Search Reference

## Behaviour

- The homepage and product-discovery page keep their large search bars.
- When the large search reaches the sticky header, a compact search appears
  inside the header.
- Scrolling back to the large search hides the compact version again.
- Pages without a large search, including customer account, cart, checkout,
  and order pages, show the compact header search immediately.
- Public and customer pages use the same `StorefrontHeader`; administrator
  pages keep their separate `AdminHeader`.
- Search drafts synchronize between the large and compact search inputs.

## Files

```text
web/src/features/storefront/
├── StorefrontHeader.tsx
├── StorefrontHeader.module.css
├── storefrontSearch.ts
└── storefrontSearch.test.ts

web/src/features/catalog/components/ProductSearch.tsx
web/src/pages/Home.tsx
web/src/pages/products/SearchResultsPage.tsx
```

## Safe changes

- Change compact spacing and header alignment in
  `StorefrontHeader.module.css`.
- Change compact input/button sizing in the `compact` branch of
  `ProductSearch.tsx`.
- Change the takeover threshold in `shouldShowHeaderSearch()` inside
  `storefrontSearch.ts`.
- Keep `stickySource` on every large search that should hand control to the
  header.
