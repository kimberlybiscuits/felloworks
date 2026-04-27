// FelloWorks API client
// Thin wrapper around fetch — adds the auth token and base URL automatically.
// Import this module in any screen that needs to talk to the backend.

const API_BASE = "https://felloworks-api.onrender.com/api";

// Get the session token from Supabase (stored in localStorage by the Supabase client)
function getToken() {
  // Supabase stores the session in localStorage under a key like:
  // sb-<project-ref>-auth-token
  // We read it here so every API call is automatically authenticated.
  const raw = Object.keys(localStorage).find((k) => k.endsWith("-auth-token"));
  if (!raw) return null;
  try {
    const session = JSON.parse(localStorage.getItem(raw));
    return session?.access_token ?? null;
  } catch {
    return null;
  }
}

// Core request helper
async function request(path, options = {}) {
  const token = getToken();

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers ?? {}),
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const data = await res.json();

  if (!res.ok) {
    // Surface the error message from the API, or a fallback
    throw new Error(data.error || `Request failed (${res.status})`);
  }

  return data;
}

// Convenience methods
const api = {
  get:    (path)         => request(path, { method: "GET" }),
  post:   (path, body)   => request(path, { method: "POST",   body: JSON.stringify(body) }),
  put:    (path, body)   => request(path, { method: "PUT",    body: JSON.stringify(body) }),
  delete: (path)         => request(path, { method: "DELETE" }),
};

export default api;

// ── Shared UI helpers ────────────────────────────────────────────────────

// Render an avatar element — photo if available, initials if not.
// el: a DOM element with the .avatar class
// member: object with first_name, last_name, avatar_url
export function renderAvatar(el, member) {
  if (member.avatar_url) {
    el.innerHTML = `<img src="${member.avatar_url}" alt=""
      style="width:100%;height:100%;object-fit:cover;border-radius:0;" />`;
  } else {
    const initials = `${(member.first_name || "?")[0]}${(member.last_name || "")[0]}`.toUpperCase();
    el.textContent = initials;
  }
}

// Build avatar HTML string — for use when constructing card HTML via innerHTML
export function avatarHtml(member, extraClass = "") {
  const initials = `${(member.first_name || "?")[0]}${(member.last_name || "")[0]}`.toUpperCase();
  if (member.avatar_url) {
    return `<div class="avatar ${extraClass}" aria-hidden="true">
      <img src="${member.avatar_url}" alt=""
        style="width:100%;height:100%;object-fit:cover;border-radius:0;" />
    </div>`;
  }
  return `<div class="avatar ${extraClass}" aria-hidden="true">${initials}</div>`;
}
