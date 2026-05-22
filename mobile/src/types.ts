export type Category =
  | "Leggings"
  | "Sports Bras"
  | "Hoodies"
  | "Shorts"
  | "Jackets"
  | "Gym Sets"
  | "Training Wear"
  | "Activewear";

export type PaymentMethod =
  | "VIVA"
  | "PAYNOW"
  | "ECOCASH"
  | "ONEMONEY"
  | "ZIPIT"
  | "VISA"
  | "MASTERCARD"
  | "BANK_TRANSFER";

export type OrderStatus =
  | "Pending"
  | "Paid"
  | "Processing"
  | "Packed"
  | "Shipped"
  | "Out for Delivery"
  | "Delivered"
  | "Cancelled"
  | "Refunded";

export type UserRole = "customer" | "admin";

export type AuthUser = {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  role?: UserRole | string;
};

export type Review = {
  id: string;
  author: string;
  rating: number;
  body: string;
  createdAt: string;
};

export type Product = {
  id: string;
  title: string;
  category: Category;
  priceUsd: number;
  compareAtPriceUsd?: number;
  salePriceUsd?: number;
  sizes: string[];
  colours: string[];
  variants?: Array<{ size: string; colour: string; inventory: number }>;
  rating: number;
  reviews: Review[];
  badge: string;
  imageUrl: string;
  gallery: string[];
  description: string;
  deliveryInfo: string;
  returnsInfo: string;
  inventory: number;
  active?: boolean;
  inStock?: boolean;
  featured?: boolean;
  newArrival?: boolean;
  bestSeller?: boolean;
};

export type CartItem = {
  product: Product;
  quantity: number;
  size: string;
  colour: string;
};

export type Address = {
  id: string;
  name: string;
  phone: string;
  line1: string;
  city: string;
  country: string;
};

export type Order = {
  id: string;
  status: OrderStatus;
  totalUsd: number;
  paymentAmountPln?: number;
  paymentExchangeRate?: number;
  paymentOrderCode?: string;
  paymentTransactionId?: string;
  paymentProviderReference?: string;
  paymentProvider?: string;
  items: CartItem[];
  paymentMethod: PaymentMethod;
  paymentStatus?: string;
  createdAt: string;
  trackingNumber?: string;
  deliveryNote?: string;
  customer?: AuthUser;
  address?: Address;
};

export type Payment = {
  id: string;
  orderId: string;
  method: PaymentMethod;
  provider: string;
  amountUsd: number;
  amountPln?: number;
  exchangeRate?: number;
  settlementCurrency?: string;
  orderCode?: string;
  transactionId?: string;
  providerReference?: string;
  status: string;
  refundStatus?: string;
  redirectUrl?: string;
  instructions?: string;
  createdAt?: string;
  updatedAt?: string;
};
