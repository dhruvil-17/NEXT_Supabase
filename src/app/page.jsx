"use client";

import { supabase } from "@/lib/supabase/supabaseClient";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaGithub , FaGoogle } from "react-icons/fa";
import LoginPage from '@/app/loginPage/page.jsx'
import Link from "next/link";
export default function Home() {
return(<>
  <LoginPage/>
</>)
}
