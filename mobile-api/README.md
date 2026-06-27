# Noréa Mobile API

Independent backend for the Noréa mobile app. It does not modify or serve the existing website.

## Features

- JWT authentication with bcrypt password hashing
- Product, inventory, wishlist, address, order, payment, refund and review APIs
- Configurable MongoDB collection and field mapping for existing production collections
- Paginated mobile-safe product, customer, order, review and payment routes
- Physical-goods payment initiation and verification for Paynow, EcoCash, OneMoney, ZIPIT, Visa, Mastercard and bank transfer
- Paynow result/return endpoints, signed message verification and polling support
- Admin dashboard at `/admin`
- Admin APIs for products, inventory, orders, payments, customers, reviews, discounts, shipping and analytics
- GDPR-minded data minimisation: name, email, phone, delivery address and orders only
- No card storage; card-capable payments must be handled by a configured payment provider
- JSON production logs, request IDs and monitoring readiness endpoints

## Local Development

```bash
cd mobile-api
cp .env.example .env
npm install
npm run dev
```

The API runs at `http://127.0.0.1:4000/api`.

## Production Notes

Set all production environment variables in the separate Render mobile API service. Do not reuse or edit website service variables.

Required in production:

- `JWT_SECRET`
- `MONGODB_URI`

The API connects to the existing database by collection names and field names. Defaults assume:

- `products`
- `inventory`
- `customers`
- `orders`

Override `MONGO_*_COLLECTION` and `*_FIELD` variables when the existing website database uses different names. This avoids database migrations or website schema changes.

Admin bootstrap is disabled by default in production. Use existing admin/customer records or set `ADMIN_BOOTSTRAP_ENABLED=true` only during a controlled setup window.

Paynow/card payments require:

- `PAYNOW_INTEGRATION_ID`
- `PAYNOW_INTEGRATION_KEY`
- `PAYNOW_RESULT_URL`
- `PAYNOW_RETURN_URL`

The API intentionally rejects unconfigured card/Paynow payment attempts in production rather than creating fake payment flows.

## Monitoring

- `GET /api/health` for basic liveness
- `GET /api/ready` for database/JWT/payment readiness
- `GET /api/readiness` for Render-ready JSON covering server status, MongoDB connection, configured collection names and required environment-variable presence without exposing secret values
- `GET /api/monitoring/readiness` for uptime and request/payment counters
- `GET /api/metrics` for admin-only runtime metrics

### `GET /api/readiness`

Use this endpoint for Render health/readiness checks when the mobile API must prove it can reach MongoDB and has the required production environment variables. The response never returns secret values, only `present` booleans.

Example response:

```json
{
  "data": {
    "status": "ready",
    "server": {
      "service": "norea-mobile-api",
      "running": true,
      "environment": "production",
      "uptimeSeconds": 42,
      "timestamp": "2026-05-22T16:30:00.000Z"
    },
    "mongodb": {
      "configured": true,
      "connected": true,
      "database": "norea",
      "collections": {
        "products": "products",
        "inventory": "inventory",
        "customers": "customers",
        "orders": "orders"
      }
    },
    "environment": {
      "variables": [
        { "name": "JWT_SECRET", "present": true, "required": true },
        { "name": "MONGODB_URI", "present": true, "required": true }
      ],
      "missingRequired": []
    }
  },
  "requestId": "..."
}
```

Returns HTTP `200` when ready and HTTP `503` when MongoDB is not connected or required environment variables are missing.

## Payment Safety

This backend supports physical goods only. It does not implement Apple IAP, Google Play Billing, coins, subscriptions, digital fitness plans or premium digital unlocks.
