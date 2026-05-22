import Constants from "expo-constants";

export const appConfig = {
  apiUrl:
    process.env.EXPO_PUBLIC_API_URL ||
    (Constants.expoConfig?.extra?.apiUrl as string | undefined) ||
    "http://127.0.0.1:4000/api",
  privacyUrl:
    process.env.EXPO_PUBLIC_PRIVACY_URL ||
    (Constants.expoConfig?.extra?.privacyUrl as string | undefined) ||
    "http://127.0.0.1:4000/legal/privacy",
  termsUrl:
    process.env.EXPO_PUBLIC_TERMS_URL ||
    (Constants.expoConfig?.extra?.termsUrl as string | undefined) ||
    "http://127.0.0.1:4000/legal/terms",
  supportUrl:
    process.env.EXPO_PUBLIC_SUPPORT_URL ||
    (Constants.expoConfig?.extra?.supportUrl as string | undefined) ||
    "http://127.0.0.1:4000/legal/support",
  whatsappUrl: "https://wa.me/263776678288"
};
