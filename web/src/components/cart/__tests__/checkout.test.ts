import { describe, it, expect } from "vitest";
import {
  OrderStatus,
  OrderStateMachine,
  FlatTaxStrategy,
  USTaxStrategy,
  Money,
  OrderMapper,
  Order,
  PaymentStatus,
  ShipmentStatus,
  ValidationError,
} from "@zell/shared";

describe("OrderStateMachine Status Transitions", () => {
  it("should permit legal state transitions", () => {
    // PENDING -> CONFIRMED -> PAID -> PROCESSING -> SHIPPED -> DELIVERED -> REFUNDED
    expect(OrderStateMachine.canTransition(OrderStatus.PENDING, OrderStatus.CONFIRMED)).toBe(true);
    expect(OrderStateMachine.canTransition(OrderStatus.CONFIRMED, OrderStatus.PAID)).toBe(true);
    expect(OrderStateMachine.canTransition(OrderStatus.PAID, OrderStatus.PROCESSING)).toBe(true);
    expect(OrderStateMachine.canTransition(OrderStatus.PROCESSING, OrderStatus.SHIPPED)).toBe(true);
    expect(OrderStateMachine.canTransition(OrderStatus.SHIPPED, OrderStatus.DELIVERED)).toBe(true);
    expect(OrderStateMachine.canTransition(OrderStatus.DELIVERED, OrderStatus.REFUNDED)).toBe(true);

    // Cancellations
    expect(OrderStateMachine.canTransition(OrderStatus.PENDING, OrderStatus.CANCELLED)).toBe(true);
    expect(OrderStateMachine.canTransition(OrderStatus.CONFIRMED, OrderStatus.CANCELLED)).toBe(
      true
    );
  });

  it("should throw ValidationError on illegal transitions", () => {
    // Cannot skip confirmed/paid to ship
    expect(() =>
      OrderStateMachine.validateTransition(OrderStatus.PENDING, OrderStatus.SHIPPED)
    ).toThrow(ValidationError);

    // Cancelled orders cannot be confirmed
    expect(() =>
      OrderStateMachine.validateTransition(OrderStatus.CANCELLED, OrderStatus.CONFIRMED)
    ).toThrow(ValidationError);

    // Delivered orders cannot be cancelled
    expect(() =>
      OrderStateMachine.validateTransition(OrderStatus.DELIVERED, OrderStatus.CANCELLED)
    ).toThrow(ValidationError);
  });
});

describe("TaxStrategy Pipeline Calculations", () => {
  const subtotal = new Money(5000); // $50.00
  const shipping = new Money(1000); // $10.00

  it("should calculate flat rate tax (10%) correctly", () => {
    const strategy = new FlatTaxStrategy();
    const tax = strategy.calculateTax(subtotal, shipping, "NY");
    expect(tax.amountInCents).toBe(500); // 10% of 5000 = $5.00
  });

  it("should calculate California state tax (8.25%) using USTaxStrategy", () => {
    const strategy = new USTaxStrategy();
    const tax = strategy.calculateTax(subtotal, shipping, "CA");
    expect(tax.amountInCents).toBe(413); // 8.25% of 5000 = 412.5 (rounded to 413)
  });

  it("should calculate standard state tax (5%) for non-CA US state using USTaxStrategy", () => {
    const strategy = new USTaxStrategy();
    const tax = strategy.calculateTax(subtotal, shipping, "US-TX");
    expect(tax.amountInCents).toBe(250); // 5% of 5000 = $2.50
  });
});

describe("OrderMapper Snapshot Persistence Checks", () => {
  const mockOrder: Order = {
    id: "ord_112233",
    userId: "usr_4455",
    items: [
      {
        productId: "prod_1",
        sku: "PROD-1-M",
        productSlug: "premium-jacket",
        productName: "Premium Jacket",
        brandName: "ZELL-Apparel",
        selectedVariantAttributes: { size: "M" },
        unitPrice: 12000, // $120.00
        appliedDiscounts: 1000, // $10.00
        currency: "USD",
        productImage: "jacket.jpg",
        quantity: 1,
      },
    ],
    status: OrderStatus.PENDING,
    statusHistory: [
      {
        status: OrderStatus.PENDING,
        action: "STATUS_CHANGED",
        updatedAt: new Date("2026-07-11T00:00:00Z"),
        updatedBy: "usr_4455",
        reason: "Placed",
      },
    ],
    subtotal: 11000,
    tax: 1100,
    shipping: 1500,
    total: 13600,
    billingAddress: {
      id: "b1",
      userId: "usr_4455",
      street: "Jane Doe, 123 Main St",
      city: "San Francisco",
      state: "CA",
      postalCode: "94103",
      country: "USA",
      isDefault: false,
    },
    shippingAddress: {
      id: "s1",
      userId: "usr_4455",
      street: "Jane Doe, 123 Main St",
      city: "San Francisco",
      state: "CA",
      postalCode: "94103",
      country: "USA",
      isDefault: true,
    },

    paymentStatus: PaymentStatus.PENDING,
    shipmentStatus: ShipmentStatus.PENDING,
    createdAt: new Date("2026-07-11T00:00:00Z"),
    updatedAt: new Date("2026-07-11T00:00:00Z"),
  };

  it("should map order domain object to persistence format and back seamlessly", () => {
    const raw = OrderMapper.toPersistence(mockOrder);
    expect(raw.items[0].productSlug).toBe("premium-jacket");
    expect(raw.items[0].brandName).toBe("ZELL-Apparel");
    expect(raw.statusHistory[0].action).toBe("STATUS_CHANGED");

    const mapped = OrderMapper.toDomain(raw);
    expect(mapped.id).toBe("ord_112233");
    expect(mapped.items[0].productSlug).toBe("premium-jacket");
    expect(mapped.items[0].brandName).toBe("ZELL-Apparel");
    expect(mapped.statusHistory[0].action).toBe("STATUS_CHANGED");
  });
});
