import { Money } from "../value-objects";

export interface TaxStrategy {
  calculateTax(subtotal: Money, shipping: Money, region: string): Money;
}

export class FlatTaxStrategy implements TaxStrategy {
  constructor(private readonly rate: number = 0.1) {}

  public calculateTax(subtotal: Money, shipping: Money, region: string): Money {
    // Flat tax only applies to the subtotal amount
    return subtotal.multiply(this.rate);
  }
}

export class USTaxStrategy implements TaxStrategy {
  public calculateTax(subtotal: Money, shipping: Money, region: string): Money {
    const normalizedRegion = region.trim().toUpperCase();

    if (normalizedRegion === "US-CA" || normalizedRegion === "CA") {
      // California: 8.25%
      return subtotal.multiply(0.0825);
    } else if (normalizedRegion.startsWith("US-") || normalizedRegion === "US") {
      // Other US states: 5% flat rate
      return subtotal.multiply(0.05);
    }

    // Default Fallback: 10%
    return subtotal.multiply(0.1);
  }
}
