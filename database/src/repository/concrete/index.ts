import { FirestoreRepository } from "../firestore.repository";
import {
  User,
  Product,
  Order,
  Category,
  Cart,
  Wishlist,
  Review,
  Promotion,
  Notification
} from "@zell/shared";
import { UserMapper, ProductMapper, OrderMapper } from "@zell/shared";

export class UserRepository extends FirestoreRepository<User> {
  constructor() {
    super("users", UserMapper);
  }
}

export class ProductRepository extends FirestoreRepository<Product> {
  constructor() {
    super("products", ProductMapper);
  }
}

export class OrderRepository extends FirestoreRepository<Order> {
  constructor() {
    super("orders", OrderMapper);
  }
}

export class CategoryRepository extends FirestoreRepository<Category> {
  constructor() {
    super("categories");
  }
}

export class CartRepository extends FirestoreRepository<Cart> {
  constructor() {
    super("carts");
  }
}

export class WishlistRepository extends FirestoreRepository<Wishlist> {
  constructor() {
    super("wishlists");
  }
}

export class ReviewRepository extends FirestoreRepository<Review> {
  constructor() {
    super("reviews");
  }
}

export class PromotionRepository extends FirestoreRepository<Promotion> {
  constructor() {
    super("promotions");
  }
}

export class NotificationRepository extends FirestoreRepository<Notification> {
  constructor() {
    super("notifications");
  }
}
