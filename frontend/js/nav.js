// nav.js — shared nav behaviour loaded on every authenticated page.
// Wires up logout, and injects a mobile hamburger menu.

import { signOut } from "./supabase-client.js";

document.getElementById("logout-btn")?.addEventListener("click", async () => {
  await signOut();
});

// ── Mobile hamburger ─────────────────────────────────────────────────────────

// Inject hamburger button into nav__end (before profile wrap)
const profileWrap = document.getElementById("profile-wrap");
const navEnd      = profileWrap?.parentElement;

if (navEnd) {
  const hamburger = document.createElement("button");
  hamburger.className    = "nav__hamburger";
  hamburger.id           = "nav-hamburger";
  hamburger.setAttribute("aria-label", "Open menu");
  hamburger.setAttribute("aria-expanded", "false");
  hamburger.innerHTML    = `
    <span class="nav__hamburger-bar"></span>
    <span class="nav__hamburger-bar"></span>
    <span class="nav__hamburger-bar"></span>
  `;
  navEnd.insertBefore(hamburger, profileWrap);

  // Build the mobile drawer (pull nav links + dropdown items into it)
  const drawer = document.createElement("div");
  drawer.className = "nav__mobile-drawer";
  drawer.id        = "nav-mobile-drawer";
  drawer.setAttribute("aria-hidden", "true");

  // Collect links from nav__links
  const navLinksEl = document.querySelector(".nav__links");
  const linkItems  = navLinksEl
    ? [...navLinksEl.querySelectorAll("a")].map((a) =>
        `<a href="${a.href}" class="nav__mobile-item${a.classList.contains("nav__link--active") ? " nav__mobile-item--active" : ""}">${a.textContent}</a>`
      ).join("")
    : "";

  // Collect dropdown items (skip logout — handle separately)
  const dropdownItems = [...document.querySelectorAll(".nav__dropdown-item:not(#logout-btn)")]
    .map((el) => {
      const href = el.getAttribute("href") || "#";
      return `<a href="${href}" class="nav__mobile-item">${el.textContent.trim()}</a>`;
    }).join("");

  drawer.innerHTML = `
    <div class="nav__mobile-inner">
      <div class="nav__mobile-section">
        ${linkItems}
      </div>
      <div class="nav__mobile-section nav__mobile-section--border">
        ${dropdownItems}
      </div>
      <div class="nav__mobile-section nav__mobile-section--border">
        <button id="mobile-logout-btn" class="nav__mobile-item nav__mobile-item--muted">Log out</button>
      </div>
    </div>
  `;

  // Insert drawer after nav
  const nav = document.querySelector(".nav");
  nav.parentNode.insertBefore(drawer, nav.nextSibling);

  // Wire up logout in drawer
  drawer.querySelector("#mobile-logout-btn")?.addEventListener("click", async () => {
    await signOut();
  });

  // Toggle open/close
  hamburger.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = drawer.classList.toggle("is-open");
    hamburger.setAttribute("aria-expanded", String(isOpen));
    drawer.setAttribute("aria-hidden", String(!isOpen));
    hamburger.classList.toggle("is-open", isOpen);
  });

  // Close on outside click
  document.addEventListener("click", (e) => {
    if (!drawer.contains(e.target) && e.target !== hamburger) {
      drawer.classList.remove("is-open");
      hamburger.setAttribute("aria-expanded", "false");
      drawer.setAttribute("aria-hidden", "true");
      hamburger.classList.remove("is-open");
    }
  });
}
