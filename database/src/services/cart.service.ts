import * as crypto from "crypto";
import * as admin from "firebase-admin";
import { getDb } from "../config/firebase";

import {
  Cart,
  CartItem,
  Product,
  Coupon,
  Promotion,
  Inventory,
  NotFoundError,
  ForbiddenError,
  CartMapper,
  CartCalculator,
  CartMergeService,
  ProductMapper,
  InventoryMapper,
  CouponMapper,
  PromotionMapper,
} from "@zell/shared";

export function hashGuestToken(token: string): string {
  const secret = process.env.CART_SECRET || "zell-default-secure-cart-secret-key-32-chars-long";
  return crypto.createHmac("sha256", secret).update(token).digest("hex");
}

export class CartService {
  /**
   * Securely retrieve or create a cart.
   * If a guest cart exists, its guestTokenHash is matched against the hashed plainGuestToken.
   */
  public static async getOrCreateCart(
    cartId: string,
    plainGuestToken?: string,
    userId?: string
  ): Promise<Cart> {
    const db = getDb();
    const cartRef = db.collection("carts").doc(cartId);
    const doc = await cartRef.get();

    if (doc.exists) {
      const cart = CartMapper.toDomain({ id: doc.id, ...doc.data() } as Record<string, unknown>);

      // Enforce guest token security if it's a guest cart
      if (!cart.userId && cart.guestTokenHash) {
        if (!plainGuestToken) {
          throw new ForbiddenError("Guest token required to access this cart.");
        }
        const expectedHash = hashGuestToken(plainGuestToken);
        if (cart.guestTokenHash !== expectedHash) {
          throw new ForbiddenError("Invalid guest token. Access Denied.");
        }
      }
      return cart;
    }

    // Initialize new cart
    const newCart: Cart = {
      id: cartId,
      userId,
      guestTokenHash: plainGuestToken ? hashGuestToken(plainGuestToken) : undefined,
      items: [],
      subtotal: 0,
      tax: 0,
      shipping: 0,
      total: 0,
      promoCodesApplied: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await cartRef.set(CartMapper.toPersistence(newCart));
    return newCart;
  }

  /**
   * Adds a variant item to the cart after validating inventory availability.
   * Re-evaluates totals using pricing precedence rules.
   */
  public static async addToCart(
    cartId: string,
    plainGuestToken: string | undefined,
    item: CartItem
  ): Promise<Cart> {
    const db = getDb();

    return await db.runTransaction(async (transaction) => {
      const cartRef = db.collection("carts").doc(cartId);
      const cartDoc = await transaction.get(cartRef);
      if (!cartDoc.exists) {
        throw new NotFoundError(`Cart not found: ${cartId}`);
      }

      const cart = CartMapper.toDomain({ id: cartDoc.id, ...cartDoc.data() } as Record<
        string,
        unknown
      >);

      // Guest security check
      if (!cart.userId && cart.guestTokenHash) {
        if (!plainGuestToken) {
          throw new ForbiddenError("Guest token required to modify this cart.");
        }
        if (cart.guestTokenHash !== hashGuestToken(plainGuestToken)) {
          throw new ForbiddenError("Invalid guest token.");
        }
      }

      // Check inventory availability
      const inventoryRef = db.collection("inventory").doc(item.sku);
      const inventoryDoc = await transaction.get(inventoryRef);
      if (!inventoryDoc.exists) {
        throw new NotFoundError(`Inventory record not found for SKU: ${item.sku}`);
      }

      const inventory = InventoryMapper.toDomain({
        sku: inventoryDoc.id,
        ...inventoryDoc.data(),
      } as Record<string, unknown>);
      const available = inventory.quantity - inventory.reservedQuantity;

      const existingItem = cart.items.find((i) => i.sku === item.sku);
      const newQty = (existingItem?.quantity || 0) + item.quantity;

      if (available < newQty) {
        throw new Error(
          `Insufficient stock to add item. Available: ${available}, Requested: ${newQty}`
        );
      }

      // Update cart items list
      if (existingItem) {
        existingItem.quantity = newQty;
      } else {
        cart.items.push(item);
      }

      // Recalculate totals
      const updatedCart = await this.recalculateCartTotals(cart, transaction);
      transaction.set(cartRef, CartMapper.toPersistence(updatedCart));

      return updatedCart;
    });
  }

  /**
   * Updates the quantity of a cart item.
   */
  public static async updateQuantity(
    cartId: string,
    plainGuestToken: string | undefined,
    sku: string,
    quantity: number
  ): Promise<Cart> {
    const db = getDb();

    return await db.runTransaction(async (transaction) => {
      const cartRef = db.collection("carts").doc(cartId);
      const cartDoc = await transaction.get(cartRef);
      if (!cartDoc.exists) {
        throw new NotFoundError(`Cart not found: ${cartId}`);
      }

      const cart = CartMapper.toDomain({ id: cartDoc.id, ...cartDoc.data() } as Record<
        string,
        unknown
      >);

      // Guest security check
      if (!cart.userId && cart.guestTokenHash) {
        if (!plainGuestToken) {
          throw new ForbiddenError("Guest token required to modify this cart.");
        }
        if (cart.guestTokenHash !== hashGuestToken(plainGuestToken)) {
          throw new ForbiddenError("Invalid guest token.");
        }
      }

      const existingItem = cart.items.find((i) => i.sku === sku);
      if (!existingItem) {
        throw new NotFoundError(`Item with SKU ${sku} not found in cart.`);
      }

      if (quantity <= 0) {
        cart.items = cart.items.filter((i) => i.sku !== sku);
      } else {
        // Validate inventory
        const inventoryRef = db.collection("inventory").doc(sku);
        const inventoryDoc = await transaction.get(inventoryRef);
        if (!inventoryDoc.exists) {
          throw new NotFoundError(`Inventory record not found for SKU: ${sku}`);
        }
        const inventory = InventoryMapper.toDomain({
          sku: inventoryDoc.id,
          ...inventoryDoc.data(),
        } as Record<string, unknown>);
        const available = inventory.quantity - inventory.reservedQuantity;

        if (available < quantity) {
          throw new Error(
            `Insufficient stock to update quantity. Available: ${available}, Requested: ${quantity}`
          );
        }

        existingItem.quantity = quantity;
      }

      // Recalculate totals
      const updatedCart = await this.recalculateCartTotals(cart, transaction);
      transaction.set(cartRef, CartMapper.toPersistence(updatedCart));

      return updatedCart;
    });
  }

  /**
   * Removes an item from the cart.
   */
  public static async removeFromCart(
    cartId: string,
    plainGuestToken: string | undefined,
    sku: string
  ): Promise<Cart> {
    const db = getDb();

    return await db.runTransaction(async (transaction) => {
      const cartRef = db.collection("carts").doc(cartId);
      const cartDoc = await transaction.get(cartRef);
      if (!cartDoc.exists) {
        throw new NotFoundError(`Cart not found: ${cartId}`);
      }

      const cart = CartMapper.toDomain({ id: cartDoc.id, ...cartDoc.data() } as Record<
        string,
        unknown
      >);

      // Guest security check
      if (!cart.userId && cart.guestTokenHash) {
        if (!plainGuestToken) {
          throw new ForbiddenError("Guest token required to modify this cart.");
        }
        if (cart.guestTokenHash !== hashGuestToken(plainGuestToken)) {
          throw new ForbiddenError("Invalid guest token.");
        }
      }

      cart.items = cart.items.filter((i) => i.sku !== sku);

      // Recalculate totals
      const updatedCart = await this.recalculateCartTotals(cart, transaction);
      transaction.set(cartRef, CartMapper.toPersistence(updatedCart));

      return updatedCart;
    });
  }

  /**
   * Clears all items in the cart.
   */
  public static async clearCart(
    cartId: string,
    plainGuestToken: string | undefined
  ): Promise<Cart> {
    const db = getDb();

    return await db.runTransaction(async (transaction) => {
      const cartRef = db.collection("carts").doc(cartId);
      const cartDoc = await transaction.get(cartRef);
      if (!cartDoc.exists) {
        throw new NotFoundError(`Cart not found: ${cartId}`);
      }

      const cart = CartMapper.toDomain({ id: cartDoc.id, ...cartDoc.data() } as Record<
        string,
        unknown
      >);

      if (!cart.userId && cart.guestTokenHash) {
        if (!plainGuestToken) {
          throw new ForbiddenError("Guest token required.");
        }
        if (cart.guestTokenHash !== hashGuestToken(plainGuestToken)) {
          throw new ForbiddenError("Invalid guest token.");
        }
      }

      cart.items = [];
      cart.subtotal = 0;
      cart.tax = 0;
      cart.shipping = 0;
      cart.total = 0;
      cart.promoCodesApplied = [];
      cart.updatedAt = new Date();

      transaction.set(cartRef, CartMapper.toPersistence(cart));
      return cart;
    });
  }

  /**
   * Transactionally merges a guest cart into a user's authenticated cart.
   * If stock exceeds limits, quantities are capped gracefully via CartMergeService.
   * The guest cart document is deleted upon successful merge.
   */
  public static async mergeCarts(
    guestCartId: string,
    plainGuestToken: string,
    userId: string
  ): Promise<Cart> {
    const db = getDb();
    const guestCartRef = db.collection("carts").doc(guestCartId);
    const userCartRef = db.collection("carts").doc(userId); // Use userId as cartId for authenticated users

    return await db.runTransaction(async (transaction) => {
      const guestDoc = await transaction.get(guestCartRef);
      const userDoc = await transaction.get(userCartRef);

      if (!guestDoc.exists) {
        // Nothing to merge, return user cart if exists, else create it
        if (userDoc.exists) {
          return CartMapper.toDomain({ id: userDoc.id, ...userDoc.data() } as Record<
            string,
            unknown
          >);
        }
        const newCart: Cart = {
          id: userId,
          userId,
          items: [],
          subtotal: 0,
          tax: 0,
          shipping: 0,
          total: 0,
          promoCodesApplied: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        transaction.set(userCartRef, CartMapper.toPersistence(newCart));
        return newCart;
      }

      const guestCart = CartMapper.toDomain({ id: guestDoc.id, ...guestDoc.data() } as Record<
        string,
        unknown
      >);

      // Verify guest token hash
      if (guestCart.guestTokenHash !== hashGuestToken(plainGuestToken)) {
        throw new ForbiddenError("Invalid guest token. Cannot merge carts.");
      }

      const userCart = userDoc.exists
        ? CartMapper.toDomain({ id: userDoc.id, ...userDoc.data() } as Record<string, unknown>)
        : {
            id: userId,
            userId,
            items: [],
            subtotal: 0,
            tax: 0,
            shipping: 0,
            total: 0,
            promoCodesApplied: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          };

      // Collect all unique SKUs to query inventory
      const skus = Array.from(
        new Set([...guestCart.items.map((i) => i.sku), ...userCart.items.map((i) => i.sku)])
      );

      const inventoryAvailability: Record<string, number> = {};
      for (const sku of skus) {
        const invDoc = await transaction.get(db.collection("inventory").doc(sku));
        if (invDoc.exists) {
          const inv = InventoryMapper.toDomain({ sku: invDoc.id, ...invDoc.data() } as Record<
            string,
            unknown
          >);
          inventoryAvailability[sku] = inv.quantity - inv.reservedQuantity;
        } else {
          inventoryAvailability[sku] = 0;
        }
      }

      // Merge items via domain service (stock capped gracefully)
      const mergedItems = CartMergeService.merge(
        guestCart.items,
        userCart.items,
        inventoryAvailability
      );

      const mergedCart: Cart = {
        ...userCart,
        items: mergedItems,
        promoCodesApplied: Array.from(
          new Set([...guestCart.promoCodesApplied, ...userCart.promoCodesApplied])
        ),
        updatedAt: new Date(),
      };

      // Recalculate totals
      const finalizedCart = await this.recalculateCartTotals(mergedCart, transaction);

      // Write merged user cart + delete guest cart
      transaction.set(userCartRef, CartMapper.toPersistence(finalizedCart));
      transaction.delete(guestCartRef);

      return finalizedCart;
    });
  }

  /**
   * Applies a coupon code to the cart and recalculates totals.
   */
  public static async applyCoupon(
    cartId: string,
    plainGuestToken: string | undefined,
    code: string
  ): Promise<Cart> {
    const db = getDb();

    return await db.runTransaction(async (transaction) => {
      const cartRef = db.collection("carts").doc(cartId);
      const cartDoc = await transaction.get(cartRef);
      if (!cartDoc.exists) {
        throw new NotFoundError(`Cart not found: ${cartId}`);
      }

      const cart = CartMapper.toDomain({ id: cartDoc.id, ...cartDoc.data() } as Record<
        string,
        unknown
      >);

      // Guest security check
      if (!cart.userId && cart.guestTokenHash) {
        if (!plainGuestToken) {
          throw new ForbiddenError("Guest token required.");
        }
        if (cart.guestTokenHash !== hashGuestToken(plainGuestToken)) {
          throw new ForbiddenError("Invalid guest token.");
        }
      }

      // Fetch coupon
      const couponQuery = db.collection("coupons").where("code", "==", code).limit(1);
      const couponSnapshot = await transaction.get(couponQuery);
      if (couponSnapshot.empty) {
        throw new NotFoundError(`Coupon code not found: ${code}`);
      }

      const couponDoc = couponSnapshot.docs[0];
      const coupon = CouponMapper.toDomain({ id: couponDoc.id, ...couponDoc.data() } as Record<
        string,
        unknown
      >);

      // Fetch linked promotion
      const promoDoc = await transaction.get(db.collection("promotions").doc(coupon.promoId));
      if (!promoDoc.exists) {
        throw new NotFoundError(`Promotion linked to coupon ${code} not found.`);
      }
      const promotion = PromotionMapper.toDomain({ id: promoDoc.id, ...promoDoc.data() } as Record<
        string,
        unknown
      >);

      // recalculate applying coupon
      const promoCodes = Array.from(new Set([...cart.promoCodesApplied, code]));
      const tempCart = { ...cart, promoCodesApplied: promoCodes };
      const updatedCart = await this.recalculateCartTotals(tempCart, transaction, {
        coupon,
        promotion,
      });

      transaction.set(cartRef, CartMapper.toPersistence(updatedCart));
      return updatedCart;
    });
  }

  /**
   * Recalculates cart subtotal, taxes, shipping, discounts, and total.
   * Resolves active products and pricing overrides inside transactions.
   */
  private static async recalculateCartTotals(
    cart: Cart,
    transaction: admin.firestore.Transaction,
    appliedCoupon?: { coupon: Coupon; promotion: Promotion }
  ): Promise<Cart> {
    const db = getDb();

    // Fetch matching products for all items
    const productIds = Array.from(new Set(cart.items.map((i) => i.productId)));
    const products: Product[] = [];

    for (const id of productIds) {
      const prodDoc = await transaction.get(db.collection("products").doc(id));
      if (prodDoc.exists) {
        products.push(
          ProductMapper.toDomain({ id: prodDoc.id, ...prodDoc.data() } as Record<string, unknown>)
        );
      }
    }

    // Call domain calculator
    const calcs = CartCalculator.calculate(cart.items, products, appliedCoupon);

    // Update prices inside cart items based on revalidated calculations
    const updatedItems = cart.items.map((item) => ({
      ...item,
      price: calcs.itemPrices[item.sku] ?? item.price,
    }));

    return {
      ...cart,
      items: updatedItems,
      subtotal: calcs.subtotal,
      discount: calcs.discount, // added to match stubs (need to type it or extend Cart type)
      tax: calcs.tax,
      shipping: calcs.shipping,
      total: calcs.total,
      updatedAt: new Date(),
    } as unknown as Cart; // cast to return correct type
  }
}
