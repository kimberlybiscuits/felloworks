// Need routes
// GET  /api/needs          — list needs relevant to the current member (dashboard)
// GET  /api/needs/:id      — view a single need
// POST /api/needs          — post a new need
// PUT  /api/needs/:id      — update a need (author only)
// DELETE /api/needs/:id    — close/delete a need (author only)

const express = require("express");
const router = express.Router();
const { supabaseAdmin } = require("../lib/supabase");
const requireAuth = require("../middleware/requireAuth");

// List needs — used on dashboard and /needs
// ?mine=true returns the current member's own needs
// Default returns needs matching the member's skills (specialist view)
router.get("/", requireAuth, async (req, res) => {
  const { mine } = req.query;

  if (mine === "true") {
    // Lead freelancer view — own posted needs
    const { data, error } = await supabaseAdmin
      .from("needs")
      .select("*")
      .eq("member_id", req.user.id)
      .order("created_at", { ascending: false });

    if (error) return res.status(500).json({ error: "Could not fetch needs." });
    return res.json({ needs: data });
  }

  // Build the base query — active, public needs with poster info
  let query = supabaseAdmin
    .from("needs")
    .select(
      `
      id, created_at, skill_title, skill_tags, description,
      start_date_label, duration_label, commitment_label,
      rate_min, rate_max, rate_notes, visibility, status, member_id,
      poster:member_id (first_name, last_name, role, username)
    `
    )
    .eq("status", "active")
    .in("visibility", ["all"])
    .order("created_at", { ascending: false });

  // ?all=true — return every active need (for the needs browse page)
  // Default — return only needs matching the member's skills (dashboard view)
  if (req.query.all !== "true") {
    const { data: member } = await supabaseAdmin
      .from("members")
      .select("skills")
      .eq("id", req.user.id)
      .single();

    const skills = member?.skills || [];
    if (skills.length === 0) {
      return res.json({ needs: [] });
    }
    query = query.overlaps("skill_tags", skills);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching needs:", error);
    return res.status(500).json({ error: "Could not fetch needs." });
  }

  res.json({ needs: data || [] });
});

// View a single need
router.get("/:id", requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("needs")
    .select(
      `
      *,
      poster:member_id (first_name, last_name, role, username)
    `
    )
    .eq("id", req.params.id)
    .single();

  if (error || !data) return res.status(404).json({ error: "Need not found." });
  res.json({ need: data });
});

// Post a new need
router.post("/", requireAuth, async (req, res) => {
  const {
    skill_title, skill_tags, description,
    start_date_label, duration_label, commitment_label,
    rate_min, rate_max, rate_notes, visibility,
  } = req.body;

  const { data, error } = await supabaseAdmin
    .from("needs")
    .insert({
      member_id: req.user.id,
      skill_title,
      skill_tags,
      description,
      start_date_label,
      duration_label,
      commitment_label,
      rate_min,
      rate_max,
      rate_notes,
      visibility: visibility || "all",
      status: "active",
    })
    .select()
    .single();

  if (error) {
    console.error("Error posting need:", error);
    return res.status(500).json({ error: "Could not post need." });
  }

  res.json({ need: data });
});

// Update a need — only the author can update
router.put("/:id", requireAuth, async (req, res) => {
  // Confirm ownership before updating
  const { data: existing } = await supabaseAdmin
    .from("needs")
    .select("member_id")
    .eq("id", req.params.id)
    .single();

  if (!existing || existing.member_id !== req.user.id) {
    return res.status(403).json({ error: "You can only edit your own needs." });
  }

  const allowed = [
    "skill_title", "skill_tags", "description",
    "start_date_label", "duration_label", "commitment_label",
    "rate_min", "rate_max", "rate_notes", "visibility", "status",
    "invited_member_ids",
  ];

  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  const { data, error } = await supabaseAdmin
    .from("needs")
    .update(updates)
    .eq("id", req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: "Could not update need." });
  res.json({ need: data });
});

module.exports = router;
