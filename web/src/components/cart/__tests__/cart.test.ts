import { describe, it, expect } from "vitest";
import {
  Product,
  CartItem,
  Coupon,
  Promotion,
  PromotionType,
  DiscountScope,
  CartCalculator,
  CouponValidator,
  CartMergeService,
} from "@zell/shared";

// Setup mock products
const mockProducts: Product[] = [
  {
    id: "p1",
    title: "Product 1",
    slug: "product-1",
    description: "Product 1 description",
    shortDescription: "short",
    basePrice: 5000, // $50.00
    discountPrice: 4000, // $40.00
    currency: "USD",
    mainImage: "p1.jpg",
    variants: [
      {
        sku: "P1-VAR-1",
        price: 4500, // $45.00 (variant override)
        attributes: { size: "M" },
        stockQuantity: 10,
        imageGallery: [],
        isAvailable: true,
      },
      {
        sku: "P1-VAR-2",
        price: 0, // no override
        attributes: { size: "L" },
        stockQuantity: 5,
        imageGallery: [],
        isAvailable: true,
      },
    ],
    categories: ["cat1"],
    tags: [],
    collections: [],
    visibility: "VISIBLE",
    isFeatured: false,
    reviewCount: 0,
    isActive: true,
    status: "ACTIVE",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "p2",
    title: "Product 2",
    slug: "product-2",
    description: "Product 2 description",
    shortDescription: "short",
    basePrice: 3000, // $30.00
    currency: "USD",
    mainImage: "p2.jpg",
    variants: [],
    categories: ["cat2"],
    tags: [],
    collections: [],
    visibility: "VISIBLE",
    isFeatured: false,
    reviewCount: 0,
    isActive: true,
    status: "ACTIVE",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

describe("CartCalculator Pricing Precedence & Calculations", () => {
  it("should calculate totals using pricing precedence correctly", () => {
    const items: CartItem[] = [
      {
        productId: "p1",
        sku: "P1-VAR-1",
        quantity: 2,
        price: 0,
        productSnapshot: {
          title: "Product 1",
          mainImage: "p1.jpg",
          variantAttributes: { size: "M" },
          priceAtAdd: 4500,
          currency: "USD",
        },
      },
      {
        productId: "p1",
        sku: "P1-VAR-2",
        quantity: 1,
        price: 0,
        productSnapshot: {
          title: "Product 1",
          mainImage: "p1.jpg",
          variantAttributes: { size: "L" },
          priceAtAdd: 4000,
          currency: "USD",
        },
      },
    ];

    const result = CartCalculator.calculate(items, mockProducts);

    // Expected:
    // Item 1 (P1-VAR-1): has variant override 4500. Total = 2 * 4500 = 9000
    // Item 2 (P1-VAR-2): variant price is 0, discountPrice is 4000. Total = 1 * 4000 = 4000
    // Subtotal = 9000 + 4000 = 13000 ($130.00)
    // Shipping: Free since subtotal >= $50.00
    // Tax: 10% of 13000 = 1300
    // Total = 13000 + 0 + 1300 = 14300 ($143.00)
    expect(result.subtotal).toBe(13000);
    expect(result.shipping).toBe(0);
    expect(result.tax).toBe(1300);
    expect(result.total).toBe(14300);
    expect(result.itemPrices["P1-VAR-1"]).toBe(4500);
    expect(result.itemPrices["P1-VAR-2"]).toBe(4000);
  });

  it("should calculate shipping fees correctly if subtotal is below free-shipping limit", () => {
    const items: CartItem[] = [
      {
        productId: "p2",
        sku: "P2-SKU",
        quantity: 1,
        price: 0,
        productSnapshot: {
          title: "Product 2",
          mainImage: "p2.jpg",
          variantAttributes: {},
          priceAtAdd: 3000,
          currency: "USD",
        },
      },
    ];

    const result = CartCalculator.calculate(items, mockProducts);

    // Subtotal: 1 * 3000 = 3000 ($30.00)
    // Shipping: $10.00 (1000 cents) since subtotal < $50.00
    // Tax: 10% of 3000 = 300
    // Total = 3000 + 1000 + 300 = 4300 ($43.00)
    expect(result.subtotal).toBe(3000);
    expect(result.shipping).toBe(1000);
    expect(result.tax).toBe(300);
    expect(result.total).toBe(4300);
  });
});

describe("CouponValidator Expiration & Limit Validations", () => {
  const mockCoupon: Coupon = {
    id: "c1",
    promoId: "promo1",
    code: "SAVE10",
    maxUses: 100,
    usedCount: 10,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPromotion: Promotion = {
    id: "promo1",
    title: "10% Off",
    code: "SAVE10",
    type: PromotionType.PERCENTAGE,
    value: 10,
    scope: DiscountScope.ORDER_SUBTOTAL,
    targetIds: [],
    startDate: new Date("2026-01-01"),
    endDate: new Date("2026-12-31"),
    minPurchaseAmount: 5000, // $50.00
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it("should validate active coupon successfully", () => {
    const result = CouponValidator.validate(
      mockCoupon,
      mockPromotion,
      6000,
      new Date("2026-06-01")
    );
    expect(result.isValid).toBe(true);
    expect(result.discountAmount).toBe(600); // 10% of 6000
  });

  it("should reject expired coupons", () => {
    const result = CouponValidator.validate(
      mockCoupon,
      mockPromotion,
      6000,
      new Date("2027-01-01")
    );
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("Coupon has expired");
  });

  it("should reject coupons when subtotal is below minimum purchase amount", () => {
    const result = CouponValidator.validate(
      mockCoupon,
      mockPromotion,
      4000,
      new Date("2026-06-01")
    );
    expect(result.isValid).toBe(false);
    expect(result.error).toContain("Order subtotal must be at least");
  });

  it("should reject coupons that reached usage limits", () => {
    const fullyUsedCoupon = { ...mockCoupon, usedCount: 100 };
    const result = CouponValidator.validate(
      fullyUsedCoupon,
      mockPromotion,
      6000,
      new Date("2026-06-01")
    );
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("Coupon usage limit has been reached");
  });
});

describe("CartMergeService Deduplication & Inventory Capping", () => {
  const guestItems: CartItem[] = [
    {
      productId: "p1",
      sku: "P1-VAR-1",
      quantity: 5,
      price: 4500,
      productSnapshot: {
        title: "Item 1",
        mainImage: "",
        variantAttributes: {},
        priceAtAdd: 4500,
        currency: "USD",
      },
    },
    {
      productId: "p2",
      sku: "P2-SKU",
      quantity: 2,
      price: 3000,
      productSnapshot: {
        title: "Item 2",
        mainImage: "",
        variantAttributes: {},
        priceAtAdd: 3000,
        currency: "USD",
      },
    },
  ];

  const userItems: CartItem[] = [
    {
      productId: "p1",
      sku: "P1-VAR-1",
      quantity: 3,
      price: 4500,
      productSnapshot: {
        title: "Item 1",
        mainImage: "",
        variantAttributes: {},
        priceAtAdd: 4500,
        currency: "USD",
      },
    },
  ];

  it("should sum quantities for duplicates and cap quantities according to inventory availability", () => {
    // Inventory limits: SKU P1-VAR-1 has 6 left, SKU P2-SKU has 10 left
    const inventoryAvailability = {
      "P1-VAR-1": 6,
      "P2-SKU": 10,
    };

    const merged = CartMergeService.merge(guestItems, userItems, inventoryAvailability);

    // SKU P1-VAR-1: Guest(5) + User(3) = 8. Stock limit is 6. Capped at 6.
    // SKU P2-SKU: Guest(2) + User(0) = 2. Stock limit is 10. Remains 2.
    expect(merged).toHaveLength(2);

    const item1 = merged.find((i) => i.sku === "P1-VAR-1");
    const item2 = merged.find((i) => i.sku === "P2-SKU");

    expect(item1?.quantity).toBe(6);
    expect(item2?.quantity).toBe(2);
  });

  it("should omit items if inventory stock level is zero", () => {
    const inventoryAvailability = {
      "P1-VAR-1": 0,
      "P2-SKU": 5,
    };

    const merged = CartMergeService.merge(guestItems, userItems, inventoryAvailability);

    // SKU P1-VAR-1: Capped at 0 (removed from cart).
    // SKU P2-SKU: Capped at 2.
    expect(merged).toHaveLength(1);
    expect(merged[0].sku).toBe("P2-SKU");
    expect(merged[0].quantity).toBe(2);
  });
});
