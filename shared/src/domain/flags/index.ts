export interface FeatureFlags {
  enableGuestCheckout: boolean;
  enablePromoStacking: boolean;
  enableReviewsVerification: boolean;
  enableMobilePayments: boolean;
}

export const defaultFeatureFlags: FeatureFlags = {
  enableGuestCheckout: true,
  enablePromoStacking: false,
  enableReviewsVerification: true,
  enableMobilePayments: false
};

export class FeatureFlagManager {
  private flags: FeatureFlags = { ...defaultFeatureFlags };

  constructor(overrideFlags?: Partial<FeatureFlags>) {
    if (overrideFlags) {
      this.flags = { ...this.flags, ...overrideFlags };
    }
  }

  public isEnabled(flag: keyof FeatureFlags): boolean {
    return this.flags[flag];
  }
}
