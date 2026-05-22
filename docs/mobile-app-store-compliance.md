# Noréa Mobile App Store Compliance Notes

This document records implementation decisions for the independent Noréa mobile app.

## Scope

Noréa sells physical activewear and athleisure products only. The mobile app does not sell digital goods, subscriptions, gambling products, crypto assets or prohibited content.

## Payments

Supported physical-goods methods:

- Paynow Zimbabwe
- EcoCash
- OneMoney
- ZIPIT
- Visa
- Mastercard
- Zimbabwe bank transfer

The app does not use Apple In-App Purchase or Google Play Billing because purchases are for physical goods consumed outside the app. Card-capable payment flows must be handled by a configured payment provider. The backend rejects unconfigured card/Paynow payments in production instead of creating a fake flow.

## Privacy

The app collects only:

- Name
- Email
- Phone number
- Delivery address
- Orders

The app does not request contacts, SMS logs, call logs, background location or tracking permissions.

## Security

Implemented controls:

- JWT authentication
- bcrypt password hashing
- API input validation
- protected customer and admin routes
- rate limiting
- helmet security headers
- no card data storage
- production startup fails if required secrets/database settings are missing

## Store Submission Checklist

- Deploy `norea-mobile-api` as a separate Render service.
- Set production API, privacy, terms and support URLs in Expo/EAS environment.
- Configure payment provider credentials and real merchant details.
- Confirm privacy policy, terms and support pages are live.
- Replace EAS project ID after creating the Expo project.
- Generate final store screenshots from real builds.
- Submit only after live checkout and support contacts have been tested end to end.
