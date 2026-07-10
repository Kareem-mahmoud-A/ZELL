import { CartItem, Product, Coupon, Promotion } from "../types";
import { Money } from "../value-objects";
import { CouponValidator } from "./coupon-validator";

export interface CartCalculationResult {
  subtotal: number; // in cents
  discount: number; // in cents
  tax: number; // in cents
  shipping: number; // in cents
  total: number; // in cents
  itemPrices: Record<string, number>; // SKU -> resolved unit price in cents
}

export class CartCalculator {
  /**
   * Calculates subtotal, discounts, tax, shipping, and total for a list of cart items.
   * Resolves item prices using explicit pricing precedence:
   *   Variant Override -> Product Discount -> Product Base Price
   * Wraps all calculations inside the Money value object.
   */
  public static calculate(
    items: CartItem[],
    products: Product[],
    appliedCoupon?: { coupon: Coupon; promotion: Promotion }
  ): CartCalculationResult {
    const currency = items[0]?.productSnapshot.currency || "USD";
    let subtotalMoney = new Money(0, currency);
    const itemPrices: Record<string, number> = {};

    // 1. Resolve unit price and sum line totals
    items.forEach((item) => {
      const product = products.find((p) => p.id === item.productId);
      let unitPriceCents = item.price; // fallback to unit price snapshot at add time

      if (product) {
        const variant = product.variants.find((v) => v.sku === item.sku);

        // Precedence: Variant Override -> Product Discount -> Product Base Price
        if (variant && variant.price > 0) {
          unitPriceCents = variant.price;
        } else if (product.discountPrice && product.discountPrice > 0) {
          unitPriceCents = product.discountPrice;
        } else {
          unitPriceCents = product.basePrice;
        }
      }

      itemPrices[item.sku] = unitPriceCents;
      const itemUnitPrice = new Money(unitPriceCents, currency);
      const lineTotal = itemUnitPrice.multiply(item.quantity);
      subtotalMoney = subtotalMoney.add(lineTotal);
    });

    let discountMoney = new Money(0, currency);

    // 2. Apply coupon discount if validated
    if (appliedCoupon && subtotalMoney.amountInCents > 0) {
      const validation = CouponValidator.validate(
        appliedCoupon.coupon,
        appliedCoupon.promotion,
        subtotalMoney.amountInCents
      );

      if (validation.isValid) {
        discountMoney = new Money(validation.discountAmount, currency);
      }
    }

    const subtotalAfterDiscount = subtotalMoney.amountInCents - discountMoney.amountInCents;
    const afterDiscountMoney = new Money(
      subtotalAfterDiscount > 0 ? subtotalAfterDiscount : 0,
      currency
    );

    // 3. Stub shipping: free over $50 (5000 cents) else $10 (1000 cents)
    let shippingCents = 1000;
    if (afterDiscountMoney.amountInCents >= 5000 || afterDiscountMoney.amountInCents === 0) {
      shippingCents = 0;
    }
    const shippingMoney = new Money(shippingCents, currency);

    // 4. Stub tax: 10% of subtotal after discount
    const taxMoney = afterDiscountMoney.multiply(0.1);

    // 5. Compute total: subtotal - discount + shipping + tax
    const totalMoney = afterDiscountMoney.add(shippingMoney).add(taxMoney);

    return {
      subtotal: subtotalMoney.amountInCents,
      discount: discountMoney.amountInCents,
      tax: taxMoney.amountInCents,
      shipping: shippingMoney.amountInCents,
      total: totalMoney.amountInCents,
      itemPrices,
    };
  }
}
