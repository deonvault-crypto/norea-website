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
  | "Packed"
  | "Shipped"
  | "Out for Delivery"
  | "Delivered";

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
  sizes: string[];
  colours: string[];
  rating: number;
  reviews: Review[];
  badge: string;
  imageUrl: string;
  gallery: string[];
  description: string;
  deliveryInfo: string;
  returnsInfo: string;
  inventory: number;
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
  items: CartItem[];
  paymentMethod: PaymentMethod;
  createdAt: string;
  trackingNumber?: string;
};
