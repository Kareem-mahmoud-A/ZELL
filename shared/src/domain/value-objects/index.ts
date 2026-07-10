export class Money {
  constructor(
    public readonly amountInCents: number,
    public readonly currency: string = "USD"
  ) {
    if (!Number.isInteger(amountInCents)) {
      throw new Error("Amount in cents must be an integer");
    }
  }

  public get amount(): number {
    return this.amountInCents / 100;
  }

  public toString(): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: this.currency,
    }).format(this.amount);
  }

  public add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error("Cannot add money of different currencies");
    }
    return new Money(this.amountInCents + other.amountInCents, this.currency);
  }

  public subtract(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error("Cannot subtract money of different currencies");
    }
    return new Money(this.amountInCents - other.amountInCents, this.currency);
  }
}

export class Sku {
  constructor(public readonly value: string) {
    const skuRegex = /^[A-Z0-9]{3,5}-[A-Z0-9]{3,5}-[A-Z0-9]{2,5}(-[A-Z0-9]{2,5})?$/;
    if (!skuRegex.test(value)) {
      throw new Error(`Invalid SKU format: ${value}. Expected: XXX-YYY-ZZZ(-AA)`);
    }
  }
}

export class Email {
  constructor(public readonly value: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      throw new Error(`Invalid email address: ${value}`);
    }
  }

  public get normalized(): string {
    return this.value.trim().toLowerCase();
  }
}
