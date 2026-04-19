// nav.js — shared nav behaviour loaded on every authenticated page.
// Wires up the logout button.

import { signOut } from "./supabase-client.js";

document.getElementById("logout-btn")?.addEventListener("click", async () => {
  await signOut();
});
