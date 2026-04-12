# FelloWorks — MVP Build Spec
Version 1.1 · April 2026

---

## 1. Project overview

FelloWorks is an invite-only network where European freelancers find trusted collaborators for specific projects. The MVP is a functional web platform covering member onboarding, profiles, need posting, browse/search, and member dashboards.

This document is the authoritative spec for the Claude Code build. All screens have been wireframed and approved. Do not deviate from decisions recorded here without flagging first.

---

## 2. Tech stack

| Layer | Tool | Notes |
|---|---|---|
| Frontend | HTML / CSS / JS or lightweight framework | Match brand guidelines exactly |
| Backend | To be decided during build | Node.js or Python preferred |
| Database | Supabase (free tier) | Postgres, built-in auth |
| Hosting — frontend | Netlify | Already in use |
| Hosting — backend | Railway or Render (free tier) | Render has cold start on free tier — acceptable for beta |
| Email (transactional) | Resend (free tier) | Invite emails, account confirmation |
| Auth | Supabase Auth | Email/password only at MVP |

### Fonts
Load via Google Fonts CDN:
- `DM Serif Display` — italic variant included
- `Karla` — weights 300, 400, 500, 600

### Brand colours
These are the canonical values. Use CSS custom properties throughout — no hardcoded hex values in component styles.

```css
--cream:       #F5F2EE   /* Primary background */
--ink:         #0D1B2A   /* Primary text, dark sections */
--ink-soft:    #3A4E60   /* Body text */
--ink-muted:   #7A8C9A   /* Captions, meta */
--amber:       #FF6B35   /* Primary accent, CTAs, logo */
--amber-light: #FF8F5E   /* Accent on dark backgrounds */
--amber-pale:  #FFF0E8   /* Warm section backgrounds */
--rule:        #D8D2C8   /* Borders, dividers */
--white:       #FFFFFF   /* Cards, inputs */
```

### Mobile form note
On mobile breakpoints, when email/text inputs and buttons stack vertically, set `border-right` explicitly per context:
- Dark background forms (e.g. hero): `border-right: 1.5px solid rgba(255,255,255,0.15)`
- Light background forms (e.g. final CTA, platform forms): `border-right: 1.5px solid var(--rule)`

Do not share a single border rule across both contexts.

---

## 3. MVP scope

Three core features only. Nothing else.

1. **Freelancer profiles** — portfolio links, work samples, skills, language, location, availability, rate range
2. **Need posting** — lead freelancer describes who they need: skill, project context, timeline, rate, visibility
3. **Browse, filter, message** — search by skill, availability, rate range, language. View profiles. Message directly.

### Deliberately excluded from MVP
- CRM or project management
- Invoicing or payment
- Social feed or content publishing
- Community forum
- Star ratings (replaced by structured post-engagement feedback)
- EU infrastructure (VIES, VAT, SEPA) — phase 2

---

## 4. Screens — approved designs

Six screens have been wireframed and signed off. Build to these exactly.

---

### Screen 1 — Welcome / account creation

**Route:** `/welcome` (linked from invite email)

**Purpose:** First screen a new approved member sees. Creates their account. Not a marketing page — they're already in.

**Layout:** Two-column, full viewport height.

**Left panel — ink background**
- FelloWorks wordmark top left
- Eyebrow label: "You're in" in amber
- Heading: `Welcome to the network.` — DM Serif Display, "network" in italic amber
- Body copy: "FelloWorks is invite-only for a reason. You're here because someone already inside thought you belonged. That means something — to them, and to every other member you'll work with."
- Invited-by card: avatar initials, "Invited by" label, inviter name and role. Pulled from the invite record in the database.
- Footer: `fello.works · Beta · April 2026` in muted white

**Right panel — cream background**
- Heading: "Create your account"
- Subhead: "Takes thirty seconds. Your profile comes next — at your own pace."
- Fields:
  - First name / Last name (two columns)
  - Email address (pre-filled from invite if available)
  - Password
- Primary CTA button: "Create my account" — amber
- Terms copy: "By creating an account you agree to the member terms and privacy policy."
- "What happens next" block in amber-pale:
  1. You'll land on your dashboard — empty for now, yours to fill.
  2. Build your profile when you're ready. No deadline, no pressure.
  3. Browse the network, post a need, or just get a feel for it first.

**Logic:**
- Invite link contains a token. Token validates on page load — if invalid or expired, show an error state.
- On submit: create Supabase auth user, create member record, mark invite as used, redirect to dashboard.
- Email field pre-filled and locked if invite email is known.

---

### Screen 2 — Member profile view

**Route:** `/members/[username]`

**Purpose:** What a logged-in member sees when they view another member's profile. Primary action is messaging. Secondary action is saving to shortlist.

**Layout:** Single column, max-width 860px, centred.

**Nav:** Ink background. Logo left. Links right: Browse, My shortlist, My profile, + Post a need (amber).

**Profile header**
- Avatar: initials circle, amber background
- Name: DM Serif Display, 32px
- Role: one-line, Karla Light
- Pills: availability status (green border = available now, amber border = upcoming), languages
- Rate range
- Location
- Primary CTA: "Message this person" — amber, full prominence
- Secondary CTA: "Add to shortlist" — heart toggle, amber when saved

**About section**
- Bio text
- Website / LinkedIn links

**Work samples** — capped at 3 items for MVP
- Card grid: title, type, year, thumbnail or link
- No more than 3 shown. Future build adds "Has worked with…" and "Introduced by…" fields.

**Below the fold — Collaboration feedback**
- Heading: "Feedback from collaborations"
- If feedback exists: structured responses from past collaborators. Each entry shows: reviewer name, role, date, responses to the four feedback questions.
- If no feedback yet:
  - Heading: "No collaborations yet on FelloWorks"
  - Body: "Feedback builds after completed projects. [Name] is a new member — their profile, portfolio, and the person who invited them are the place to start."
  - No star ratings. No placeholder scores. Never.

---

### Screen 3 — Browse / search

**Route:** `/browse`

**Purpose:** Core discovery screen. A lead freelancer searches for collaborators by skill, availability, rate, and language.

**Layout:** Two-column. Left sidebar (220px) for filters. Right main area for results.

**Search bar** (full width, above layout)
- Text input: "Search by skill, discipline, or keyword…"
- Search button: amber

**Filter sidebar**

*Skill* — checkbox list with result counts in brackets
- Brand design, UX / product design, Motion design, Illustration, Art direction (expandable)

*Availability* — checkbox
- Available now
- Available in 2–4 weeks
- Available in 1–2 months
- Available after 2 months

Brackets are calculated dynamically from each member's `availability_date`, not self-reported by the member. Members set a specific date on their profile ("Available from 15 May") and the system works out which bracket they fall into relative to today:
- Available now → `availability_status` is "now"
- Available in 2–4 weeks → `availability_date` is 14–28 days from today
- Available in 1–2 months → `availability_date` is 28–60 days from today
- Available after 2 months → `availability_date` is more than 60 days out
- Unavailable members are excluded from filtered results but visible when no availability filter is applied

Brackets recalculate daily. A dashboard prompt is shown to members when their availability date has passed, asking them to update it.

*Day rate* — range slider
- Min fixed at €400 (MVP)
- Max draggable, displays live value
- Label: "Drag to set max day rate"

*Language* — checkbox list
- English, French, Spanish, German, Italian, Dutch (expandable)

**Active filter pills** — appear above results when filters are applied. Each pill shows the filter value and an × to remove. "Clear all" link at the end.

**Results header**
- "[N] members match your search" — count updates with filters
- Sort dropdown: Recently active / Available soonest / Rate: low to high / Rate: high to low

**Results grid** — 3 columns

Each member card contains:
- Avatar initials circle (top left)
- Shortlist heart icon (top right) — toggles saved state, amber when saved
- Name: DM Serif Display
- Role: one-line, Karla Light
- Pills: availability status (green border if now, amber border if upcoming), languages
- Footer: rate range left, location right
- Card border goes amber on hover

**Clicking a card** opens the member profile view (Screen 2). Decide during build: same-page or new route. Recommendation: new route with back navigation.

---

### Screen 4 — Post a need

**Route:** `/needs/new`

**Purpose:** Lead freelancer posts what they're looking for. Step-by-step form, 5 steps.

**Layout:** Single column, max-width 600px, centred. Ink nav with "Cancel" link right.

**Progress indicator:** 5-step bar at top. Completed steps amber, current step amber-light, upcoming steps rule colour. Step counter: "Step N of 5".

**Step 1 — Skill**
- Heading: "What skill are you looking for?"
- Subhead: "Be specific. This is what members will see first."
- Text input: "Skill or discipline" with hint text
- Chip selector: multi-select skill tags. Selected state: amber border, amber text, pale amber background.

**Step 2 — Project context**
- Heading: "What's the project?"
- Subhead: "Give enough context for someone to know if they're a good fit before they message you."
- Textarea: "Project description" with hint: "Sector, scope, deliverables. You don't need to name the client."

**Step 3 — Timeline**
- Heading: "When and for how long?"
- Start date: dropdown options (Immediately / Within 2 weeks / Within a month / TBD)
- Duration: dropdown options (Less than a week / 1–4 weeks / 1–3 months / Ongoing)
- Commitment: dropdown options (Few hours / Part-time / Full-time)

**Step 4 — Rate**
- Heading: "What's the rate?"
- Rate range: min and max day rate inputs (EUR)
- Rate notes: optional text field ("Fixed fee, open to discussion, etc.")

**Step 5 — Visibility**
- Heading: "Who can see this need?"
- Radio options:
  - All members — "Any FelloWorks member with matching skills"
  - My network — "Members connected to me or my inviter"
  - By invite — "Only members you share directly"
- Review summary: compact read-only view of all steps before submitting
- Submit CTA: "Post this need" — amber

**Logic:**
- Each step validates before advancing. Back navigation preserves state.
- On submit: create need record, trigger notifications to relevant members based on visibility setting.
- After posting: redirect to dashboard with the new need shown.

---

### Screen 5 — Dashboard / home

**Route:** `/dashboard`

**Purpose:** Member home. Role-aware — shows different primary content depending on whether the member is more likely to be posting needs or responding to them.

**Layout:** Single column, max-width 1000px. Ink nav.

**Header**
- "Good morning, [first name]." — DM Serif Display
- Member since date, muted

**Primary panel — lead freelancer view (has posted needs)**
- Section: "Your active needs" — list of posted needs with status, response count, date posted
- CTA to post a new need if none exist

**Primary panel — specialist view (has not posted needs)**
- Section: "Needs that match your skills" — list of relevant needs posted by others, filtered by the member's skill tags
- Empty state if no matches: "Check back soon — or update your skill tags."

**Secondary panels (both views)**
- Recent messages — last 3 threads, unread count badge
- Shortlist — last 3 saved members, link to full shortlist
- Profile completion prompt — if profile is less than 80% complete, amber-pale card with specific missing fields called out

**Quick actions bar**
- Browse members
- Post a need
- Edit my profile

---

### Screen 6 — Work readiness / invite acceptance

**Route:** `/invite/[token]` (pre-account-creation landing)

**Purpose:** The very first thing an invited person sees before creating an account. Separate from the account creation screen — this is the confirmation that the invite is real and valid.

**Layout:** Centred, single column, full viewport. Ink background.

**Content**
- FelloWorks wordmark
- Eyebrow: "You've been invited"
- Heading: "[Inviter name] invited you to FelloWorks." — DM Serif Display
- Body: "FelloWorks is invite-only. Every member has been vouched for by someone already inside. [Inviter name] thought you'd be a good fit."
- Inviter card: avatar initials, name, role
- Primary CTA: "Accept your invitation" — amber, routes to `/welcome?token=[token]`
- Below CTA: "Invitation expires in [X] days."

**Logic:**
- Token validated server-side on load. If invalid: show expiry/error state with contact instructions.
- If already used: show "This invitation has already been accepted" state.

---

## 5. Trust and feedback system

### Post-engagement feedback
Triggered after a collaboration is marked complete by either party. Both sides receive a prompt on their dashboard.

Four questions — text responses only:
1. Did they deliver on what was agreed?
2. Did they communicate proactively?
3. Would you bring them into a client-facing project?
4. What was their strongest contribution?

- Both sides complete it independently
- Responses visible on the reviewed member's profile
- No star ratings. No numerical scores. Text responses only.
- Pending feedback surfaces on both dashboards until completed

### No star ratings — ever
This is a core product decision, not a missing feature. Do not add rating fields, average scores, or numerical reputation indicators at any point in the MVP.

---

## 6. Data model (outline)

### members
- id, created_at
- first_name, last_name, email
- username (slug for profile URL)
- role (text — e.g. "Brand designer & art director")
- bio (text)
- location (city, country)
- languages (array)
- skills (array)
- rate_min, rate_max (integer, EUR/day)
- rate_notes (text, optional)
- website_url, linkedin_url, other_links (array)
- availability_status (enum: now / from_date / unavailable)
- availability_date (date, nullable) — the specific date the member is available from. Display as-is on their profile ("Available from 15 May"). Used by the system to calculate browse filter brackets dynamically.
- availability_updated_at (timestamp) — shown on profile as "Availability last updated X days ago". Trust signal for browsers.
- invited_by (member id, foreign key) — visible to all members on the profile page, not just the member themselves. Reinforces the vouching chain.
- member_since (date)

### portfolio_items
- id, member_id
- title (text)
- description (text, optional)
- type (text — e.g. "Case study", "Campaign", "Editorial")
- year (integer)
- project_url (text) — the source URL
- image_url (text, optional) — pulled from OG image tag, or uploaded manually
- og_fetched (boolean, default false) — records whether metadata was auto-populated

**Portfolio link behaviour:**
When a member pastes a URL into the project URL field, the app makes a server-side request to fetch Open Graph metadata from that page and auto-populates title, description, and preview image. The member can edit any pre-filled field before saving.

Server-side fetching is required (browser CORS restrictions prevent client-side requests to external URLs). Implement as a lightweight API endpoint — fits naturally alongside the existing backend on Render/Railway.

Manual entry is always available as the fallback: if OG tags are absent, the fetch fails, or the member prefers to fill fields themselves, all fields remain editable. The form behaviour is identical either way — auto-fill is a convenience layer, not a dependency.

No cap on portfolio items stored. The profile view displays the 3 most recent by default, with the option to show more. This keeps profiles scannable without restricting what members can upload.

### invites
- id, created_at
- inviter_id (member id)
- invitee_email — validated against the email used at signup. If they don't match, reject the account creation.
- token (unique) — embedded in the invite URL. Captured automatically on signup; the invitee never enters it manually.
- expires_at
- used_at (nullable)


### needs
- id, created_at, member_id
- skill_title (text)
- skill_tags (array)
- description (text)
- collaboration_type (enum)
- start_date_label (text)
- duration_label (text)
- commitment_label (text)
- rate_min, rate_max (integer)
- rate_notes (text, optional)
- visibility (enum: all / network / invite)
- status (enum: active / draft / closed)

### messages
- id, created_at
- sender_id, recipient_id (member ids)
- body (text)
- read_at (nullable)

### shortlist_items
- id, member_id, saved_member_id, created_at

### feedback
- id, created_at
- reviewer_id, reviewed_id (member ids)
- collaboration_context (text, optional)
- q1_deliver, q2_communicate, q3_client_facing, q4_strongest (text responses)
- visible_on_profile (boolean, default true)

---

## 7. Navigation structure

```
/invite/[token]       Invite acceptance (pre-auth)
/welcome              Account creation (invite token required)
/dashboard            Member home (role-aware view)
/browse               Member search and filter
/members/[username]   Member profile view
/needs/new            Post a need (step-by-step)
/needs/[id]           View a posted need
/messages             Inbox
/messages/[id]        Thread view
/shortlist            Saved members
/profile              Edit own profile
/profile/feedback     Feedback history
/admin                Admin panel (invite management, member list) — beta only
```

---

## 8. Empty states

Every screen must have a considered empty state. Do not show blank space or broken layouts.

| Screen | Empty condition | Copy direction |
|---|---|---|
| Dashboard — my needs | No needs posted | Prompt to post first need |
| Dashboard — messages | No messages | "No messages yet." |
| Dashboard — shortlist | Nothing saved | "Browse members to build your shortlist." |
| Dashboard — matched needs (specialist) | No skill matches | "Check back soon — or update your skill tags." |
| Profile — feedback | No collaborations yet | "Feedback builds after completed projects. [Name] is a new member — their profile, portfolio, and the person who invited them are the place to start." |
| Browse — no results | Filters return nothing | "No members match these filters. Try broadening your search." |

---

## 9. Code quality and maintainability

The founder needs to be able to make copy, colour, and style edits independently without Claude Code assistance. This shapes how the code must be written.

- **CSS custom properties everywhere** — all colours, font sizes, spacing values must reference variables defined in one place. No hardcoded hex values or magic numbers in component styles.
- **Comments on anything non-obvious** — logic, data fetches, auth checks, and conditional rendering should have a plain-language comment explaining what it does and why.
- **Flat, logical file structure** — files named for what they contain. No deeply nested directories. A non-developer should be able to find the file for a given screen without a map.
- **Copy in the markup, not in JS** — user-facing strings should live in the HTML/template layer, not buried in JavaScript functions. This makes copy edits possible without touching logic.
- **No unnecessary abstraction** — solve the problem directly. Don't build a framework on top of a framework. Clever code that only Claude Code can navigate is not acceptable.

At the start of every Claude Code session, include this instruction: *"Write clean, well-commented code. Use CSS custom properties for all design tokens. Organise files logically. The founder needs to be able to make copy and style edits without assistance."*

---

## 10. Copy standards

These apply everywhere in the platform. No exceptions.

- Never use: "actually", "genuinely", "straightforward", "robust", "seamless", "innovative"
- No tidy parallel lists of three adjectives
- No corporate compound nouns — say what you mean in plain language
- Vary sentence length — short sentences carry weight after longer ones
- Trust the reader — do not over-explain
- Be honest about what the platform is and isn't, especially during beta
- Tone: warm but rigorous. A trusted colleague, not a tech startup.

---

## 11. Beta-specific considerations

- Free access for all beta members — no payment flow in MVP
- Admin panel needed: ability to generate invite tokens, view member list, monitor basic activity
- Feedback loop: collect member feedback informally (email or a simple form) — not built into the product at this stage
- Target cohort: 100–200 members across 3–4 EU markets, weighted toward comms, marketing, design, content
- Matches may be sparse early — the platform copy should be honest about this, not hide it

---

## 12. Phase 2 features (not in MVP — do not build)

- Direct introduction / trusted handoff flow
- Loose collective profiles (2–3 members presenting as a unit)
- SEPA payments, VAT/VIES handling, EU contract templates
- Multilingual UI
- Mobile app

---

## 13. Changelog

| Version | Date | Changes |
|---|---|---|
| 1.0 | April 2026 | Initial spec |
| 1.1 | April 2026 | Updated brand colour palette; added mobile form border note |
| 1.2 | April 2026 | Availability: date-based bracket calculation, added availability_updated_at; invite cap (default 5) and email validation; invited_by visible to all members; added available after 2 months filter bracket |
| 1.3 | April 2026 | Portfolio items: OG metadata auto-fetch on URL paste, manual entry fallback, expanded data model |
| 1.4 | April 2026 | Removed invite cap — no limit on invites per member for beta |
| 1.5 | April 2026 | Removed portfolio cap — no storage limit; profile displays 3 most recent by default, expandable |

---

*FelloWorks MVP Spec v1.1 — April 2026 — fello.works*
