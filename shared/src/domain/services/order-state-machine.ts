import { OrderStatus } from "../enums";
import { ValidationError } from "../../errors";

export class OrderStateMachine {
  private static readonly transitions: Record<OrderStatus, OrderStatus[]> = {
    [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
    [OrderStatus.CONFIRMED]: [OrderStatus.PAID, OrderStatus.CANCELLED],
    [OrderStatus.PAID]: [OrderStatus.PROCESSING, OrderStatus.REFUNDED],
    [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.REFUNDED],
    [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED, OrderStatus.REFUNDED],
    [OrderStatus.DELIVERED]: [OrderStatus.REFUNDED],
    [OrderStatus.CANCELLED]: [],
    [OrderStatus.REFUNDED]: [],
  };

  /**
   * Validates if a state transition is legal.
   * Throws a ValidationError if the transition is illegal.
   */
  public static validateTransition(current: OrderStatus, next: OrderStatus): void {
    if (current === next) return; // redundant but legal

    const allowed = this.transitions[current];
    if (!allowed || !allowed.includes(next)) {
      throw new ValidationError(`Illegal order status transition from ${current} to ${next}`);
    }
  }

  /**
   * Returns whether a transition is allowed without throwing.
   */
  public static canTransition(current: OrderStatus, next: OrderStatus): boolean {
    if (current === next) return true;
    const allowed = this.transitions[current];
    return !!allowed && allowed.includes(next);
  }
}
