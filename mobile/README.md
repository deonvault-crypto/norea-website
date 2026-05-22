# Noréa Mobile App

Expo React Native ecommerce app for Noréa, built independently from the existing website.

## Included Screens

- Splash
- Onboarding
- Login
- Register
- Home
- Shop
- Product details
- Wishlist
- Cart
- Checkout
- Orders
- Customer account
- Notifications
- Settings
- Support

## Local Development

```bash
cd mobile
cp .env.example .env
npm install
npm start
```

Set `EXPO_PUBLIC_API_URL` to the deployed `norea-mobile-api` service before store submission.

## App Store Safety Notes

- The app sells physical goods only.
- Apple IAP and Google Play Billing are not used.
- Checkout hands off to supported physical-goods payment methods through the mobile API.
- The app requests only notification permission.
- It does not request contacts, SMS, call logs, background location or tracking permissions.
- Privacy, terms and support URLs are configured through environment variables.
- Product imagery uses stable dimensions, loading indicators, cover resizing and fallback images.
- Product lists use `FlatList` virtualization for mobile performance.
