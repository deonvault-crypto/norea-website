import Constants from "expo-constants";

export const appConfig = {
  apiUrl:
    process.env.EXPO_PUBLIC_API_URL ||
    (Constants.expoConfig?.extra?.apiUrl as string | undefined) ||
    "https://api.norea.fit/api",
  privacyUrl:
    process.env.EXPO_PUBLIC_PRIVACY_URL ||
    (Constants.expoConfig?.extra?.privacyUrl as string | undefined) ||
    "https://norea.fit/privacy",
  termsUrl:
    process.env.EXPO_PUBLIC_TERMS_URL ||
    (Constants.expoConfig?.extra?.termsUrl as string | undefined) ||
    "https://norea.fit/terms",
  supportUrl:
    process.env.EXPO_PUBLIC_SUPPORT_URL ||
    (Constants.expoConfig?.extra?.supportUrl as string | undefined) ||
    "https://norea.fit/support",
  websiteUrl:
    process.env.EXPO_PUBLIC_WEBSITE_URL ||
    (Constants.expoConfig?.extra?.websiteUrl as string | undefined) ||
    "https://norea.fit",
  whatsappUrl: "https://wa.me/263776678288"
};
