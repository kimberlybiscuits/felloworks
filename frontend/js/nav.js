// nav.js — shared nav behaviour loaded on every authenticated page.
// Wires up logout, injects a mobile hamburger menu, and injects the feedback widget.

import { signOut } from "./supabase-client.js";
import api from "./api.js";

document.getElementById("logout-btn")?.addEventListener("click", async () => {
  await signOut();
});

// ── Mobile hamburger ─────────────────────────────────────────────────────────

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

  const drawer = document.createElement("div");
  drawer.className = "nav__mobile-drawer";
  drawer.id        = "nav-mobile-drawer";
  drawer.setAttribute("aria-hidden", "true");

  const navLinksEl = document.querySelector(".nav__links");
  const linkItems  = navLinksEl
    ? [...navLinksEl.querySelectorAll("a")].map((a) =>
        `<a href="${a.href}" class="nav__mobile-item${a.classList.contains("nav__link--active") ? " nav__mobile-item--active" : ""}">${a.textContent}</a>`
      ).join("")
    : "";

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

  const nav = document.querySelector(".nav");
  nav.parentNode.insertBefore(drawer, nav.nextSibling);

  drawer.querySelector("#mobile-logout-btn")?.addEventListener("click", async () => {
    await signOut();
  });

  hamburger.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = drawer.classList.toggle("is-open");
    hamburger.setAttribute("aria-expanded", String(isOpen));
    drawer.setAttribute("aria-hidden", String(!isOpen));
    hamburger.classList.toggle("is-open", isOpen);
  });

  document.addEventListener("click", (e) => {
    if (!drawer.contains(e.target) && e.target !== hamburger) {
      drawer.classList.remove("is-open");
      hamburger.setAttribute("aria-expanded", "false");
      drawer.setAttribute("aria-hidden", "true");
      hamburger.classList.remove("is-open");
    }
  });
}

// ── Feedback widget ───────────────────────────────────────────────────────────

const trigger = document.createElement("button");
trigger.id        = "fw-widget-trigger";
trigger.className = "fw-widget-trigger";
trigger.setAttribute("aria-label", "Send feedback");
trigger.textContent = "Feedback";
document.body.appendChild(trigger);

const modal = document.createElement("div");
modal.id        = "fw-widget-modal";
modal.className = "fw-widget-modal";
modal.hidden    = true;
modal.setAttribute("role", "dialog");
modal.setAttribute("aria-modal", "true");
modal.setAttribute("aria-labelledby", "fw-widget-heading");
modal.innerHTML = `
  <div class="fw-widget-backdrop"></div>
  <div class="fw-widget-box">
    <h2 id="fw-widget-heading" class="fw-widget-heading">Share feedback</h2>
    <p class="fw-widget-sub">Found a bug or have a feature idea? Tell us.</p>
    <div class="fw-widget-types" role="group" aria-label="Feedback type">
      <button class="fw-widget-type fw-widget-type--active" data-type="Bug">Bug</button>
      <button class="fw-widget-type" data-type="Feature request">Feature request</button>
      <button class="fw-widget-type" data-type="Other">Other</button>
    </div>
    <textarea id="fw-widget-text" class="fw-widget-textarea" rows="4" placeholder="Describe it here…"></textarea>
    <p id="fw-widget-error" class="fw-widget-error" hidden></p>
    <p id="fw-widget-success" class="fw-widget-success" hidden>Thanks — we got it.</p>
    <div class="fw-widget-actions">
      <button id="fw-widget-submit" class="btn btn--primary">Send</button>
      <button id="fw-widget-cancel" class="btn btn--secondary">Cancel</button>
    </div>
  </div>
`;
document.body.appendChild(modal);

let selectedType = "Bug";

modal.querySelectorAll(".fw-widget-type").forEach((btn) => {
  btn.addEventListener("click", () => {
    modal.querySelectorAll(".fw-widget-type").forEach((b) => b.classList.remove("fw-widget-type--active"));
    btn.classList.add("fw-widget-type--active");
    selectedType = btn.dataset.type;
  });
});

function openWidget() {
  modal.hidden = false;
  document.getElementById("fw-widget-text").focus();
}

function closeWidget() {
  modal.hidden = true;
  document.getElementById("fw-widget-text").value = "";
  document.getElementById("fw-widget-error").hidden  = true;
  document.getElementById("fw-widget-success").hidden = true;
  // Reset to Bug
  modal.querySelectorAll(".fw-widget-type").forEach((b) => b.classList.remove("fw-widget-type--active"));
  modal.querySelector("[data-type='Bug']").classList.add("fw-widget-type--active");
  selectedType = "Bug";
}

trigger.addEventListener("click", openWidget);
document.getElementById("fw-widget-cancel").addEventListener("click", closeWidget);
modal.querySelector(".fw-widget-backdrop").addEventListener("click", closeWidget);

document.getElementById("fw-widget-submit").addEventListener("click", async () => {
  const message   = document.getElementById("fw-widget-text").value.trim();
  const errorEl   = document.getElementById("fw-widget-error");
  const successEl = document.getElementById("fw-widget-success");
  const submitBtn = document.getElementById("fw-widget-submit");

  if (!message) {
    errorEl.textContent = "Write something before sending.";
    errorEl.hidden = false;
    return;
  }

  errorEl.hidden  = true;
  submitBtn.disabled    = true;
  submitBtn.textContent = "Sending…";

  try {
    await api.post("/report", {
      type:    selectedType,
      message,
      page:    window.location.pathname,
    });
    successEl.hidden = false;
    submitBtn.hidden = true;
    setTimeout(closeWidget, 1800);
  } catch {
    errorEl.textContent = "Couldn't send — try again.";
    errorEl.hidden      = false;
    submitBtn.disabled    = false;
    submitBtn.textContent = "Send";
  }
});
