"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setStatus({ type: "error", message: error.message });
    } else {
      setStatus({
        type: "success",
        message: "If an account with this email exists, a password reset link has been sent to your inbox.",
      });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-150">
        <Card className="bg-card border border-border shadow-xs">
          <CardHeader className="space-y-2 text-center pb-4">
            <div className="mx-auto w-11 h-11 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded-xl flex items-center justify-center border border-emerald-200 dark:border-emerald-800 mb-1">
              <Mail className="w-5 h-5" />
            </div>
            <CardTitle className="text-xl font-bold tracking-tight">
              Reset Password
            </CardTitle>
            <CardDescription className="text-xs">
              Enter your email address and we&apos;ll send you instructions to reset your password.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {status && (
              <div
                className={`flex items-start gap-3 p-3.5 rounded-xl text-xs font-medium border leading-relaxed shadow-2xs transition-all ${
                  status.type === "error"
                    ? "bg-red-50 text-red-950 border-red-300 dark:bg-red-950/80 dark:text-red-100 dark:border-red-800"
                    : "bg-emerald-50 text-emerald-950 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-100 dark:border-emerald-700"
                }`}
              >
                {status.type === "error" ? (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600 dark:text-red-300" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-700 dark:text-emerald-300" />
                )}
                <div className="flex-1 font-semibold">{status.message}</div>
              </div>
            )}

            <form onSubmit={handleReset} className="space-y-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-medium">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="pl-9 text-xs focus-visible:ring-emerald-600/20 focus-visible:border-emerald-600"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full text-xs font-semibold h-10 mt-2 bg-emerald-700 hover:bg-emerald-800 text-white"
                disabled={loading}
              >
                {loading ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  "Send Reset Link"
                )}
              </Button>
            </form>

            <div className="pt-2 text-center">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Sign In
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
