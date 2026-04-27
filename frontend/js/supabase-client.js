// Supabase client — browser-side
// Used for auth (sign in, sign out, session management).
// Data fetching goes through the backend API (js/api.js), not directly to Supabase.

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// These values are safe to expose in the browser — they are the public anon key.
// Row Level Security (RLS) in Supabase enforces access control.
const SUPABASE_URL  = "https://dyxgxlaerswmvskcsgwo.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5eGd4bGFlcnN3bXZza2NzZ3dvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwMDY2MDYsImV4cCI6MjA5MTU4MjYwNn0.Xh5SHfncSgM5FFbk8UyLvXL3TJVmagtQFJ_nlqJxm-o";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

// Sign in with email and password — used on the login screen
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

// Send a password reset email; redirectTo must match the allow-list in Supabase dashboard
export async function sendPasswordReset(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: "https://fello.works/reset-password.html",
  });
  if (error) throw error;
}

// Set a new password — call this after the user lands on the reset page and
// Supabase fires the PASSWORD_RECOVERY event (which establishes a temp session)
export async function updatePassword(newPassword) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

// Sign out and redirect to the invite/login page
export async function signOut() {
  await supabase.auth.signOut();
  window.location.href = "/";
}

// Get the current session — returns null if not logged in
export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

// Redirect to dashboard if already logged in — call on public pages
export async function redirectIfLoggedIn() {
  const session = await getSession();
  if (session) window.location.href = "/dashboard.html";
}

// Redirect to login if not logged in — call on protected pages
export async function requireSession() {
  const session = await getSession();
  if (!session) window.location.href = "/invite.html";
  return session;
}

// Upload an avatar image to Supabase Storage.
// The file is stored under the member's user ID, replacing any previous upload.
// Returns the public URL of the uploaded image.
export async function uploadAvatar(file) {
  const session = await getSession();
  if (!session) throw new Error("Not authenticated.");

  const userId = session.user.id;

  // Use the user's ID as the filename — one avatar per member, overwrites on re-upload
  const { error } = await supabase.storage
    .from("avatars")
    .upload(userId, file, { upsert: true, contentType: file.type });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  // Get the public URL — avatars bucket is public
  const { data } = supabase.storage.from("avatars").getPublicUrl(userId);
  // Append a cache-busting timestamp so the new image loads immediately
  return `${data.publicUrl}?t=${Date.now()}`;
}
