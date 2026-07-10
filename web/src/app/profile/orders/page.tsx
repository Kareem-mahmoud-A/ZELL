"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ShoppingBag, Calendar, ArrowRight, AlertCircle } from "lucide-react";
import { Container } from "@/components/layout/layout-primitives";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { Spinner } from "@/components/ui/spinner";
import { listUserOrdersAction } from "@/app/orders/actions";
import { Order, OrderStatus } from "@zell/shared";

export default function UserOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    const res = await listUserOrdersAction();
    if (res.success && res.orders) {
      setOrders(res.orders);
    } else {
      setError(res.error || "Failed to load order history");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrders();
  }, [fetchOrders]);

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
        <p className="text-sm text-muted-foreground mt-2">Loading purchase history...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 py-12 bg-background text-foreground">
      <Container className="max-w-4xl">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Order History</h1>
            <p className="text-sm text-muted-foreground mt-1">
              View and track all your storefront purchases.
            </p>
          </div>

          {error && (
            <Card className="border-border bg-destructive/5 text-destructive p-6 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm">Error Loading History</h4>
                <p className="text-xs text-muted-foreground mt-1">{error}</p>
              </div>
            </Card>
          )}

          {!error && orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-20 bg-card rounded-lg border border-border">
              <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center text-muted-foreground mb-4">
                <ShoppingBag className="h-8 w-8" />
              </div>
              <h2 className="text-lg font-bold">No orders found</h2>
              <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                You haven&apos;t placed any orders yet. Visit our collections page to make a
                purchase.
              </p>
              <Link href="/products" className="mt-6">
                <Button>Browse Products</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const formattedDate = new Date(order.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                });

                const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);

                return (
                  <Card key={order.id} className="border-border hover:shadow-md transition-shadow">
                    <CardContent className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-sm font-bold text-foreground">
                            #{order.id}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded border capitalize ${getStatusBadgeClass(order.status)}`}
                          >
                            {order.status}
                          </span>
                        </div>
                        <div className="flex gap-4 items-center text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {formattedDate}
                          </span>
                          <span>•</span>
                          <span>{totalItems} item(s)</span>
                          <span>•</span>
                          <span className="font-bold text-foreground">
                            ${(order.total / 100).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <Link href={`/profile/orders/${order.id}`}>
                        <Button
                          variant="outline"
                          className="w-full md:w-auto font-semibold flex items-center gap-1.5 cursor-pointer"
                        >
                          View Details
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}
