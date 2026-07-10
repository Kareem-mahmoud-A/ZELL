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
      updatedAt: DateMapper.toDate(raw.updatedAt)
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
      updatedAt: domain.updatedAt
    };
  }
}

export class ProductMapper {
  public static toDomain(raw: any): any {
    return {
      id: raw.id,
      title: raw.title,
      slug: raw.slug,
      description: raw.description,
      basePrice: raw.basePrice,
      mainImage: raw.mainImage,
      variants: (raw.variants || []).map((v: any) => ({
        sku: v.sku,
        price: v.price,
        attributes: v.attributes || {},
        stockQuantity: v.stockQuantity,
        imageGallery: v.imageGallery || []
      })),
      categories: raw.categories || [],
      rating: raw.rating,
      reviewCount: raw.reviewCount || 0,
      isActive: raw.isActive !== undefined ? raw.isActive : true,
      createdAt: DateMapper.toDate(raw.createdAt),
      updatedAt: DateMapper.toDate(raw.updatedAt)
    };
  }

  public static toPersistence(domain: any): any {
    return {
      id: domain.id,
      title: domain.title,
      slug: domain.slug,
      description: domain.description,
      basePrice: domain.basePrice,
      mainImage: domain.mainImage,
      variants: domain.variants.map((v: any) => ({
        sku: v.sku,
        price: v.price,
        attributes: v.attributes,
        stockQuantity: v.stockQuantity,
        imageGallery: v.imageGallery
      })),
      categories: domain.categories,
      rating: domain.rating,
      reviewCount: domain.reviewCount,
      isActive: domain.isActive,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt
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
        attributes: i.attributes || {}
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
      updatedAt: DateMapper.toDate(raw.updatedAt)
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
        attributes: i.attributes
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
      updatedAt: domain.updatedAt
    };
  }
}
