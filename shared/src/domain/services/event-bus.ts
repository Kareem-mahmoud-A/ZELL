export interface DomainEvent {
  readonly eventName: string;
  readonly occurredAt: Date;
  readonly payload: unknown;
}

export interface EventBus {
  publish(event: DomainEvent): void;
  subscribe(eventName: string, handler: (event: DomainEvent) => void): void;
}

export class InMemoryEventBus implements EventBus {
  private static instance: InMemoryEventBus;
  private handlers: Map<string, Array<(event: DomainEvent) => void>> = new Map();

  private constructor() {}

  public static getInstance(): InMemoryEventBus {
    if (!InMemoryEventBus.instance) {
      InMemoryEventBus.instance = new InMemoryEventBus();
    }
    return InMemoryEventBus.instance;
  }

  public publish(event: DomainEvent): void {
    console.log(`[EventBus] Publishing event: ${event.eventName}`, event.payload);
    const eventHandlers = this.handlers.get(event.eventName);
    if (eventHandlers) {
      eventHandlers.forEach((handler) => {
        try {
          handler(event);
        } catch (error) {
          console.error(`[EventBus] Error executing subscriber for ${event.eventName}:`, error);
        }
      });
    }
  }

  public subscribe(eventName: string, handler: (event: DomainEvent) => void): void {
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, []);
    }
    this.handlers.get(eventName)!.push(handler);
  }

  public clear(): void {
    this.handlers.clear();
  }
}

// ─── Concrete Events ─────────────────────────────────────────────────────────

export class OrderCreatedEvent implements DomainEvent {
  public readonly eventName = "OrderCreated";
  public readonly occurredAt = new Date();
  constructor(public readonly payload: { orderId: string; userId: string; total: number }) {}
}

export class OrderCancelledEvent implements DomainEvent {
  public readonly eventName = "OrderCancelled";
  public readonly occurredAt = new Date();
  constructor(public readonly payload: { orderId: string; reason?: string }) {}
}

export class ReservationCommittedEvent implements DomainEvent {
  public readonly eventName = "ReservationCommitted";
  public readonly occurredAt = new Date();
  constructor(public readonly payload: { orderId: string; sku: string; quantity: number }) {}
}

export class ReservationReleasedEvent implements DomainEvent {
  public readonly eventName = "ReservationReleased";
  public readonly occurredAt = new Date();
  constructor(public readonly payload: { sku: string; quantity: number; reason: string }) {}
}
