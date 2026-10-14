# DokanBD Admin Dashboard Reference

This manual explains the Admin Dashboard architecture, data rules, styling,
customization points, testing, project connections, and safe future upgrades.

## 1. What the Admin Dashboard is

The Admin Dashboard is the default page at `/admin`. It is not the complete
admin application. It is one route rendered inside the shared admin shell:

```text
MainLayout
├── AdminHeader
└── AdminLayout
    ├── AdminSidebar
    └── Workspace
        └── AdminDashboardPage
```

`RoleRoute` permits only `ADMIN` and `OWNER` users to reach the admin
routes. The backend endpoint repeats the same authorization check. Frontend
route protection improves navigation, while backend authorization protects the
actual data.

## 2. Frontend files

```text
web/src/admin/dashboard/
├── AdminDashboardPage.tsx
├── AdminDashboard.module.css
├── components/
│   ├── DashboardSummary.tsx
│   ├── SalesTrendChart.tsx
│   ├── BestSellers.tsx
│   └── LowStockProducts.tsx
├── hooks/
│   └── useAdminDashboard.ts
├── utils/
│   └── formatters.ts
├── dashboard-components.test.tsx
└── index.ts
```

`AppRouter.tsx` imports `AdminDashboardPage` directly from
`web/src/admin/dashboard`. `web/src/pages/admin/AdminOverviewPage.tsx` remains a
temporary compatibility export for older imports.

## 3. Responsibility of each file

### AdminDashboardPage.tsx

Composes the page. It owns the heading, Refresh button, Add Product link, error
message, initial loading state, and placement of the four dashboard sections.

Change here when:

- changing the welcome title or subtitle;
- changing header buttons;
- reordering complete dashboard sections;
- adding a new top-level panel.

### useAdminDashboard.ts

Owns the asynchronous dashboard workflow:

1. Set loading.
2. Clear the previous error.
3. Call `adminDashboardApi.get()`.
4. Store the returned dashboard.
5. Convert API failures into a readable message.
6. Expose `refresh()` for Refresh and Try Again.

Change here when adding client-side refresh intervals, cancellation, caching,
or request-specific state. Do not put JSX or styles in this hook.

### DashboardSummary.tsx

Converts `dashboard.summary` into four cards:

- Total sales
- Total orders
- Today's orders
- Low stock

Card text, order, icon, and tone can be changed in the local `cards` array.
If a card needs a new value, first add that value to the backend response and
the `AdminDashboardSummary` TypeScript interface.

### SalesTrendChart.tsx

Creates an SVG line and area chart from `dailySales`. It calculates chart
coordinates with `useMemo`, renders grid labels, supplies point tooltips, and
shows an empty message when every day has zero sales.

The backend currently supplies exactly 30 calendar days, inserting zero-value
days when there were no recognized sales.

### BestSellers.tsx

Renders the ranked product list. Bar widths are relative to the largest
`quantitySold` value. Existing products link to their editor. Historical
order items whose product was deleted display as plain text because their
`productId` is null.

### LowStockProducts.tsx

Displays active variants whose stock is less than or equal to their individual
low-stock level. Each row links to the relevant product editor.

### formatters.ts

Contains shared presentation formatting for BDT money, integers, and the
dashboard update time. Change locale, currency, or time formatting here rather
than in every component.

### AdminDashboard.module.css

Contains all dashboard-only styling:

- metrics;
- analytics layout;
- panels;
- chart;
- best sellers;
- low-stock table additions;
- loading and refresh animations;
- responsive dashboard behavior.

It cannot accidentally style unrelated pages because CSS Module class names
are locally scoped. Shared classes such as `.btn`, `.alert`,
`.admin-page-header`, and the base admin table remain global because multiple
features use them.

## 4. Complete data flow

```text
Browser opens /admin
        ↓
AppRouter checks ADMIN or OWNER
        ↓
AdminDashboardPage mounts
        ↓
useAdminDashboard calls adminDashboardApi.get()
        ↓
GET /api/v1/admin/dashboard
        ↓
Backend requireAuth + requireRole
        ↓
admin-dashboard.controller.ts
        ↓
admin-dashboard.service.ts
        ↓
Orders + order items + product variants in MySQL
        ↓
Dashboard JSON
        ↓
Summary, chart, best sellers, and low-stock components
```

Frontend API contract:

`web/src/api/adminDashboard.ts`

Backend files:

```text
DokanBDbackend/src/modules/admin-dashboard/
├── admin-dashboard.routes.ts
├── admin-dashboard.controller.ts
├── admin-dashboard.service.ts
└── admin-dashboard.service.test.ts
```

Swagger registration is in
`DokanBDbackend/src/docs/openapi.ts` under `GET /admin/dashboard`.

## 5. Current business rules

### Recognized sales

A sale contributes to revenue unless:

- order status is `CANCELLED`; or
- payment status is `FAILED` or `REFUNDED`.

The shared SQL condition is `RECOGNIZED_SALE_CONDITION` in the backend
dashboard service. Change it carefully because it affects total sales, daily
sales, and best sellers.

### Total orders

Counts all placed orders, including orders that may later be cancelled. This is
why total-order count and recognized revenue use different rules.

### Today's orders

Uses the database current date and counts orders placed from the beginning of
today up to, but not including, tomorrow. Server/database timezone configuration
therefore affects this value.

### Daily sales

Uses the latest 30 calendar days including today. `fillDailySales()` fills
missing dates with `0.00` sales and zero orders so the chart has a continuous
timeline.

### Best sellers

Ranks recognized order items by total quantity, then revenue, and returns the
top six. Change `.limit(6)` in the backend service to show more or fewer.

### Low stock

A variant is included when:

- the product and variant are active;
- neither is deleted;
- product status is `ACTIVE`; and
- `stockQuantity <= lowStockLevel`.

The summary counts every matching variant. The table displays the eight lowest
stock variants. Change `.limit(8)` to adjust the visible table length.

## 6. Common changes

### Change dashboard colors or spacing

Edit `AdminDashboard.module.css`. Prefer existing variables such as:

```css
var(--primary)
var(--surface)
var(--bg-color)
var(--text-main)
var(--text-muted)
var(--border)
var(--radius-lg)
```

Admin-scoped token values are defined in `AdminLayout.module.css`. Change a
token there when the same visual decision should affect every admin feature.

### Reorder panels

Move the component calls inside `AdminDashboardPage.tsx`. No API change is
needed.

### Add a summary metric

1. Calculate and return the value in `admin-dashboard.service.ts`.
2. Add it to `AdminDashboardSummary` in `web/src/api/adminDashboard.ts`.
3. Add a card object in `DashboardSummary.tsx`.
4. Add a local CSS tone only if the default card design is insufficient.
5. Add backend and component tests.

### Change the chart period

Changing “30 days” requires coordinated edits:

1. Backend date interval and `fillDailySales` day count.
2. API/Swagger wording if the contract changes.
3. Chart title and accessible label.
4. Label indexes in `SalesTrendChart.tsx`.
5. Tests for missing dates and boundary dates.

For a selectable date range, accept a validated query parameter rather than
hard-coding several frontend endpoints.

### Change low-stock behavior

The threshold is stored per variant. Edit the product/variant workflow to
change `lowStockLevel`. Edit the backend query only when changing the global
business definition.

### Change Refresh behavior

The button calls `refresh()` from `useAdminDashboard`. For automatic refresh,
add a controlled timer inside that hook and clean it up on unmount. Avoid a very
short interval because the endpoint performs several aggregate queries.

## 7. CSS and Tailwind

CSS Modules and Tailwind can be used together:

- use the CSS Module for dashboard-specific design and responsive rules;
- use shared global component classes for established controls;
- use Tailwind for small one-off layout adjustments;
- do not duplicate the same rule in global CSS, a module, and Tailwind.

When migrating a style, verify the page first and then remove the old global
selector. Dashboard-only selectors have already been removed from
`styles/features/admin.css`.

## 8. Testing

Frontend component coverage:

`web/src/admin/dashboard/dashboard-components.test.tsx`

Backend date-series coverage:

`DokanBDbackend/src/modules/admin-dashboard/admin-dashboard.service.test.ts`

Useful checks:

```bash
cd web
npm run typecheck
npm test
npm run build

cd ../DokanBDbackend
npm run typecheck
npm test
```

Also test these browser states:

- initial loading;
- successful data;
- Refresh while old data remains visible;
- API failure and Try Again;
- no sales;
- no low-stock variants;
- mobile width;
- keyboard navigation;
- reduced-motion preference.

## 9. Future upgrades

Recommended additions, in a safe order:

1. Date-range selector with validated backend query parameters.
2. Comparison values against the previous period.
3. Click-through from a chart day to filtered orders.
4. Order-status and payment-status breakdowns.
5. Revenue versus cost and gross-profit reporting.
6. Category and brand performance.
7. Inventory valuation and out-of-stock alerts.
8. CSV/PDF export through a separate reporting endpoint.
9. Server-side caching for expensive aggregate queries.
10. Configurable dashboard cards per administrator.

Before adding live updates, filters, or exports, define their permissions and
audit requirements. Dashboard data is operational business data and should not
be exposed through public endpoints.

## 10. Troubleshooting map

| Problem | First place to inspect |
|---|---|
| Dashboard route does not open | `AppRouter.tsx` and `RoleRoute` |
| Page opens but API returns 401/403 | Backend auth/role middleware |
| Wrong totals | `admin-dashboard.service.ts` business conditions |
| Missing chart date | `fillDailySales()` and timezone |
| Wrong money formatting | Dashboard `utils/formatters.ts` |
| Refresh does nothing | `useAdminDashboard.ts` |
| Panel layout/style | `AdminDashboard.module.css` |
| Sidebar link | `adminSidebar.config.ts` |
| API contract mismatch | `web/src/api/adminDashboard.ts` and Swagger |

## 11. Maintenance principle

Keep business calculations in the backend, asynchronous page workflow in the
hook, visual sections in components, formatting in pure utilities, and
dashboard-only design in the local CSS Module. This boundary is what makes the
dashboard understandable and safe to extend.
