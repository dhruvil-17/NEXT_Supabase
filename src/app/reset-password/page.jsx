"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function ResetPassword() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      setStatus({ type: "error", message: error.message });
      setLoading(false);
    } else {
      setStatus({
        type: "success",
        message: "Password updated successfully! Redirecting to login...",
      });
      setTimeout(() => {
        router.push("/");
      }, 2000);
    }
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
              <Lock className="w-5 h-5" />
            </div>
            <CardTitle className="text-xl font-bold tracking-tight">
              Create New Password
            </CardTitle>
            <CardDescription className="text-xs">
              Choose a strong password to protect your account.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {status && (
              <div
                className={`flex items-start gap-2.5 p-3 rounded-xl text-xs font-medium border ${
                  status.type === "error"
                    ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50"
                    : "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60"
                }`}
              >
                {status.type === "error" ? (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <div className="flex-1">{status.message}</div>
              </div>
            )}

            <form onSubmit={handleUpdate} className="space-y-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-medium">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password (min. 6 chars)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    disabled={loading}
                    className="pl-9 pr-9 text-xs focus-visible:ring-emerald-600/20 focus-visible:border-emerald-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
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
                  "Update Password"
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
