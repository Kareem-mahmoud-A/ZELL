"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Check, Shield, Truck, MapPin, AlertCircle, ShoppingBag, ArrowRight } from "lucide-react";

import { useCart } from "@/components/providers/cart-provider";
import { placeOrderAction } from "./actions";
import { Container } from "@/components/layout/layout-primitives";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import Image from "next/image";
import { Address, ShippingMethod } from "@zell/shared";

interface CheckoutFormAddress {
  firstName: string;
  lastName: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
}

const SHIPPING_METHODS: ShippingMethod[] = [
  { id: "sm-flat", name: "Standard Flat Rate", price: 1500, estimatedDays: "3-5 business days" },
  { id: "sm-express", name: "Expedited Express", price: 3000, estimatedDays: "1-2 business days" },
];

const mapToSharedAddress = (addr: CheckoutFormAddress, id: string): Address => {
  return {
    id,
    userId: "",
    street: `${addr.firstName} ${addr.lastName}, ${addr.street1}${addr.street2 ? ", " + addr.street2 : ""}`,
    city: addr.city,
    state: addr.state,
    postalCode: addr.postalCode,
    country: addr.country,
    isDefault: false,
  };
};

export default function CheckoutPage() {
  const { cart, loading, clearCart } = useCart();
  const router = useRouter();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [placing, setPlacing] = useState(false);
  const idempotencyKeyRef = useRef<string>("");

  // Initialize Idempotency Key once on mount
  useEffect(() => {
    idempotencyKeyRef.current =
      Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
  }, []);

  // Address states using local form structure
  const [shippingAddress, setShippingAddress] = useState<CheckoutFormAddress>({
    firstName: "",
    lastName: "",
    street1: "",
    street2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "USA",
    phone: "",
  });

  const [billingAddress, setBillingAddress] = useState<CheckoutFormAddress>({
    firstName: "",
    lastName: "",
    street1: "",
    street2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "USA",
    phone: "",
  });

  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [selectedShippingMethod, setSelectedShippingMethod] = useState<ShippingMethod>(
    SHIPPING_METHODS[0]
  );

  // Adjust standard flat rate to free shipping if eligible
  useEffect(() => {
    if (cart && cart.shipping === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedShippingMethod({
        id: "sm-free",
        name: "Free Standard Shipping",
        price: 0,
        estimatedDays: "3-5 business days",
      });
    } else {
      setSelectedShippingMethod(SHIPPING_METHODS[0]);
    }
  }, [cart]);

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      if (
        !shippingAddress.firstName ||
        !shippingAddress.street1 ||
        !shippingAddress.city ||
        !shippingAddress.postalCode
      ) {
        toast({
          title: "Incomplete Address",
          description: "Please fill in all required shipping address fields.",
          variant: "destructive",
        });
        return;
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handlePlaceOrder = async () => {
    if (placing) return;
    setPlacing(true);

    const finalShipping = mapToSharedAddress(shippingAddress, "ship_1");
    const finalBilling = sameAsShipping
      ? finalShipping
      : mapToSharedAddress(billingAddress, "bill_1");

    const res = await placeOrderAction(
      finalBilling,
      finalShipping,
      selectedShippingMethod,
      idempotencyKeyRef.current
    );

    if (res.success && res.order) {
      toast({
        title: "Order Placed!",
        description: "Your order has been recorded successfully.",
        variant: "default",
      });
      await clearCart();
      router.push(`/checkout/confirmation?orderId=${res.order.id}`);
    } else {
      toast({
        title: "Checkout Error",
        description: res.error || "Please try again.",
        variant: "destructive",
      });
      setPlacing(false);
    }
  };

  if (loading && !cart) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-40">
        <Spinner className="h-10 w-10 text-primary" />
        <p className="text-sm text-muted-foreground mt-2">Entering checkout...</p>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-32">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-bold">Your cart is empty</h2>
        <Link href="/products" className="mt-4">
          <Button>Browse Products</Button>
        </Link>
      </div>
    );
  }

  // Cost breakdown
  const subtotal = cart.subtotal;
  const shipping = selectedShippingMethod.price;
  // Estimate tax as 10% (Strategy simulation client-side)
  const tax = Math.round(subtotal * (shippingAddress.state?.toUpperCase() === "CA" ? 0.0825 : 0.1));
  const total = subtotal + shipping + tax;

  return (
    <div className="flex-1 py-12 bg-background text-foreground">
      <Container className="max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Checkout Steps Column */}
          <div className="lg:col-span-8 space-y-6">
            {/* Step navigation bar */}
            <div className="flex gap-4 items-center border-b border-border pb-6 text-sm font-semibold select-none">
              <span
                className={`pb-2 border-b-2 ${step >= 1 ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}
              >
                1. Delivery Address
              </span>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <span
                className={`pb-2 border-b-2 ${step >= 2 ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}
              >
                2. Shipping Method
              </span>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <span
                className={`pb-2 border-b-2 ${step >= 3 ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}
              >
                3. Review Order
              </span>
            </div>

            {step === 1 && (
              <form onSubmit={handleNextStep} className="space-y-6">
                <Card className="border-border">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Shipping Address
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold mb-1 block">First Name *</label>
                        <Input
                          required
                          value={shippingAddress.firstName}
                          onChange={(e) =>
                            setShippingAddress({ ...shippingAddress, firstName: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold mb-1 block">Last Name *</label>
                        <Input
                          required
                          value={shippingAddress.lastName}
                          onChange={(e) =>
                            setShippingAddress({ ...shippingAddress, lastName: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold mb-1 block">Street Address *</label>
                      <Input
                        required
                        placeholder="Street address or P.O. Box"
                        value={shippingAddress.street1}
                        onChange={(e) =>
                          setShippingAddress({ ...shippingAddress, street1: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold mb-1 block">
                        Apartment, suite, unit (optional)
                      </label>
                      <Input
                        value={shippingAddress.street2}
                        onChange={(e) =>
                          setShippingAddress({ ...shippingAddress, street2: e.target.value })
                        }
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs font-semibold mb-1 block">City *</label>
                        <Input
                          required
                          value={shippingAddress.city}
                          onChange={(e) =>
                            setShippingAddress({ ...shippingAddress, city: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold mb-1 block">State / Region *</label>
                        <Input
                          required
                          placeholder="CA or NY"
                          value={shippingAddress.state}
                          onChange={(e) =>
                            setShippingAddress({ ...shippingAddress, state: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold mb-1 block">Postal Code *</label>
                        <Input
                          required
                          value={shippingAddress.postalCode}
                          onChange={(e) =>
                            setShippingAddress({ ...shippingAddress, postalCode: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold mb-1 block">Phone Number</label>
                      <Input
                        value={shippingAddress.phone}
                        onChange={(e) =>
                          setShippingAddress({ ...shippingAddress, phone: e.target.value })
                        }
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Same as shipping billing option */}
                <div className="flex items-center gap-2 select-none px-1">
                  <input
                    type="checkbox"
                    id="billing-check"
                    checked={sameAsShipping}
                    onChange={(e) => setSameAsShipping(e.target.checked)}
                    className="w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="billing-check" className="text-sm font-semibold cursor-pointer">
                    Billing Address is same as Shipping Address
                  </label>
                </div>

                {!sameAsShipping && (
                  <Card className="border-border">
                    <CardHeader>
                      <CardTitle className="text-lg font-bold">Billing Address</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-semibold mb-1 block">First Name *</label>
                          <Input
                            required
                            value={billingAddress.firstName}
                            onChange={(e) =>
                              setBillingAddress({ ...billingAddress, firstName: e.target.value })
                            }
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold mb-1 block">Last Name *</label>
                          <Input
                            required
                            value={billingAddress.lastName}
                            onChange={(e) =>
                              setBillingAddress({ ...billingAddress, lastName: e.target.value })
                            }
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-semibold mb-1 block">Street Address *</label>
                        <Input
                          required
                          value={billingAddress.street1}
                          onChange={(e) =>
                            setBillingAddress({ ...billingAddress, street1: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold mb-1 block">City *</label>
                        <Input
                          required
                          value={billingAddress.city}
                          onChange={(e) =>
                            setBillingAddress({ ...billingAddress, city: e.target.value })
                          }
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-semibold mb-1 block">State *</label>
                          <Input
                            required
                            value={billingAddress.state}
                            onChange={(e) =>
                              setBillingAddress({ ...billingAddress, state: e.target.value })
                            }
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold mb-1 block">Postal Code *</label>
                          <Input
                            required
                            value={billingAddress.postalCode}
                            onChange={(e) =>
                              setBillingAddress({ ...billingAddress, postalCode: e.target.value })
                            }
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Button type="submit" className="w-full py-6 font-bold cursor-pointer">
                  Continue to Shipping
                </Button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleNextStep} className="space-y-6">
                <Card className="border-border">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <Truck className="h-5 w-5" />
                      Select Shipping Method
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {cart.shipping === 0 && (
                      <div
                        onClick={() =>
                          setSelectedShippingMethod({
                            id: "sm-free",
                            name: "Free Standard Shipping",
                            price: 0,
                            estimatedDays: "3-5 business days",
                          })
                        }
                        className={`p-4 rounded-lg border-2 flex justify-between items-center cursor-pointer transition-colors ${selectedShippingMethod.id === "sm-free" ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"}`}
                      >
                        <div>
                          <p className="font-bold text-sm">Free Standard Shipping</p>
                          <p className="text-xs text-muted-foreground">3-5 business days</p>
                        </div>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          Free
                        </span>
                      </div>
                    )}
                    {SHIPPING_METHODS.map((method) => {
                      if (cart.shipping === 0 && method.id === "sm-flat") return null;

                      return (
                        <div
                          key={method.id}
                          onClick={() => setSelectedShippingMethod(method)}
                          className={`p-4 rounded-lg border-2 flex justify-between items-center cursor-pointer transition-colors ${selectedShippingMethod.id === method.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"}`}
                        >
                          <div>
                            <p className="font-bold text-sm">{method.name}</p>
                            <p className="text-xs text-muted-foreground">{method.estimatedDays}</p>
                          </div>
                          <span className="font-bold">${(method.price / 100).toFixed(2)}</span>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 cursor-pointer"
                    onClick={() => setStep(1)}
                  >
                    Back
                  </Button>
                  <Button type="submit" className="flex-1 cursor-pointer font-bold">
                    Review Order
                  </Button>
                </div>
              </form>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <Card className="border-border">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <Check className="h-5 w-5" />
                      Order Details Review
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-6 text-sm">
                    <div>
                      <h4 className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider">
                        Shipping To
                      </h4>
                      <p className="mt-1 font-semibold">
                        {shippingAddress.firstName} {shippingAddress.lastName}
                      </p>
                      <p className="text-muted-foreground">
                        {shippingAddress.street1}, {shippingAddress.city}, {shippingAddress.state}{" "}
                        {shippingAddress.postalCode}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider">
                        Method
                      </h4>
                      <p className="mt-1 font-semibold">{selectedShippingMethod.name}</p>
                      <p className="text-muted-foreground">
                        {selectedShippingMethod.estimatedDays}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    className="flex-1 cursor-pointer"
                    onClick={() => setStep(2)}
                    disabled={placing}
                  >
                    Back
                  </Button>
                  <Button
                    className="flex-1 cursor-pointer font-bold"
                    onClick={handlePlaceOrder}
                    disabled={placing}
                  >
                    {placing ? <Spinner className="h-5 w-5 mr-2" /> : "Place Order"}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Cart items / Order totals summary card */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <Card className="border-border">
              <CardHeader className="border-b border-border/50">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[300px] overflow-y-auto divide-y divide-border/40 px-6 py-4 space-y-4">
                  {cart.items.map((item) => (
                    <div key={item.sku} className="flex gap-3 pt-3 first:pt-0">
                      <div className="relative w-12 h-12 rounded border border-border bg-muted flex-shrink-0 overflow-hidden">
                        <Image
                          src={item.productSnapshot.mainImage || "/placeholder.jpg"}
                          alt={item.productSnapshot.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-semibold truncate">
                          {item.productSnapshot.title}
                        </h4>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Qty: {item.quantity}
                        </p>
                        <p className="text-xs font-bold mt-1">
                          ${((item.price * item.quantity) / 100).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-secondary/15 border-t border-border p-6 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-semibold">${(subtotal / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Shipping ({selectedShippingMethod.name})
                    </span>
                    <span className="font-semibold">${(shipping / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-medium">Taxes (Estimated)</span>
                    <span className="font-semibold">${(tax / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t border-border/50 pt-3 text-base">
                    <span className="font-bold">Total</span>
                    <span className="font-black text-lg text-foreground">
                      ${(total / 100).toFixed(2)}
                    </span>
                  </div>

                  <div className="text-[10px] text-muted-foreground flex items-center justify-center gap-1.5 pt-4">
                    <Shield className="h-3 w-3 text-emerald-500" />
                    Fully secure checkout verified server-side.
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Container>
    </div>
  );
}

// Inline Link fallback import just in case
import Link from "next/link";
