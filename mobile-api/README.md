# Noréa Mobile API

Independent backend for the Noréa mobile app. It does not modify or serve the existing website.

## Features

- JWT authentication with bcrypt password hashing
- Product, inventory, wishlist, address, order and review APIs
- Physical-goods payment handoff for Paynow, EcoCash, OneMoney, ZIPIT, Visa, Mastercard and bank transfer
- Admin dashboard at `/admin`
- Admin APIs for products, inventory, orders, payments, customers, reviews, discounts, shipping and analytics
- GDPR-minded data minimisation: name, email, phone, delivery address and orders only
- No card storage; card-capable payments must be handled by a configured payment provider

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
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

Paynow/card payments require:

- `PAYNOW_INTEGRATION_ID`
- `PAYNOW_INTEGRATION_KEY`
- `PAYNOW_RESULT_URL`
- `PAYNOW_RETURN_URL`

The API intentionally rejects unconfigured card/Paynow payment attempts in production rather than creating fake payment flows.
