export async function signUpWithEmail({ supabase, email, password }) {
  return await supabase.auth.signUp({ email, password });
}

export async function signInWithEmailPassword({ supabase, email, password }) {
  return await supabase.auth.signInWithPassword({ email, password });
}

export async function signInWithOAuthProvider({ supabase, provider, redirectTo }) {
  return await supabase.auth.signInWithOAuth({
    provider,
    options: redirectTo ? { redirectTo } : undefined,
  });
}

export async function signOut({ supabase }) {
  return await supabase.auth.signOut();
}

export function onAuthStateChange({ supabase, callback }) {
  return supabase.auth.onAuthStateChange(callback);
}

export async function getSession({ supabase }) {
  return await supabase.auth.getSession();
}

export async function exchangeCodeForSession({ supabase, code }) {
  return await supabase.auth.exchangeCodeForSession(code);
}
