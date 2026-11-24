"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaGithub, FaGoogle } from "react-icons/fa";
import { CheckCircle2, AlertCircle, Eye, EyeOff, CheckSquare, ArrowRight, Lock, Mail } from "lucide-react";

import { supabase } from "@/lib/supabase/supabaseClient";
import {
  onAuthStateChange,
  signInWithEmailPassword,
  signInWithOAuthProvider,
  signUpWithEmail,
} from "@/lib/supabase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/theme-toggle";

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState("");
  const [statusMessage, setStatusMessage] = useState(null);

  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage(null);

    if (isSignUp) {
      const { error } = await signUpWithEmail({ supabase, email, password });
      if (error) {
        setStatusMessage({ type: "error", text: error.message });
      } else {
        setStatusMessage({
          type: "success",
          text: "Verification link sent! Please check your email inbox to verify your account.",
        });
        setEmail("");
        setPassword("");
      }
    } else {
      const { error } = await signInWithEmailPassword({ supabase, email, password });
      if (error) {
        setStatusMessage({ type: "error", text: error.message });
      }
    }

    setLoading(false);
  };

  const loginWithGoogle = async () => {
    setOauthLoading("google");
    setStatusMessage(null);
    const { error } = await signInWithOAuthProvider({
      supabase,
      provider: "google",
      redirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/auth/callback`,
    });
    if (error) {
      setStatusMessage({ type: "error", text: error.message });
      setOauthLoading("");
    }
  };

  const loginWithGithub = async () => {
    setOauthLoading("github");
    setStatusMessage(null);
    const { error } = await signInWithOAuthProvider({
      supabase,
      provider: "github",
      redirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/auth/callback`,
    });
    if (error) {
      setStatusMessage({ type: "error", text: error.message });
      setOauthLoading("");
    }
  };

  useEffect(() => {
    const {
      data: { subscription },
    } = onAuthStateChange({
      supabase,
      callback: (_event, session) => {
        if (session) router.push("/task-manager");
      },
    });

    return () => subscription?.unsubscribe();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background selection:bg-emerald-100 selection:text-emerald-900">
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* Brand header */}
        <div className="flex flex-col items-center mb-6">
          <div className="h-11 w-11 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-xs mb-3">
            <CheckSquare className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">TaskFlow</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Clean & Minimal Task Workspace</p>
        </div>

        <Card className="bg-card border border-border shadow-xs">
          <CardHeader className="space-y-2 pb-4">
            <div className="flex bg-secondary p-1 rounded-xl border border-border">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(false);
                  setStatusMessage(null);
                }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  !isSignUp
                    ? "bg-card text-emerald-800 dark:text-emerald-300 shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(true);
                  setStatusMessage(null);
                }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  isSignUp
                    ? "bg-card text-emerald-800 dark:text-emerald-300 shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Create Account
              </button>
            </div>

            <CardTitle className="text-base font-semibold text-center pt-2">
              {isSignUp ? "Get started in seconds" : "Welcome back"}
            </CardTitle>
            <CardDescription className="text-center text-xs">
              {isSignUp
                ? "Create an account to organize your tasks"
                : "Enter your credentials to access your workspace"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 pt-0">
            {/* Crystal-clear notification alert */}
            {statusMessage && (
              <div
                className={`flex items-start gap-3 p-3.5 rounded-xl text-xs font-medium border leading-relaxed shadow-2xs transition-all ${
                  statusMessage.type === "error"
                    ? "bg-red-50 text-red-950 border-red-300 dark:bg-red-950/80 dark:text-red-100 dark:border-red-800"
                    : "bg-emerald-50 text-emerald-950 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-100 dark:border-emerald-700"
                }`}
              >
                {statusMessage.type === "error" ? (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600 dark:text-red-300" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-700 dark:text-emerald-300" />
                )}
                <div className="flex-1 font-semibold">{statusMessage.text}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-medium text-foreground/80">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    disabled={loading || Boolean(oauthLoading)}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-9 text-xs focus-visible:ring-emerald-600/20 focus-visible:border-emerald-600"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-medium text-foreground/80">
                    Password
                  </Label>
                  {!isSignUp && (
                    <Link
                      href="/forgot-password"
                      className="text-xs text-emerald-700 dark:text-emerald-400 font-medium hover:underline"
                    >
                      Forgot?
                    </Link>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    disabled={loading || Boolean(oauthLoading)}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
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
                disabled={loading || Boolean(oauthLoading)}
                className="w-full text-xs font-semibold h-10 mt-2 bg-emerald-700 hover:bg-emerald-800 text-white shadow-2xs"
                type="submit"
              >
                {loading ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : isSignUp ? (
                  <span className="flex items-center justify-center gap-1.5">
                    Create Account <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-1.5">
                    Sign In <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                )}
              </Button>
            </form>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-[11px] uppercase">
                <span className="bg-card px-2 text-muted-foreground font-medium">or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={loginWithGoogle}
                disabled={loading || Boolean(oauthLoading)}
                variant="outline"
                type="button"
                className="w-full text-xs h-9 bg-card hover:bg-secondary border-border"
              >
                {oauthLoading === "google" ? (
                  <div className="h-3.5 w-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <FaGoogle className="w-3.5 h-3.5 text-red-500" />
                    <span>Google</span>
                  </>
                )}
              </Button>

              <Button
                onClick={loginWithGithub}
                disabled={loading || Boolean(oauthLoading)}
                variant="outline"
                type="button"
                className="w-full text-xs h-9 bg-card hover:bg-secondary border-border"
              >
                {oauthLoading === "github" ? (
                  <div className="h-3.5 w-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <FaGithub className="w-3.5 h-3.5 text-foreground" />
                    <span>GitHub</span>
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
