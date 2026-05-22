import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import { appConfig } from "../config";
import { Address, AuthUser, CartItem, Order, OrderStatus, Payment, PaymentMethod, Product } from "../types";

const configuredUrl =
  process.env.EXPO_PUBLIC_API_URL ||
  (Constants.expoConfig?.extra?.apiUrl as string | undefined);

export const API_URL = configuredUrl || appConfig.apiUrl;

type ApiResult<T> = { data: T };
type Paginated<T> = { items: T[]; pagination: { page: number; limit: number; total: number; totalPages: number } };

export type ProductInput = {
  id?: string;
  title: string;
  category: string;
  priceUsd: number;
  compareAtPriceUsd?: number;
  salePriceUsd?: number;
  sizes: string[];
  colours: string[];
  variants?: Array<{ size: string; colour: string; inventory: number }>;
  rating?: number;
  badge?: string;
  imageUrl: string;
  gallery?: string[];
  description: string;
  deliveryInfo?: string;
  returnsInfo?: string;
  inventory: number;
  active?: boolean;
  inStock?: boolean;
  featured?: boolean;
  newArrival?: boolean;
  bestSeller?: boolean;
};

export type AdminCustomer = AuthUser & {
  createdAt?: string;
};

export type AdminAnalytics = {
  products: number;
  orders: number;
  customers: number;
  reviews: number;
  payments: number;
  refunds: number;
};

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

function isProduct(value: unknown): value is Product {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<Product>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.title === "string" &&
    typeof candidate.category === "string" &&
    typeof candidate.priceUsd === "number"
  );
}

function normalizeProductsResponse(result: Product[] | Paginated<Product> | null | undefined) {
  const list = Array.isArray(result) ? result : Array.isArray(result?.items) ? result.items : [];
  return list.filter(isProduct).map((product) => ({
    ...product,
    sizes: Array.isArray(product.sizes) ? product.sizes : [],
    colours: Array.isArray(product.colours) ? product.colours : [],
    gallery: Array.isArray(product.gallery) ? product.gallery : [],
    reviews: Array.isArray(product.reviews) ? product.reviews : [],
    variants: Array.isArray(product.variants) ? product.variants : [],
    description: product.description || "",
    deliveryInfo: product.deliveryInfo || "Delivery details will be confirmed at checkout.",
    returnsInfo: product.returnsInfo || "Returns information will be confirmed before payment.",
    inventory: typeof product.inventory === "number" ? product.inventory : 0,
    rating: typeof product.rating === "number" ? product.rating : 0,
    badge: product.badge || "Noréa",
    inStock: product.inStock ?? product.inventory > 0,
    featured: Boolean(product.featured),
    newArrival: Boolean(product.newArrival),
    bestSeller: Boolean(product.bestSeller)
  }));
}

export async function signIn(email: string, password: string) {
  const data = await request<{ token: string; user: AuthUser }>(
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
  const data = await request<{ token: string; user: AuthUser }>(
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
  const suffix = query ? `?${query}` : "";
  const result = await request<Product[] | Paginated<Product>>(`/products${suffix}`);
  return normalizeProductsResponse(result);
}

export async function fetchOrders(): Promise<Order[]> {
  const result = await request<Order[] | Paginated<Order>>("/orders/me");
  return Array.isArray(result) ? result : result.items;
}

export async function verifyOrderPayment(orderId: string) {
  return request<{ order: Order; payment: Payment }>(`/payments/${encodeURIComponent(orderId)}/verify`);
}

export async function createOrder(args: {
  items: CartItem[];
  address: Address;
  paymentMethod: PaymentMethod;
}) {
  return request<{ order: Order; payment: Payment; paymentInstructions: string; redirectUrl?: string }>(
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

export async function createVivaPayment(orderId: string) {
  return request<{ order: Order; payment: Payment; paymentInstructions: string; redirectUrl?: string }>(
    "/payments/viva/create",
    {
      method: "POST",
      body: JSON.stringify({ orderId })
    }
  );
}

export async function fetchVivaPaymentStatus(orderId: string) {
  return request<{ order: Order; payment: Payment }>(`/payments/viva/status/${encodeURIComponent(orderId)}`);
}

export async function savePushToken(pushToken: string) {
  return request<{ ok: true }>("/notifications/register", {
    method: "POST",
    body: JSON.stringify({ pushToken })
  });
}

export async function requestAccountDeletion(reason: string) {
  return request<{ ok: true }>("/account/deletion-request", {
    method: "POST",
    body: JSON.stringify({ reason })
  });
}

export async function adminFetchProducts(query = "limit=50") {
  const suffix = query ? `?${query}` : "";
  const result = await request<Product[] | Paginated<Product>>(`/admin/products${suffix}`);
  return normalizeProductsResponse(result);
}

export async function adminCreateProduct(product: ProductInput) {
  const result = await request<Product>("/admin/products", {
    method: "POST",
    body: JSON.stringify(product)
  });
  return normalizeProductsResponse([result])[0] || result;
}

export async function adminUpdateProduct(id: string, product: Partial<ProductInput>) {
  const result = await request<Product>(`/admin/products/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(product)
  });
  return normalizeProductsResponse([result])[0] || result;
}

export async function adminDisableProduct(id: string) {
  const result = await request<Product>(`/admin/products/${encodeURIComponent(id)}`, {
    method: "DELETE"
  });
  return normalizeProductsResponse([result])[0] || result;
}

export async function adminUploadProductImage(id: string, imageUrl: string) {
  const result = await request<Product>(`/admin/products/${encodeURIComponent(id)}/images`, {
    method: "POST",
    body: JSON.stringify({ imageUrl })
  });
  return normalizeProductsResponse([result])[0] || result;
}

export async function adminFetchOrders(query = "limit=50") {
  const suffix = query ? `?${query}` : "";
  const result = await request<Order[] | Paginated<Order>>(`/admin/orders${suffix}`);
  return Array.isArray(result) ? result : result.items;
}

export async function adminUpdateOrderStatus(id: string, status: OrderStatus) {
  return request<Order>(`/admin/orders/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status })
  });
}

export async function adminUpdateOrderDetails(
  id: string,
  payload: { status?: OrderStatus; trackingNumber?: string; deliveryNote?: string }
) {
  return request<Order>(`/admin/orders/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export async function adminFetchCustomers(query = "limit=50") {
  const suffix = query ? `?${query}` : "";
  const result = await request<AdminCustomer[] | Paginated<AdminCustomer>>(`/admin/customers${suffix}`);
  return Array.isArray(result) ? result : result.items;
}

export async function adminFetchAnalytics() {
  return request<AdminAnalytics>("/admin/analytics");
}

export async function adminCreateDiscount(code: string, percentOff: number) {
  return request<{ id: string; code: string; percentOff: number; active: boolean }>("/admin/discounts", {
    method: "POST",
    body: JSON.stringify({ code, percentOff, active: true })
  });
}
