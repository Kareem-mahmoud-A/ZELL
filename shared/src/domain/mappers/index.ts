import {
  Inventory,
  Product,
  Cart,
  Wishlist,
  Coupon,
  Promotion,
  InventoryReservation,
} from "../types";
import { InventoryStatus } from "../enums";

export interface Mapper<Domain, Persistence> {
  toDomain(raw: Persistence): Domain;
  toPersistence(domain: Domain): Persistence;
}

export class DateMapper {
  public static toDate(value: any): Date {
    if (value instanceof Date) return value;
    if (value && typeof value.toDate === "function") return value.toDate(); // Handle Firestore Timestamp
    if (value && value._seconds !== undefined) return new Date(value._seconds * 1000); // Handle JSON serialization format
    if (typeof value === "string" || typeof value === "number") return new Date(value);
    return new Date();
  }
}

export class UserMapper {
  public static toDomain(raw: any): any {
    return {
      id: raw.id,
      email: raw.email,
      role: raw.role,
      firstName: raw.firstName,
      lastName: raw.lastName,
      phone: raw.phone,
      createdAt: DateMapper.toDate(raw.createdAt),
      updatedAt: DateMapper.toDate(raw.updatedAt),
    };
  }

  public static toPersistence(domain: any): any {
    return {
      id: domain.id,
      email: domain.email,
      role: domain.role,
      firstName: domain.firstName,
      lastName: domain.lastName,
      phone: domain.phone,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }
}

export class ProductMapper {
  public static toDomain(raw: Record<string, unknown>): Product {
    const variants = (raw.variants as Record<string, unknown>[] | undefined) ?? [];
    return {
      id: raw.id as string,
      title: raw.title as string,
      slug: raw.slug as string,
      description: raw.description as string,
      shortDescription: (raw.shortDescription as string) || "",
      basePrice: raw.basePrice as number,
      compareAtPrice: raw.compareAtPrice as number | undefined,
      discountPrice: raw.discountPrice as number | undefined,
      currency: (raw.currency as string) || "USD",
      mainImage: raw.mainImage as string,
      variants: variants.map((v) => ({
        sku: v.sku as string,
        price: v.price as number,
        attributes: (v.attributes as Record<string, string>) || {},
        stockQuantity: v.stockQuantity as number,
        imageGallery: (v.imageGallery as string[]) || [],
        isAvailable: v.isAvailable !== undefined ? (v.isAvailable as boolean) : true,
      })),
      categories: (raw.categories as string[]) || [],
      tags: (raw.tags as string[]) || [],
      collections: (raw.collections as string[]) || [],
      visibility: (raw.visibility as Product["visibility"]) || "VISIBLE",
      isFeatured: raw.isFeatured !== undefined ? (raw.isFeatured as boolean) : false,
      brandId: raw.brandId as string | undefined,
      publishedAt: raw.publishedAt ? DateMapper.toDate(raw.publishedAt) : undefined,
      rating: raw.rating as number | undefined,
      reviewCount: (raw.reviewCount as number) || 0,
      isActive: raw.isActive !== undefined ? (raw.isActive as boolean) : true,
      status: (raw.status as Product["status"]) || "ACTIVE",
      seoTitle: raw.seoTitle as string | undefined,
      seoDescription: raw.seoDescription as string | undefined,
      createdAt: DateMapper.toDate(raw.createdAt),
      updatedAt: DateMapper.toDate(raw.updatedAt),
    };
  }

  public static toPersistence(domain: Product): Record<string, unknown> {
    return {
      id: domain.id,
      title: domain.title,
      slug: domain.slug,
      description: domain.description,
      shortDescription: domain.shortDescription,
      basePrice: domain.basePrice,
      compareAtPrice: domain.compareAtPrice,
      discountPrice: domain.discountPrice,
      currency: domain.currency,
      mainImage: domain.mainImage,
      variants: domain.variants.map((v) => ({
        sku: v.sku,
        price: v.price,
        attributes: v.attributes,
        stockQuantity: v.stockQuantity,
        imageGallery: v.imageGallery,
        isAvailable: v.isAvailable,
      })),
      categories: domain.categories,
      tags: domain.tags,
      collections: domain.collections,
      visibility: domain.visibility,
      isFeatured: domain.isFeatured,
      brandId: domain.brandId,
      publishedAt: domain.publishedAt,
      rating: domain.rating,
      reviewCount: domain.reviewCount,
      isActive: domain.isActive,
      status: domain.status,
      seoTitle: domain.seoTitle,
      seoDescription: domain.seoDescription,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }
}

export class BrandMapper {
  public static toDomain(raw: any): any {
    return {
      id: raw.id,
      name: raw.name,
      slug: raw.slug,
      description: raw.description,
      logo: raw.logo,
      seoTitle: raw.seoTitle,
      seoDescription: raw.seoDescription,
      createdAt: DateMapper.toDate(raw.createdAt),
      updatedAt: DateMapper.toDate(raw.updatedAt),
    };
  }

  public static toPersistence(domain: any): any {
    return {
      id: domain.id,
      name: domain.name,
      slug: domain.slug,
      description: domain.description,
      logo: domain.logo,
      seoTitle: domain.seoTitle,
      seoDescription: domain.seoDescription,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }
}

export class CategoryMapper {
  public static toDomain(raw: any): any {
    return {
      id: raw.id,
      name: raw.name,
      slug: raw.slug,
      description: raw.description,
      parentId: raw.parentId,
      image: raw.image,
      isActive: raw.isActive !== undefined ? raw.isActive : true,
      seoTitle: raw.seoTitle,
      seoDescription: raw.seoDescription,
      createdAt: DateMapper.toDate(raw.createdAt),
      updatedAt: DateMapper.toDate(raw.updatedAt),
    };
  }

  public static toPersistence(domain: any): any {
    return {
      id: domain.id,
      name: domain.name,
      slug: domain.slug,
      description: domain.description,
      parentId: domain.parentId,
      image: domain.image,
      isActive: domain.isActive,
      seoTitle: domain.seoTitle,
      seoDescription: domain.seoDescription,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }
}

export class StockMovementMapper {
  public static toDomain(raw: any): any {
    return {
      id: raw.id,
      sku: raw.sku,
      type: raw.type,
      quantity: raw.quantity,
      reason: raw.reason,
      createdBy: raw.createdBy,
      timestamp: DateMapper.toDate(raw.timestamp),
    };
  }

  public static toPersistence(domain: any): any {
    return {
      id: domain.id,
      sku: domain.sku,
      type: domain.type,
      quantity: domain.quantity,
      reason: domain.reason,
      createdBy: domain.createdBy,
      timestamp: domain.timestamp,
    };
  }
}

export class InventoryMapper {
  public static toDomain(raw: Record<string, unknown>): Inventory {
    return {
      sku: raw.sku as string,
      productId: raw.productId as string,
      quantity: raw.quantity as number,
      reservedQuantity: raw.reservedQuantity as number,
      reorderPoint: raw.reorderPoint as number,
      lowStockThreshold: (raw.lowStockThreshold as number) || 0,
      status: (raw.status as InventoryStatus) || InventoryStatus.IN_STOCK,
      // movements live in subcollection — not included here
      lastUpdated: DateMapper.toDate(raw.lastUpdated),
    };
  }

  public static toPersistence(domain: Inventory): Record<string, unknown> {
    return {
      sku: domain.sku,
      productId: domain.productId,
      quantity: domain.quantity,
      reservedQuantity: domain.reservedQuantity,
      reorderPoint: domain.reorderPoint,
      lowStockThreshold: domain.lowStockThreshold,
      status: domain.status,
      // movements written separately to subcollection
      lastUpdated: domain.lastUpdated,
    };
  }
}

export class OrderMapper {
  public static toDomain(raw: any): any {
    return {
      id: raw.id,
      userId: raw.userId,
      items: (raw.items || []).map((i: any) => ({
        productId: i.productId,
        sku: i.sku,
        quantity: i.quantity,
        price: i.price,
        title: i.title,
        attributes: i.attributes || {},
      })),
      status: raw.status,
      subtotal: raw.subtotal,
      tax: raw.tax,
      shipping: raw.shipping,
      total: raw.total,
      promoCodeApplied: raw.promoCodeApplied,
      billingAddress: raw.billingAddress,
      shippingAddress: raw.shippingAddress,
      paymentStatus: raw.paymentStatus,
      shipmentStatus: raw.shipmentStatus,
      createdAt: DateMapper.toDate(raw.createdAt),
      updatedAt: DateMapper.toDate(raw.updatedAt),
    };
  }

  public static toPersistence(domain: any): any {
    return {
      id: domain.id,
      userId: domain.userId,
      items: domain.items.map((i: any) => ({
        productId: i.productId,
        sku: i.sku,
        quantity: i.quantity,
        price: i.price,
        title: i.title,
        attributes: i.attributes,
      })),
      status: domain.status,
      subtotal: domain.subtotal,
      tax: domain.tax,
      shipping: domain.shipping,
      total: domain.total,
      promoCodeApplied: domain.promoCodeApplied,
      billingAddress: domain.billingAddress,
      shippingAddress: domain.shippingAddress,
      paymentStatus: domain.paymentStatus,
      shipmentStatus: domain.shipmentStatus,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }
}

export class CartMapper {
  public static toDomain(raw: Record<string, unknown>): Cart {
    const items = (raw.items as Record<string, unknown>[] | undefined) ?? [];
    return {
      id: raw.id as string,
      userId: raw.userId as string | undefined,
      guestTokenHash: raw.guestTokenHash as string | undefined,
      items: items.map((i) => ({
        productId: i.productId as string,
        sku: i.sku as string,
        quantity: i.quantity as number,
        price: i.price as number,
        productSnapshot: {
          title: (i.productSnapshot as Record<string, unknown>)?.title as string,
          mainImage: (i.productSnapshot as Record<string, unknown>)?.mainImage as string,
          variantAttributes:
            ((i.productSnapshot as Record<string, unknown>)?.variantAttributes as Record<
              string,
              string
            >) || {},
          priceAtAdd: (i.productSnapshot as Record<string, unknown>)?.priceAtAdd as number,
          currency: ((i.productSnapshot as Record<string, unknown>)?.currency as string) || "USD",
          brandName: (i.productSnapshot as Record<string, unknown>)?.brandName as
            string | undefined,
        },
      })),
      subtotal: raw.subtotal as number,
      tax: raw.tax as number,
      shipping: raw.shipping as number,
      total: raw.total as number,
      promoCodesApplied: (raw.promoCodesApplied as string[]) || [],
      createdAt: DateMapper.toDate(raw.createdAt),
      updatedAt: DateMapper.toDate(raw.updatedAt),
    };
  }

  public static toPersistence(domain: Cart): Record<string, unknown> {
    return {
      id: domain.id,
      userId: domain.userId,
      guestTokenHash: domain.guestTokenHash,
      items: domain.items.map((i) => ({
        productId: i.productId,
        sku: i.sku,
        quantity: i.quantity,
        price: i.price,
        productSnapshot: {
          title: i.productSnapshot.title,
          mainImage: i.productSnapshot.mainImage,
          variantAttributes: i.productSnapshot.variantAttributes,
          priceAtAdd: i.productSnapshot.priceAtAdd,
          currency: i.productSnapshot.currency,
          brandName: i.productSnapshot.brandName,
        },
      })),
      subtotal: domain.subtotal,
      tax: domain.tax,
      shipping: domain.shipping,
      total: domain.total,
      promoCodesApplied: domain.promoCodesApplied,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }
}

export class WishlistMapper {
  public static toDomain(raw: Record<string, unknown>): Wishlist {
    const items = (raw.items as Record<string, unknown>[] | undefined) ?? [];
    return {
      id: raw.id as string,
      userId: raw.userId as string,
      items: items.map((i) => ({
        productId: i.productId as string,
        sku: i.sku as string,
        addedAt: DateMapper.toDate(i.addedAt),
        attributes: (i.attributes as Record<string, string>) || undefined,
      })),
      createdAt: DateMapper.toDate(raw.createdAt),
      updatedAt: DateMapper.toDate(raw.updatedAt),
    };
  }

  public static toPersistence(domain: Wishlist): Record<string, unknown> {
    return {
      id: domain.id,
      userId: domain.userId,
      items: domain.items.map((i) => ({
        productId: i.productId,
        sku: i.sku,
        addedAt: i.addedAt,
        attributes: i.attributes,
      })),
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }
}

export class CouponMapper {
  public static toDomain(raw: Record<string, unknown>): Coupon {
    return {
      id: raw.id as string,
      promoId: raw.promoId as string,
      code: raw.code as string,
      maxUses: raw.maxUses as number,
      usedCount: raw.usedCount as number,
      isActive: raw.isActive as boolean,
      createdAt: DateMapper.toDate(raw.createdAt),
      updatedAt: DateMapper.toDate(raw.updatedAt),
    };
  }

  public static toPersistence(domain: Coupon): Record<string, unknown> {
    return {
      id: domain.id,
      promoId: domain.promoId,
      code: domain.code,
      maxUses: domain.maxUses,
      usedCount: domain.usedCount,
      isActive: domain.isActive,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }
}

export class PromotionMapper {
  public static toDomain(raw: Record<string, unknown>): Promotion {
    return {
      id: raw.id as string,
      title: raw.title as string,
      description: raw.description as string | undefined,
      code: raw.code as string,
      type: raw.type as any, // Cast to PromotionType
      value: raw.value as number,
      scope: raw.scope as any, // Cast to DiscountScope
      targetIds: (raw.targetIds as string[]) || [],
      startDate: DateMapper.toDate(raw.startDate),
      endDate: DateMapper.toDate(raw.endDate),
      minPurchaseAmount: raw.minPurchaseAmount as number | undefined,
      isActive: raw.isActive as boolean,
      createdAt: DateMapper.toDate(raw.createdAt),
      updatedAt: DateMapper.toDate(raw.updatedAt),
    };
  }

  public static toPersistence(domain: Promotion): Record<string, unknown> {
    return {
      id: domain.id,
      title: domain.title,
      description: domain.description,
      code: domain.code,
      type: domain.type,
      value: domain.value,
      scope: domain.scope,
      targetIds: domain.targetIds,
      startDate: domain.startDate,
      endDate: domain.endDate,
      minPurchaseAmount: domain.minPurchaseAmount,
      isActive: domain.isActive,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }
}

export class InventoryReservationMapper {
  public static toDomain(raw: Record<string, unknown>): InventoryReservation {
    return {
      id: raw.id as string,
      sku: raw.sku as string,
      quantity: raw.quantity as number,
      expiresAt: DateMapper.toDate(raw.expiresAt),
      status: raw.status as InventoryReservation["status"],
      createdAt: DateMapper.toDate(raw.createdAt),
    };
  }

  public static toPersistence(domain: InventoryReservation): Record<string, unknown> {
    return {
      id: domain.id,
      sku: domain.sku,
      quantity: domain.quantity,
      expiresAt: domain.expiresAt,
      status: domain.status,
      createdAt: domain.createdAt,
    };
  }
}
