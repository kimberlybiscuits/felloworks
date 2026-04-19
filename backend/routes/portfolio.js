// Portfolio routes
// GET  /api/portfolio           — get all portfolio items for the current member
// POST /api/portfolio           — add a new portfolio item
// PUT  /api/portfolio/:id       — update an item (owner only)
// DELETE /api/portfolio/:id     — delete an item (owner only)

const express = require("express");
const router  = express.Router();
const { supabaseAdmin } = require("../lib/supabase");
const requireAuth = require("../middleware/requireAuth");

// Get all portfolio items for the current member (no cap — edit screen needs all)
router.get("/", requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("portfolio_items")
    .select("*")
    .eq("member_id", req.user.id)
    .order("year", { ascending: false });

  if (error) {
    console.error("Error fetching portfolio:", error);
    return res.status(500).json({ error: "Could not fetch portfolio." });
  }

  res.json({ portfolio: data });
});

// Add a portfolio item
router.post("/", requireAuth, async (req, res) => {
  const { title, description, type, year, project_url, image_url } = req.body;

  if (!title) {
    return res.status(400).json({ error: "title is required." });
  }

  const { data, error } = await supabaseAdmin
    .from("portfolio_items")
    .insert({
      member_id: req.user.id,
      title,
      description,
      type,
      year,
      project_url,
      image_url,
      og_fetched: !!image_url,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating portfolio item:", error);
    return res.status(500).json({ error: "Could not save portfolio item." });
  }

  res.json({ item: data });
});

// Update a portfolio item — owner only
router.put("/:id", requireAuth, async (req, res) => {
  // Confirm ownership
  const { data: existing } = await supabaseAdmin
    .from("portfolio_items")
    .select("member_id")
    .eq("id", req.params.id)
    .single();

  if (!existing || existing.member_id !== req.user.id) {
    return res.status(403).json({ error: "You can only edit your own portfolio items." });
  }

  const allowed = ["title", "description", "type", "year", "project_url", "image_url"];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  const { data, error } = await supabaseAdmin
    .from("portfolio_items")
    .update(updates)
    .eq("id", req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: "Could not update portfolio item." });
  res.json({ item: data });
});

// Delete a portfolio item — owner only
router.delete("/:id", requireAuth, async (req, res) => {
  const { data: existing } = await supabaseAdmin
    .from("portfolio_items")
    .select("member_id")
    .eq("id", req.params.id)
    .single();

  if (!existing || existing.member_id !== req.user.id) {
    return res.status(403).json({ error: "You can only delete your own portfolio items." });
  }

  const { error } = await supabaseAdmin
    .from("portfolio_items")
    .delete()
    .eq("id", req.params.id);

  if (error) return res.status(500).json({ error: "Could not delete portfolio item." });
  res.json({ success: true });
});

module.exports = router;
