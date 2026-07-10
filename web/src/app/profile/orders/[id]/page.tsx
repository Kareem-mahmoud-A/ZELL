"use client";

import React, { use, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Calendar,
  MapPin,
  AlertCircle,
  ArrowLeft,
  XCircle,
} from "lucide-react";
import { Container } from "@/components/layout/layout-primitives";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { getOrderAction, transitionOrderStatusAction } from "@/app/orders/actions";
import { Order, OrderStatus } from "@zell/shared";
import Image from "next/image";

export default function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: orderId } = use(params);
  const { toast } = useToast();


  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    const res = await getOrderAction(orderId);
    if (res.success && res.order) {
      setOrder(res.order);
      setError(null);
    } else {
      setError(res.error || "Failed to load order details");
    }
    setLoading(false);
  }, [orderId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrder();
  }, [fetchOrder]);

  const handleCancelOrder = async () => {
    if (
      !window.confirm(
        "Are you sure you want to cancel this order? This action is irreversible and will restock the inventory."
      )
    ) {
      return;
    }

    setCancelling(true);
    const res = await transitionOrderStatusAction(
      orderId,
      OrderStatus.CANCELLED,
      "STATUS_CHANGED",
      "Order cancelled by customer"
    );

    if (res.success && res.order) {
      setOrder(res.order);
      toast({
        title: "Order Cancelled",
        description: "Order was successfully cancelled and items were restocked.",
      });
    } else {
      toast({
        title: "Failed to Cancel",
        description: res.error || "Please try again.",
        variant: "destructive",
      });
    }
    setCancelling(false);
  };

  const getStatusBadgeClass = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING:
        return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/30";
      case OrderStatus.CONFIRMED:
      case OrderStatus.PAID:
        return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/30";
      case OrderStatus.PROCESSING:
        return "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-900/30";
      case OrderStatus.SHIPPED:
        return "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-900/30";
      case OrderStatus.DELIVERED:
        return "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/30";
      case OrderStatus.CANCELLED:
      case OrderStatus.REFUNDED:
        return "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/30";
      default:
        return "bg-secondary text-secondary-foreground border-border/50";
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-40 bg-background text-foreground">
        <Spinner className="h-10 w-10 text-primary" />
        <p className="text-sm text-muted-foreground mt-2">Loading order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex-1 py-20 bg-background text-foreground">
        <Container className="max-w-md mx-auto text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold">Failed to load order</h2>
          <p className="text-sm text-muted-foreground mt-2">
            {error || "The order does not exist."}
          </p>
          <Link href="/profile/orders" className="mt-6 inline-block">
            <Button>Back to Orders</Button>
          </Link>
        </Container>
      </div>
    );
  }

  const showCancelButton = [OrderStatus.PENDING, OrderStatus.CONFIRMED].includes(order.status);
  const formattedDate = new Date(order.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="flex-1 py-12 bg-background text-foreground">
      <Container className="max-w-5xl">
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/60 pb-6">
            <div>
              <Link
                href="/profile/orders"
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-semibold mb-2"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Order History
              </Link>
              <h1 className="text-2xl font-black flex items-center gap-3">
                Order <span className="font-mono text-muted-foreground">#{order.id}</span>
              </h1>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Placed on {formattedDate}
              </p>
            </div>
            <div className="flex gap-2">
              <span
                className={`text-xs font-bold px-3 py-1 rounded border capitalize flex items-center justify-center ${getStatusBadgeClass(order.status)}`}
              >
                {order.status}
              </span>
              {showCancelButton && (
                <Button
                  onClick={handleCancelOrder}
                  disabled={cancelling}
                  variant="destructive"
                  className="font-bold flex items-center gap-1.5 cursor-pointer text-xs"
                  size="sm"
                >
                  <XCircle className="h-4 w-4" />
                  {cancelling ? <Spinner className="h-3.5 w-3.5" /> : "Cancel Order"}
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Items snapshots and Timeline */}
            <div className="lg:col-span-8 space-y-6">
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-base font-bold">Immutable Item Snapshots</CardTitle>
                </CardHeader>
                <CardContent className="divide-y divide-border/40">
                  {order.items.map((item) => (
                    <div key={item.sku} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                      <div className="relative w-20 h-20 bg-muted border border-border rounded overflow-hidden flex-shrink-0">
                        <Image
                          src={item.productImage || "/placeholder.jpg"}
                          alt={item.productName}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-sm line-clamp-1">{item.productName}</h4>
                        {item.brandName && (
                          <p className="text-xs text-muted-foreground font-semibold mt-0.5">
                            {item.brandName}
                          </p>
                        )}
                        <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                          SKU: {item.sku}
                        </p>

                        {Object.keys(item.selectedVariantAttributes).length > 0 && (
                          <div className="flex gap-1.5 flex-wrap mt-2">
                            {Object.entries(item.selectedVariantAttributes).map(([key, val]) => (
                              <span
                                key={key}
                                className="text-[9px] bg-secondary text-secondary-foreground border border-border/30 px-1.5 py-0.5 rounded font-semibold capitalize"
                              >
                                {key}: {val}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black">
                          ${((item.unitPrice * item.quantity) / 100).toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">Qty: {item.quantity}</p>
                        <p className="text-[10px] text-muted-foreground">
                          ${(item.unitPrice / 100).toFixed(2)} ea
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Status Timeline History */}
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-base font-bold">Status History Audit Trail</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {order.statusHistory.map((h, i) => (
                    <div key={i} className="flex gap-4 border-l-2 border-primary/20 pl-4 relative">
                      <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-primary" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-foreground capitalize">
                            {h.status}
                          </span>
                          <span className="text-[9px] bg-secondary border border-border/40 text-muted-foreground px-1.5 py-0.5 rounded font-semibold uppercase">
                            {h.action}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(h.updatedAt).toLocaleString("en-US", {
                            hour: "numeric",
                            minute: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                          {" • "}
                          By {h.updatedBy}
                        </p>
                        {h.reason && (
                          <p className="text-xs text-foreground/80 mt-1 italic">
                            &quot;{h.reason}&quot;
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Right: Shipping Address / Delivery details */}
            <div className="lg:col-span-4 space-y-6">
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <MapPin className="h-4.5 w-4.5" />
                    Delivery Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-xs">
                  <div>
                    <h5 className="font-bold text-muted-foreground uppercase text-[9px] tracking-wide">
                      Shipping Address
                    </h5>
                    <p className="font-semibold text-foreground mt-1">
                      {order.shippingAddress.street}
                    </p>
                    <p className="text-muted-foreground mt-0.5">
                      {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                      {order.shippingAddress.postalCode}
                    </p>
                  </div>
                  <div>
                    <h5 className="font-bold text-muted-foreground uppercase text-[9px] tracking-wide">
                      Billing Address
                    </h5>
                    <p className="font-semibold text-foreground mt-1">
                      {order.billingAddress.street}
                    </p>
                    <p className="text-muted-foreground mt-0.5">
                      {order.billingAddress.city}, {order.billingAddress.state}{" "}
                      {order.billingAddress.postalCode}
                    </p>
                  </div>
                  <div className="border-t border-border/50 pt-3">
                    <h5 className="font-bold text-muted-foreground uppercase text-[9px] tracking-wide">
                      Shipping Method
                    </h5>
                    <p className="font-semibold text-foreground mt-1">
                      {order.shippingMethod?.name || "Standard Delivery"}
                    </p>
                    <p className="text-muted-foreground mt-0.5">
                      {order.shippingMethod?.estimatedDays}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Price Details summary */}
              <Card className="border-border bg-secondary/10">
                <CardContent className="p-6 space-y-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Items Subtotal</span>
                    <span className="font-semibold">${(order.subtotal / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="font-semibold">${(order.shipping / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Estimated Taxes</span>
                    <span className="font-semibold">${(order.tax / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t border-border/50 pt-3 text-sm">
                    <span className="font-bold">Estimated Total</span>
                    <span className="font-black text-base text-foreground">
                      ${(order.total / 100).toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
