"use client";

import React, { useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { Input } from "@/components/ui/input";
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

export function ForgotPasswordForm() {
  const { resetPassword } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await resetPassword(email);
      setIsSuccess(true);
      toast({
        title: "Reset link sent!",
        description: "Password reset instructions have been emailed to you.",
        variant: "success",
      });
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Please try again.";
      toast({
        title: "Reset failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-md">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-center">Forgot Password</CardTitle>
        <CardDescription className="text-center">
          Enter your email address and we&apos;ll send you a link to reset your password.
        </CardDescription>
      </CardHeader>
      {isSuccess ? (
        <CardContent className="text-center py-6 flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            We have sent a password reset link to{" "}
            <strong className="text-foreground">{email}</strong>.
          </p>
          <a href="/login" className="text-sm font-semibold text-primary hover:underline">
            Back to Sign In
          </a>
        </CardContent>
      ) : (
        <form onSubmit={handleSubmit}>
          <CardContent className="flex flex-col gap-4">
            <Input
              type="email"
              label="Email Address"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" isLoading={isLoading}>
              Send Reset Link
            </Button>
            <div className="text-center w-full text-xs text-muted-foreground mt-2">
              Remembered your password?{" "}
              <a href="/login" className="hover:underline text-foreground font-medium">
                Sign In
              </a>
            </div>
          </CardFooter>
        </form>
      )}
    </Card>
  );
}
