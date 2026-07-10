import { z } from "zod";
import {
  Role,
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  ShipmentStatus,
  PromotionType,
  DiscountScope,
  NotificationType,
  InventoryStatus,
  StockMovementType,
} from "../enums";

// User Schemas
export const UserRoleSchema = z.nativeEnum(Role);

export const UserSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  role: UserRoleSchema,
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateUserDtoSchema = UserSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateUserDtoSchema = CreateUserDtoSchema.partial();

// Address Schemas
export const AddressSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  street: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  postalCode: z.string().min(1),
  country: z.string().min(1),
  isDefault: z.boolean(),
  label: z.string().optional(),
});

export const CreateAddressDtoSchema = AddressSchema.omit({
  id: true,
  userId: true,
});

// ProductVariant Schema
export const ProductVariantSchema = z.object({
  sku: z.string().regex(/^[A-Z0-9]{3,5}-[A-Z0-9]{3,5}-[A-Z0-9]{2,5}(-[A-Z0-9]{2,5})?$/),
  price: z.number().int().nonnegative(),
  attributes: z.record(z.string(), z.string()),
  stockQuantity: z.number().int().nonnegative(),
  imageGallery: z.array(z.string()),
  isAvailable: z.boolean(),
});

// Product Schema
export const ProductSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().min(1),
  shortDescription: z.string().min(1),
  basePrice: z.number().int().nonnegative(),
  compareAtPrice: z.number().int().nonnegative().optional(),
  discountPrice: z.number().int().nonnegative().optional(),
  currency: z.string().min(3).max(3),
  mainImage: z.string(),
  variants: z.array(ProductVariantSchema).min(1),
  categories: z.array(z.string().min(1)),
  tags: z.array(z.string()),
  collections: z.array(z.string()),
  visibility: z.enum(["HIDDEN", "VISIBLE", "SEARCH_ONLY"]),
  isFeatured: z.boolean(),
  brandId: z.string().min(1).optional(),
  publishedAt: z.date().optional(),
  rating: z.number().min(1).max(5).optional(),
  reviewCount: z.number().int().nonnegative(),
  isActive: z.boolean(),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateProductDtoSchema = ProductSchema.omit({
  id: true,
  rating: true,
  reviewCount: true,
  createdAt: true,
  updatedAt: true,
});

// Category Schema
export const CategorySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  parentId: z.string().optional(),
  image: z.string().optional(),
  isActive: z.boolean(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const BrandSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  logo: z.string().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const StockMovementSchema = z.object({
  id: z.string().min(1),
  sku: z.string().min(1),
  type: z.nativeEnum(StockMovementType),
  quantity: z.number().int().nonnegative(),
  reason: z.string().optional(),
  createdBy: z.string().min(1),
  timestamp: z.date(),
});

// Cart Schemas
export const CartItemSchema = z.object({
  productId: z.string().min(1),
  sku: z.string().min(1),
  quantity: z.number().int().positive(),
  price: z.number().int().nonnegative(),
  title: z.string().min(1),
  attributes: z.record(z.string(), z.string()).optional(),
});

export const CartSchema = z.object({
  id: z.string().min(1),
  userId: z.string().optional(),
  items: z.array(CartItemSchema),
  subtotal: z.number().int().nonnegative(),
  tax: z.number().int().nonnegative(),
  shipping: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
  promoCodesApplied: z.array(z.string()),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Order Schemas
export const OrderItemSchema = z.object({
  productId: z.string().min(1),
  sku: z.string().min(1),
  quantity: z.number().int().positive(),
  price: z.number().int().nonnegative(),
  title: z.string().min(1),
  attributes: z.record(z.string(), z.string()),
});

export const OrderSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  items: z.array(OrderItemSchema).min(1),
  status: z.nativeEnum(OrderStatus),
  subtotal: z.number().int().nonnegative(),
  tax: z.number().int().nonnegative(),
  shipping: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
  promoCodeApplied: z.string().optional(),
  billingAddress: AddressSchema,
  shippingAddress: AddressSchema,
  paymentStatus: z.nativeEnum(PaymentStatus),
  shipmentStatus: z.nativeEnum(ShipmentStatus),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Review Schema
export const ReviewSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  productId: z.string().min(1),
  userName: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(1),
  title: z.string().optional(),
  isVerifiedPurchase: z.boolean(),
  helpfulCount: z.number().int().nonnegative(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Promotion Schema
export const PromotionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  code: z.string().min(1),
  type: z.nativeEnum(PromotionType),
  value: z.number().positive(),
  scope: z.nativeEnum(DiscountScope),
  targetIds: z.array(z.string()),
  startDate: z.date(),
  endDate: z.date(),
  minPurchaseAmount: z.number().int().nonnegative().optional(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Coupon Schema
export const CouponSchema = z.object({
  id: z.string().min(1),
  promoId: z.string().min(1),
  code: z.string().min(1),
  maxUses: z.number().int().positive(),
  usedCount: z.number().int().nonnegative(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Inventory Schema
export const InventorySchema = z.object({
  sku: z.string().min(1),
  productId: z.string().min(1),
  quantity: z.number().int().nonnegative(),
  reservedQuantity: z.number().int().nonnegative(),
  reorderPoint: z.number().int().nonnegative(),
  lowStockThreshold: z.number().int().nonnegative(),
  status: z.nativeEnum(InventoryStatus),
  movements: z.array(StockMovementSchema),
  lastUpdated: z.date(),
});

// Payment Schema
export const PaymentSchema = z.object({
  id: z.string().min(1),
  orderId: z.string().min(1),
  userId: z.string().min(1),
  amount: z.number().int().nonnegative(),
  currency: z.string().min(3).max(3),
  status: z.nativeEnum(PaymentStatus),
  method: z.nativeEnum(PaymentMethod),
  transactionId: z.string().min(1),
  receiptUrl: z.string().optional(),
  errorDetails: z.string().optional(),
  createdAt: z.date(),
});

// Shipment Schema
export const ShipmentStatusHistorySchema = z.object({
  status: z.nativeEnum(ShipmentStatus),
  updatedAt: z.date(),
  details: z.string().optional(),
});

export const ShipmentSchema = z.object({
  id: z.string().min(1),
  orderId: z.string().min(1),
  trackingNumber: z.string().min(1),
  carrier: z.string().min(1),
  status: z.nativeEnum(ShipmentStatus),
  estimatedDelivery: z.date().optional(),
  shippedAt: z.date().optional(),
  deliveredAt: z.date().optional(),
  statusHistory: z.array(ShipmentStatusHistorySchema),
  createdAt: z.date(),
});

// Notification Schema
export const NotificationSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  title: z.string().min(1),
  message: z.string().min(1),
  isRead: z.boolean(),
  type: z.nativeEnum(NotificationType),
  actionUrl: z.string().optional(),
  createdAt: z.date(),
});

// DTO Inferred Types
export type CreateUserDto = z.infer<typeof CreateUserDtoSchema>;
export type UpdateUserDto = z.infer<typeof UpdateUserDtoSchema>;
export type CreateAddressDto = z.infer<typeof CreateAddressDtoSchema>;
export type CreateProductDto = z.infer<typeof CreateProductDtoSchema>;
