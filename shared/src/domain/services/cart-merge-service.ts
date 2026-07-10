import { CartItem } from "../types";

export class CartMergeService {
  /**
   * Merges a guest cart's items with an authenticated user's cart items.
   * If an item exists in both carts, their quantities are summed.
   * The final quantities are validated against the inventory availability map:
   *   If merged quantities exceed stock, they are capped at the maximum available stock.
   */
  public static merge(
    guestItems: CartItem[],
    userItems: CartItem[],
    inventoryAvailability: Record<string, number>
  ): CartItem[] {
    const mergedMap = new Map<string, CartItem>();

    // 1. Load user items
    userItems.forEach((item) => {
      mergedMap.set(item.sku, { ...item });
    });

    // 2. Merge guest items
    guestItems.forEach((guestItem) => {
      const existing = mergedMap.get(guestItem.sku);
      if (existing) {
        existing.quantity += guestItem.quantity;
      } else {
        mergedMap.set(guestItem.sku, { ...guestItem });
      }
    });

    // 3. Constrain quantities to available stock
    const finalItems: CartItem[] = [];
    mergedMap.forEach((item) => {
      const available = inventoryAvailability[item.sku] ?? 0;
      if (item.quantity > available) {
        item.quantity = Math.max(0, available);
      }
      if (item.quantity > 0) {
        finalItems.push(item);
      }
    });

    return finalItems;
  }
}
