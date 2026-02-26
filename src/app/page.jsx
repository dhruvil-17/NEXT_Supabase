"use client";

import { supabase } from "@/lib/supabase/supabaseClient";
import { useState , useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {

  const[isSignUp, setIsSignUp] = useState(false);
  const[email , setEmail] = useState("")
  const [password , setPassword] = useState("")
   const [session , setSession] = useState(null)
  const router = useRouter()
  const handleSubmit = async(e)=>{
    e.preventDefault()
    if (isSignUp) {
      const{error} = await supabase.auth.signUp({email , password})
      if (error) {
        console.log("Error Signing Up" , error.message)
        return
      } else{
        alert("Signed up successfully , verify your email and login to continue")
        
      }
    }else{
      const{error} = await supabase.auth.signInWithPassword({email , password})
      if (error) {
        console.log("Error Signing In" , error.message)
        return
      } else{
        router.push("/task-manager")

      }
    }
  }
  const checkUser = async () => {
    const { data } = await supabase.auth.getSession();
    setSession(data.session);

  };



  useEffect(() => {
    checkUser();
    const {data} = supabase.auth.onAuthStateChange((_event , session)=>{
      setSession(session)
      if (session) {
    router.push("/task-manager");
  }
    })

    return ()=>{
      data.subscription.unsubscribe();
    }
    
  }, []);
 
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
  <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg">
    
    <h1 className="text-3xl font-bold text-center mb-6">
      {isSignUp ? "Create Account" : "Welcome Back"}
    </h1>

    <form onSubmit={handleSubmit} className="space-y-4">

      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">
          Email
        </label>
        <input
          type="email"
          value={email}
          placeholder="you@example.com"
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">
          Password
        </label>
        <input
          type="password"
          value={password}
          placeholder="••••••••"
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
        />
      </div>

      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition duration-200"
      >
        {isSignUp ? "Sign Up" : "Sign In"}
      </button>
    </form>

    <div className="mt-6 text-center">
      <button
        onClick={() => setIsSignUp(!isSignUp)}
        className="text-blue-600 hover:underline text-sm"
      >
        {isSignUp
          ? "Already have an account? Sign In"
          : "Don't have an account? Sign Up"}
      </button>
    </div>

  </div>
</div>
  );
}
