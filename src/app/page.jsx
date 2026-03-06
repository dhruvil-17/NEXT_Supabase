"use client";

import { supabase } from "@/lib/supabase/supabaseClient";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaGithub , FaGoogle } from "react-icons/fa";

import Link from "next/link";
export default function Home() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        alert(error.message);
      } else {
        alert("Check your email to verify account");
        setEmail("");
        setPassword("");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) alert(error.message);
    }

    setLoading(false);
  };

  //OAuth Providers
  const loginWithGoogle = async () => {
    setLoading(true);

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    });
  };
  const loginWithGithub = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    });
  };

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) router.push("/task-manager");
    });

    return () => subscription.unsubscribe();
  }, [router]);

return (
  <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-200 via-blue-300 to-blue-400 px-4">
    <div className="w-full max-w-md backdrop-blur-lg bg-white/90 border border-white/20 p-8 rounded-3xl shadow-2xl space-y-6">
      
      <h1 className="text-3xl font-bold text-center text-gray-800">
        {isSignUp ? "Create Account" : "Welcome Back"}
      </h1>

      <p className="text-center text-gray-500 text-sm">
        {isSignUp
          ? "Sign up to start your journey"
          : "Sign in to continue"}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          placeholder="Email address"
          disabled={loading}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-gray-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition disabled:bg-gray-100"
        />

        <input
          type="password"
          placeholder="Password"
          disabled={loading}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-gray-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition disabled:bg-gray-100"
        />

        <button
          disabled={loading}
          className="w-full bg-linear-to-r from-blue-500 to-blue-700 text-white py-3 rounded-xl font-semibold hover:scale-[1.02] hover:shadow-lg transition flex justify-center items-center"
        >
          {loading ? (
            <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : isSignUp ? (
            "Sign Up"
          ) : (
            "Sign In"
          )}
        </button>
      </form>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-sm text-gray-400">OR</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      <div className="space-y-3">
        <button
          onClick={loginWithGoogle}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 border border-gray-200 py-3 rounded-xl hover:bg-blue-500 hover:text-white transition font-medium"
        >
          <FaGoogle className="" size={20} />
          Continue with Google
        </button>

        <button
          onClick={loginWithGithub}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 border border-gray-200 py-3 rounded-xl hover:bg-blue-500 hover:text-white transition font-medium"
        >
          <FaGithub size={20} />
          Continue with Github
        </button>
      </div>

      <p className="text-center text-sm text-gray-600">
        {isSignUp ? "Already have an account?" : "No account yet?"}
        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="ml-2 text-blue-600 font-semibold hover:underline"
        >
          {isSignUp ? "Sign In" : "Sign Up"}
        </button>
      </p>

      <div className="flex justify-center">
        <Link
          href="/forgot-password"
          className="text-sm text-blue-600 hover:underline"
        >
          Forgot Password?
        </Link>
      </div>
    </div>
  </div>
);
}
