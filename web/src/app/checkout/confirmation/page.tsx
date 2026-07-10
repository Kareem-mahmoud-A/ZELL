"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, ShoppingBag, ArrowRight } from "lucide-react";
import { Container } from "@/components/layout/layout-primitives";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { getOrderAction } from "@/app/orders/actions";
import { Order } from "@zell/shared";

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("orderId");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) {
      router.push("/");
      return;
    }

    const fetchOrder = async () => {
      const res = await getOrderAction(orderId);
      if (res.success && res.order) {
        setOrder(res.order);
      }
      setLoading(false);
    };

    fetchOrder();
  }, [orderId, router]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Spinner className="h-10 w-10 text-primary" />
        <p className="text-sm text-muted-foreground mt-2">Retrieving order details...</p>
      </div>
    );
  }

  return (
    <Container className="max-w-xl mx-auto py-16">
      <Card className="border-border text-center">
        <CardHeader className="flex flex-col items-center">
          <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <CardTitle className="text-2xl font-black">Thank You For Your Order!</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Order ID: <span className="font-mono font-bold text-foreground">{orderId}</span>
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground">
            A confirmation receipt has been generated. We are processing your reservation and will
            ship your products shortly.
          </p>

          {order && (
            <div className="bg-secondary/20 rounded-lg p-4 text-left text-sm divide-y divide-border/30">
              <div className="pb-2 flex justify-between font-semibold">
                <span>Items Subtotal</span>
                <span>${(order.subtotal / 100).toFixed(2)}</span>
              </div>
              <div className="py-2 flex justify-between text-xs text-muted-foreground">
                <span>Shipping ({order.shippingMethod?.name || "Standard"})</span>
                <span>${(order.shipping / 100).toFixed(2)}</span>
              </div>
              <div className="py-2 flex justify-between text-xs text-muted-foreground">
                <span>Estimated Taxes</span>
                <span>${(order.tax / 100).toFixed(2)}</span>
              </div>
              <div className="pt-2 flex justify-between font-bold text-base text-foreground">
                <span>Total Paid</span>
                <span>${(order.total / 100).toFixed(2)}</span>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Link href="/profile/orders" className="flex-1">
              <Button variant="outline" className="w-full font-semibold cursor-pointer">
                Track Order History
              </Button>
            </Link>
            <Link href="/products" className="flex-1">
              <Button className="w-full font-semibold flex items-center justify-center gap-1.5 cursor-pointer">
                <ShoppingBag className="h-4 w-4" />
                Continue Shopping
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </Container>
  );
}

export default function ConfirmationPage() {
  return (
    <div className="flex-1 py-12 bg-background text-foreground">
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center py-24">
            <Spinner className="h-10 w-10 text-primary" />
            <p className="text-sm text-muted-foreground mt-2">Loading confirmation...</p>
          </div>
        }
      >
        <ConfirmationContent />
      </Suspense>
    </div>
  );
}
