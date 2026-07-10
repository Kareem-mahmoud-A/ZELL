"use client";

import React, { useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { Mail, CheckCircle } from "lucide-react";

export function EmailVerification() {
  const { user, sendVerification } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleResend = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      await sendVerification(user);
      toast({
        title: "Verification email sent!",
        description: "Please check your inbox.",
        variant: "success",
      });
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Failed to send email";
      toast({
        title: "Failed to send email",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-md text-center py-6">
      <CardHeader>
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mx-auto mb-4">
          <Mail className="w-6 h-6" />
        </div>
        <CardTitle className="text-xl font-bold">Verify Your Email</CardTitle>
        <CardDescription>
          We&apos;ve sent a verification link to your email address. Please click the link to
          confirm your account.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {user?.emailVerified ? (
          <div className="flex items-center gap-2 justify-center text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 p-3 rounded-md">
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm font-medium">Your email is verified!</span>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Make sure to check your spam/junk folder if you don&apos;t receive it in a few minutes.
          </p>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-3">
        {!user?.emailVerified && (
          <Button onClick={handleResend} className="w-full" isLoading={isLoading}>
            Resend Verification Email
          </Button>
        )}
        <a href="/login" className="text-sm font-semibold text-primary hover:underline mt-2">
          Proceed to Sign In
        </a>
      </CardFooter>
    </Card>
  );
}
