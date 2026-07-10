import {
  Role,
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  ShipmentStatus,
  PromotionType,
  DiscountScope,
  NotificationType,
} from "../enums";

export interface User {
  id: string;
  email: string;
  role: Role;
  firstName: string;
  lastName: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Address {
  id: string;
  userId: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  label?: string; // e.g., "Home", "Work"
}

export interface ProductVariant {
  sku: string;
  price: number; // in cents
  attributes: Record<string, string>; // e.g., { "size": "M", "color": "Blue" }
  stockQuantity: number;
  imageGallery: string[];
}

export interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  basePrice: number; // in cents
  mainImage: string;
  variants: ProductVariant[];
  categories: string[]; // Category IDs
  rating?: number;
  reviewCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string; // Self-reference for category nesting
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CartItem {
  productId: string;
  sku: string;
  quantity: number;
  price: number; // in cents
  title: string;
  attributes?: Record<string, string>;
}

export interface Cart {
  id: string;
  userId?: string; // Optional for Guest/Anonymous Carts
  items: CartItem[];
  subtotal: number; // in cents
  tax: number; // in cents
  shipping: number; // in cents
  total: number; // in cents
  promoCodesApplied: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WishlistItem {
  productId: string;
  addedAt: Date;
}

export interface Wishlist {
  id: string;
  userId: string;
  items: WishlistItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  productId: string;
  sku: string;
  quantity: number;
  price: number; // in cents
  title: string;
  attributes: Record<string, string>;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  status: OrderStatus;
  subtotal: number; // in cents
  tax: number; // in cents
  shipping: number; // in cents
  total: number; // in cents
  promoCodeApplied?: string;
  billingAddress: Address;
  shippingAddress: Address;
  paymentStatus: PaymentStatus;
  shipmentStatus: ShipmentStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface Review {
  id: string;
  userId: string;
  productId: string;
  userName: string;
  rating: number; // 1 to 5
  comment: string;
  title?: string;
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Promotion {
  id: string;
  title: string;
  description?: string;
  code: string;
  type: PromotionType;
  value: number; // Percentage or fixed cents
  scope: DiscountScope;
  targetIds: string[]; // Linked products, categories, etc.
  startDate: Date;
  endDate: Date;
  minPurchaseAmount?: number; // in cents
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Coupon {
  id: string;
  promoId: string;
  code: string;
  maxUses: number;
  usedCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Inventory {
  sku: string;
  productId: string;
  quantity: number;
  reservedQuantity: number;
  reorderPoint: number;
  lastUpdated: Date;
}

export interface Payment {
  id: string;
  orderId: string;
  userId: string;
  amount: number; // in cents
  currency: string;
  status: PaymentStatus;
  method: PaymentMethod;
  transactionId: string;
  receiptUrl?: string;
  errorDetails?: string;
  createdAt: Date;
}

export interface ShipmentStatusHistory {
  status: ShipmentStatus;
  updatedAt: Date;
  details?: string;
}

export interface Shipment {
  id: string;
  orderId: string;
  trackingNumber: string;
  carrier: string;
  status: ShipmentStatus;
  estimatedDelivery?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  statusHistory: ShipmentStatusHistory[];
  createdAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  type: NotificationType;
  actionUrl?: string;
  createdAt: Date;
}
