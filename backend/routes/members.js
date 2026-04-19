// Member routes
// GET  /api/members            — list/search members (browse screen)
// GET  /api/members/:username  — single member profile
// PUT  /api/members/me         — update own profile
// GET  /api/members/me         — get own profile

const express = require("express");
const router = express.Router();
const { supabaseAdmin } = require("../lib/supabase");
const requireAuth = require("../middleware/requireAuth");

// Browse members — supports filters: skill, availability, rate_max, language, sort, q (keyword)
router.get("/", requireAuth, async (req, res) => {
  const { q, skill, availability, rate_max, language, sort } = req.query;

  let query = supabaseAdmin
    .from("members")
    .select(
      "id, username, first_name, last_name, role, location, languages, skills, rate_min, rate_max, availability_status, availability_date"
    );

  // Keyword search across name and role
  if (q) {
    query = query.or(
      `first_name.ilike.%${q}%,last_name.ilike.%${q}%,role.ilike.%${q}%`
    );
  }

  // Skill filter — checks if the skills array contains the requested skill
  if (skill) {
    query = query.contains("skills", [skill]);
  }

  // Language filter
  if (language) {
    query = query.contains("languages", [language]);
  }

  // Rate filter — max day rate
  if (rate_max) {
    query = query.lte("rate_min", parseInt(rate_max));
  }

  // Availability filter — bracket logic matches spec section 3
  // Brackets are calculated from availability_date relative to today
  if (availability === "now") {
    query = query.eq("availability_status", "now");
  } else if (availability === "2-4-weeks") {
    const from = new Date();
    from.setDate(from.getDate() + 14);
    const to = new Date();
    to.setDate(to.getDate() + 28);
    query = query
      .eq("availability_status", "from_date")
      .gte("availability_date", from.toISOString().split("T")[0])
      .lte("availability_date", to.toISOString().split("T")[0]);
  } else if (availability === "1-2-months") {
    const from = new Date();
    from.setDate(from.getDate() + 28);
    const to = new Date();
    to.setDate(to.getDate() + 60);
    query = query
      .eq("availability_status", "from_date")
      .gte("availability_date", from.toISOString().split("T")[0])
      .lte("availability_date", to.toISOString().split("T")[0]);
  } else if (availability === "after-2-months") {
    const from = new Date();
    from.setDate(from.getDate() + 60);
    query = query
      .eq("availability_status", "from_date")
      .gte("availability_date", from.toISOString().split("T")[0]);
  }

  // When no availability filter is applied, exclude unavailable members only if
  // the user is actively filtering — otherwise show everyone (per spec)
  // Sort
  if (sort === "available-soonest") {
    query = query.order("availability_date", { ascending: true });
  } else if (sort === "rate-low") {
    query = query.order("rate_min", { ascending: true });
  } else if (sort === "rate-high") {
    query = query.order("rate_min", { ascending: false });
  } else {
    // Default: recently active (by created_at as a proxy until last_active is tracked)
    query = query.order("created_at", { ascending: false });
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching members:", error);
    return res.status(500).json({ error: "Could not fetch members." });
  }

  res.json({ members: data });
});

// Get own portfolio items — all of them, for the edit screen
router.get("/me/portfolio", requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("portfolio_items")
    .select("*")
    .eq("member_id", req.user.id)
    .order("year", { ascending: false });

  if (error) return res.status(500).json({ error: "Could not fetch portfolio." });
  res.json({ portfolio: data });
});

// Get own profile — must be before /:username to avoid conflict
router.get("/me", requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("members")
    .select("*")
    .eq("id", req.user.id)
    .single();

  if (error || !data) {
    return res.status(404).json({ error: "Member not found." });
  }

  res.json({ member: data });
});

// Update own profile
router.put("/me", requireAuth, async (req, res) => {
  // Whitelist updatable fields — prevents overwriting id, email, invited_by, etc.
  const allowed = [
    "first_name", "last_name", "role", "bio", "location",
    "languages", "skills", "rate_min", "rate_max", "rate_notes",
    "website_url", "linkedin_url", "other_links",
    "availability_status", "availability_date",
    "avatar_url",
  ];

  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      updates[key] = req.body[key];
    }
  }

  // Record when availability was last updated — shown on profile as a trust signal
  if (updates.availability_status || updates.availability_date) {
    updates.availability_updated_at = new Date().toISOString();
  }

  const { data, error } = await supabaseAdmin
    .from("members")
    .update(updates)
    .eq("id", req.user.id)
    .select()
    .single();

  if (error) {
    console.error("Error updating member:", error);
    return res.status(500).json({ error: "Could not update profile." });
  }

  res.json({ member: data });
});

// Get a member profile by username (public within the network)
router.get("/:username", requireAuth, async (req, res) => {
  const { username } = req.params;

  const { data: member, error } = await supabaseAdmin
    .from("members")
    .select(
      `
      id, username, first_name, last_name, role, bio, location, languages, skills,
      rate_min, rate_max, rate_notes, website_url, linkedin_url, other_links,
      availability_status, availability_date, availability_updated_at,
      member_since,
      inviter:invited_by (
        id, first_name, last_name, role, username
      )
    `
    )
    .eq("username", username)
    .single();

  if (error || !member) {
    return res.status(404).json({ error: "Member not found." });
  }

  // Fetch the 3 most recent portfolio items for this member
  const { data: portfolio } = await supabaseAdmin
    .from("portfolio_items")
    .select("*")
    .eq("member_id", member.id)
    .order("year", { ascending: false })
    .limit(3);

  // Fetch visible feedback for this member
  const { data: feedback } = await supabaseAdmin
    .from("feedback")
    .select(
      `
      id, created_at, collaboration_context,
      q1_deliver, q2_communicate, q3_client_facing, q4_strongest,
      reviewer:reviewer_id (first_name, last_name, role)
    `
    )
    .eq("reviewed_id", member.id)
    .eq("visible_on_profile", true)
    .order("created_at", { ascending: false });

  res.json({ member, portfolio: portfolio || [], feedback: feedback || [] });
});

module.exports = router;
