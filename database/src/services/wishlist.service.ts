import { getDb } from "../config/firebase";
import {
  Wishlist,
  WishlistItem,
  CartItem,
  Product,
  Inventory,
  NotFoundError,
  WishlistMapper,
  CartMapper,
  ProductMapper,
  InventoryMapper,
  CartCalculator,
} from "@zell/shared";

export class WishlistService {
  /**
   * Fetches or initializes a user's wishlist.
   */
  public static async getOrCreateWishlist(userId: string): Promise<Wishlist> {
    const db = getDb();
    const wishlistRef = db.collection("wishlists").doc(userId);
    const doc = await wishlistRef.get();

    if (doc.exists) {
      return WishlistMapper.toDomain({ id: doc.id, ...doc.data() } as Record<string, unknown>);
    }

    const newWishlist: Wishlist = {
      id: userId,
      userId,
      items: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await wishlistRef.set(WishlistMapper.toPersistence(newWishlist));
    return newWishlist;
  }

  /**
   * Adds an item to the wishlist.
   * Enforces uniqueness based on the composite key (productId + sku).
   */
  public static async addToWishlist(userId: string, item: WishlistItem): Promise<Wishlist> {
    const db = getDb();
    const wishlistRef = db.collection("wishlists").doc(userId);

    return await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(wishlistRef);
      const wishlist = doc.exists
        ? WishlistMapper.toDomain({ id: doc.id, ...doc.data() } as Record<string, unknown>)
        : {
            id: userId,
            userId,
            items: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          };

      // Check uniqueness by compound key: (productId, sku)
      const duplicate = wishlist.items.find(
        (i) => i.productId === item.productId && i.sku === item.sku
      );

      if (duplicate) {
        return wishlist; // Already in wishlist, ignore silently
      }

      wishlist.items.push(item);
      wishlist.updatedAt = new Date();

      transaction.set(wishlistRef, WishlistMapper.toPersistence(wishlist));
      return wishlist;
    });
  }

  /**
   * Removes an item from the wishlist.
   */
  public static async removeFromWishlist(userId: string, sku: string): Promise<Wishlist> {
    const db = getDb();
    const wishlistRef = db.collection("wishlists").doc(userId);

    return await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(wishlistRef);
      if (!doc.exists) {
        throw new NotFoundError(`Wishlist not found for user: ${userId}`);
      }

      const wishlist = WishlistMapper.toDomain({ id: doc.id, ...doc.data() } as Record<
        string,
        unknown
      >);
      wishlist.items = wishlist.items.filter((i) => i.sku !== sku);
      wishlist.updatedAt = new Date();

      transaction.set(wishlistRef, WishlistMapper.toPersistence(wishlist));
      return wishlist;
    });
  }

  /**
   * Transactionally moves an item from the wishlist to the cart.
   * Performs inventory validation and re-evaluates cart pricing.
   */
  public static async moveToCart(userId: string, sku: string, cartId: string): Promise<void> {
    const db = getDb();
    const wishlistRef = db.collection("wishlists").doc(userId);
    const cartRef = db.collection("carts").doc(cartId);

    await db.runTransaction(async (transaction) => {
      const wishlistDoc = await transaction.get(wishlistRef);
      if (!wishlistDoc.exists) {
        throw new NotFoundError(`Wishlist not found for user: ${userId}`);
      }
      const wishlist = WishlistMapper.toDomain({
        id: wishlistDoc.id,
        ...wishlistDoc.data(),
      } as Record<string, unknown>);

      // Find item in wishlist
      const wishItem = wishlist.items.find((i) => i.sku === sku);
      if (!wishItem) {
        throw new NotFoundError(`Item with SKU ${sku} not found in wishlist.`);
      }

      // Load product to construct CartItemProductSnapshot
      const productRef = db.collection("products").doc(wishItem.productId);
      const productDoc = await transaction.get(productRef);
      if (!productDoc.exists) {
        throw new NotFoundError(`Product not found: ${wishItem.productId}`);
      }
      const product = ProductMapper.toDomain({ id: productDoc.id, ...productDoc.data() } as Record<
        string,
        unknown
      >);

      // Load inventory
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

      if (available < 1) {
        throw new Error(`Cannot move item. SKU ${sku} is out of stock.`);
      }

      // Load or create cart
      const cartDoc = await transaction.get(cartRef);
      const cart = cartDoc.exists
        ? CartMapper.toDomain({ id: cartDoc.id, ...cartDoc.data() } as Record<string, unknown>)
        : {
            id: cartId,
            userId: cartId === userId ? userId : undefined,
            items: [],
            subtotal: 0,
            tax: 0,
            shipping: 0,
            total: 0,
            promoCodesApplied: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          };

      const existingCartItem = cart.items.find((i) => i.sku === sku);
      const currentQty = existingCartItem?.quantity || 0;

      if (available < currentQty + 1) {
        throw new Error(
          `Insufficient stock to add item. Available: ${available}, Requested: ${currentQty + 1}`
        );
      }

      // Construct CartItem snapshot
      const variant = product.variants.find((v) => v.sku === sku);
      const priceAtAdd = variant && variant.price > 0 ? variant.price : product.basePrice;

      const newCartItem: CartItem = {
        productId: wishItem.productId,
        sku: wishItem.sku,
        quantity: currentQty + 1,
        price: priceAtAdd,
        productSnapshot: {
          title: product.title,
          mainImage: product.mainImage,
          variantAttributes: wishItem.attributes || {},
          priceAtAdd,
          currency: product.currency || "USD",
          brandName: product.seoTitle || "", // use SEO/title for brand snapshot stub
        },
      };

      if (existingCartItem) {
        existingCartItem.quantity = currentQty + 1;
      } else {
        cart.items.push(newCartItem);
      }

      // Remove from wishlist
      wishlist.items = wishlist.items.filter((i) => i.sku !== sku);
      wishlist.updatedAt = new Date();

      // Recalculate totals
      // Fetch all unique products for recalculation
      const productIds = Array.from(new Set(cart.items.map((i) => i.productId)));
      const productsForRecalc: Product[] = [];
      for (const pId of productIds) {
        const pDoc = await transaction.get(db.collection("products").doc(pId));
        if (pDoc.exists) {
          productsForRecalc.push(
            ProductMapper.toDomain({ id: pDoc.id, ...pDoc.data() } as Record<string, unknown>)
          );
        }
      }

      const calcs = CartCalculator.calculate(cart.items, productsForRecalc);
      const updatedItems = cart.items.map((item) => ({
        ...item,
        price: calcs.itemPrices[item.sku] ?? item.price,
      }));

      const finalizedCart = {
        ...cart,
        items: updatedItems,
        subtotal: calcs.subtotal,
        tax: calcs.tax,
        shipping: calcs.shipping,
        total: calcs.total,
        updatedAt: new Date(),
      };

      transaction.set(wishlistRef, WishlistMapper.toPersistence(wishlist));
      transaction.set(cartRef, CartMapper.toPersistence(finalizedCart as any));
    });
  }
}
