import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import { appConfig } from "../config";
import { Address, CartItem, Order, PaymentMethod, Product } from "../types";
import { products as localProducts } from "../data/catalog";

const configuredUrl =
  process.env.EXPO_PUBLIC_API_URL ||
  (Constants.expoConfig?.extra?.apiUrl as string | undefined);

export const API_URL = configuredUrl || appConfig.apiUrl;

type ApiResult<T> = { data: T };
type Paginated<T> = { items: T[]; pagination: { page: number; limit: number; total: number; totalPages: number } };

async function token() {
  return SecureStore.getItemAsync("norea.jwt");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const authToken = await token();
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...options.headers
    }
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || `Request failed with ${response.status}`);
  }

  const body = (await response.json()) as ApiResult<T>;
  return body.data;
}

export async function signIn(email: string, password: string) {
  const data = await request<{ token: string; user: { name: string; email: string } }>(
    "/auth/login",
    {
      method: "POST",
      body: JSON.stringify({ email, password })
    }
  );
  await SecureStore.setItemAsync("norea.jwt", data.token);
  return data.user;
}

export async function register(name: string, email: string, phone: string, password: string) {
  const data = await request<{ token: string; user: { name: string; email: string } }>(
    "/auth/register",
    {
      method: "POST",
      body: JSON.stringify({ name, email, phone, password })
    }
  );
  await SecureStore.setItemAsync("norea.jwt", data.token);
  return data.user;
}

export async function signOut() {
  await SecureStore.deleteItemAsync("norea.jwt");
}

export async function fetchProducts(query = ""): Promise<Product[]> {
  try {
    const suffix = query ? `?${query}` : "";
    const result = await request<Product[] | Paginated<Product>>(`/products${suffix}`);
    return Array.isArray(result) ? result : result.items;
  } catch {
    return localProducts;
  }
}

export async function fetchOrders(): Promise<Order[]> {
  const result = await request<Order[] | Paginated<Order>>("/orders/me");
  return Array.isArray(result) ? result : result.items;
}

export async function createOrder(args: {
  items: CartItem[];
  address: Address;
  paymentMethod: PaymentMethod;
}) {
  return request<{ order: Order; paymentInstructions: string; redirectUrl?: string }>(
    "/orders",
    {
      method: "POST",
      body: JSON.stringify({
        items: args.items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          size: item.size,
          colour: item.colour
        })),
        address: args.address,
        paymentMethod: args.paymentMethod
      })
    }
  );
}

export async function savePushToken(pushToken: string) {
  return request<{ ok: true }>("/notifications/register", {
    method: "POST",
    body: JSON.stringify({ pushToken })
  });
}
