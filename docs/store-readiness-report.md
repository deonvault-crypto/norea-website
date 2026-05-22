# Noréa Mobile Store Readiness Report

Date: 2026-05-22

## Summary

The Noréa mobile app and mobile API are structured for physical-goods ecommerce and are isolated from the existing website. Existing website frontend files and routes were not modified.

## Production Readiness Status

| Area | Status | Notes |
| --- | --- | --- |
| Website isolation | Pass | Mobile work lives under `mobile/`, `mobile-api/`, `deploy/`, `.github/` and `docs/`. |
| MongoDB production safety | Pass | API uses configurable existing collection and field names. No migrations are performed. |
| Product/inventory reuse | Pass | Product routes read existing product collection and join configured inventory collection. |
| Customers/orders reuse | Pass | Auth/order routes use configured customer and order collections. Mobile-created records are tagged with `source=mobile`. |
| Pagination | Pass | Products, customer admin, order admin, reviews and payments expose pagination metadata. |
| Validation | Pass | Zod validation covers auth, addresses, orders, products, reviews, discounts and refunds. |
| Error handling | Pass | Responses include request IDs; validation and server errors are handled centrally. |
| JWT auth | Pass | Customer and admin routes are JWT protected. |
| Admin permissions | Pass | Admin routes require admin role or configured admin email allowlist. |
| Production logging | Pass | API emits JSON request and error logs. |
| Monitoring readiness | Pass | `/api/health`, `/api/ready`, `/api/monitoring/readiness` and admin metrics are available. |
| Payments | Pass with configuration required | Paynow/card credentials and mobile-money/bank details must be set in Render. |
| PCI safety | Pass | Backend does not store card numbers; card flows are provider-handled. |
| Apple/Google physical-goods model | Pass | No IAP, coins, subscriptions, memberships or digital unlocks. |
| Assets | Pass | Mobile app uses optimized PNG splash/icon assets and an image wrapper with loading/fallback states. |
| Offline/API failure handling | Pass | Product loading falls back to bundled catalog; checkout/auth errors show safe alerts. |
| Push notifications | Pass with provider setup required | Permission request is explicit and limited to notifications. |
| Privacy/terms/support pages | Pass | Mobile API serves privacy, terms and support URLs for store metadata. |

## App Screen Audit

- Splash: present
- Onboarding: present
- Login: present with error handling
- Register: present with error handling
- Home: present with hero, categories, carousels, reviews, newsletter and WhatsApp support
- Shop: present with search, category filters and sorting
- Product details: present with gallery, sizes, colours, quantity, reviews, delivery, returns, wishlist and add to cart
- Wishlist: present with empty state
- Cart: present with quantity controls and empty state
- Checkout: present with physical-goods payment methods only
- Orders: present with status tracking
- Account: present
- Notifications: present with explicit permission request
- Settings: present with privacy notes
- Support: present with WhatsApp support

## Required Before Public Launch

1. Set all `mobile-api/.env.example` variables in the separate Render `norea-mobile-api` service.
2. Confirm actual production collection names and field mappings for products, inventory, customers and orders.
3. Configure Paynow credentials and result/return URLs.
4. Configure EcoCash, OneMoney, ZIPIT and bank transfer merchant details.
5. Verify payment webhooks using real provider sandbox/production test tools.
6. Verify app deep link return from Paynow to `norea://orders`.
7. Generate final iOS and Android screenshots from real device builds.
8. Confirm privacy policy, terms and support URLs are public and accurate.

## Audit Commands Run

- `npm run typecheck` in `mobile/`
- `npm audit --omit=dev` in `mobile/`
- `npm run check` in `mobile-api/`
- `npm audit --omit=dev` in `mobile-api/`
- API smoke test on isolated local port for `/api/health` and `/api/products`
