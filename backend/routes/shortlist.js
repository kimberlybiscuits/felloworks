// Shortlist routes
// GET    /api/shortlist        — get the current member's saved members
// POST   /api/shortlist        — save a member to shortlist
// DELETE /api/shortlist/:savedId — remove a member from shortlist

const express = require("express");
const router = express.Router();
const { supabaseAdmin } = require("../lib/supabase");
const requireAuth = require("../middleware/requireAuth");

// Get shortlist
router.get("/", requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("shortlist_items")
    .select(
      `
      id, created_at,
      saved_member:saved_member_id (
        id, username, first_name, last_name, role, location,
        availability_status, availability_date, rate_min, rate_max, languages
      )
    `
    )
    .eq("member_id", req.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching shortlist:", error);
    return res.status(500).json({ error: "Could not fetch shortlist." });
  }

  res.json({ shortlist: data });
});

// Add to shortlist
router.post("/", requireAuth, async (req, res) => {
  const { saved_member_id } = req.body;

  if (!saved_member_id) {
    return res.status(400).json({ error: "saved_member_id is required." });
  }

  if (saved_member_id === req.user.id) {
    return res.status(400).json({ error: "You cannot shortlist yourself." });
  }

  // Upsert to avoid duplicates
  const { data, error } = await supabaseAdmin
    .from("shortlist_items")
    .upsert(
      { member_id: req.user.id, saved_member_id },
      { onConflict: "member_id,saved_member_id" }
    )
    .select()
    .single();

  if (error) {
    console.error("Error adding to shortlist:", error);
    return res.status(500).json({ error: "Could not add to shortlist." });
  }

  res.json({ item: data });
});

// Remove from shortlist
router.delete("/:savedId", requireAuth, async (req, res) => {
  const { error } = await supabaseAdmin
    .from("shortlist_items")
    .delete()
    .eq("member_id", req.user.id)
    .eq("saved_member_id", req.params.savedId);

  if (error) {
    console.error("Error removing from shortlist:", error);
    return res.status(500).json({ error: "Could not remove from shortlist." });
  }

  res.json({ success: true });
});

module.exports = router;
