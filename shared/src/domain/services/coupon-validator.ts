import { Coupon, Promotion } from "../types";
import { PromotionType } from "../enums";
import { Money } from "../value-objects";

export interface CouponValidationResult {
  isValid: boolean;
  error?: string;
  discountAmount: number; // in cents
}

export class CouponValidator {
  /**
   * Validates a coupon and its underlying promotion against a cart subtotal.
   * Checks expiration, minimum purchase, and usage limits.
   * Calculates discount using the Money value object.
   */
  public static validate(
    coupon: Coupon,
    promotion: Promotion,
    subtotalCents: number,
    currentDate: Date = new Date()
  ): CouponValidationResult {
    // 1. Coupon and Promotion Active Status checks
    if (!coupon.isActive) {
      return { isValid: false, error: "Coupon is inactive", discountAmount: 0 };
    }
    if (!promotion.isActive) {
      return { isValid: false, error: "Promotion linked to coupon is inactive", discountAmount: 0 };
    }

    // 2. Date checks
    const start = new Date(promotion.startDate);
    const end = new Date(promotion.endDate);
    if (currentDate < start) {
      return { isValid: false, error: "Promotion has not started yet", discountAmount: 0 };
    }
    if (currentDate > end) {
      return { isValid: false, error: "Coupon has expired", discountAmount: 0 };
    }

    // 3. Usage limits checks
    if (coupon.usedCount >= coupon.maxUses) {
      return { isValid: false, error: "Coupon usage limit has been reached", discountAmount: 0 };
    }

    // 4. Minimum order checks
    if (promotion.minPurchaseAmount && subtotalCents < promotion.minPurchaseAmount) {
      const minVal = new Money(promotion.minPurchaseAmount).toString();
      return {
        isValid: false,
        error: `Order subtotal must be at least ${minVal} to use this coupon`,
        discountAmount: 0,
      };
    }

    // 5. Discount calculation using Money value object
    const subtotalMoney = new Money(subtotalCents);
    let discountCents = 0;

    if (promotion.type === PromotionType.PERCENTAGE) {
      // value represents percentage (e.g. 15 for 15%)
      const factor = promotion.value / 100;
      const discountMoney = subtotalMoney.multiply(factor);
      discountCents = discountMoney.amountInCents;
    } else if (promotion.type === PromotionType.FIXED_AMOUNT) {
      // value represents fixed amount in cents
      discountCents = promotion.value;
    } else if (promotion.type === PromotionType.FREE_SHIPPING) {
      // Handled at shipping calculation level, or represented as a stub value
      discountCents = 0;
    }

    // Discount cannot exceed subtotal
    if (discountCents > subtotalCents) {
      discountCents = subtotalCents;
    }

    return {
      isValid: true,
      discountAmount: discountCents,
    };
  }
}
