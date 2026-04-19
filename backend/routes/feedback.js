// Feedback routes
// GET  /api/feedback/pending   — feedback prompts awaiting the current member's response
// POST /api/feedback           — submit feedback for a collaborator

const express = require("express");
const router = express.Router();
const { supabaseAdmin } = require("../lib/supabase");
const requireAuth = require("../middleware/requireAuth");

// Get pending feedback requests for the current member
// (Surfaced on the dashboard until completed — per spec section 5)
router.get("/pending", requireAuth, async (req, res) => {
  // For MVP: pending feedback is represented by feedback records with empty text responses
  // Full collaboration-tracking (marking a project complete) is out of MVP scope.
  // This endpoint is a placeholder that returns an empty list until that flow is built.
  res.json({ pending: [] });
});

// Submit feedback
router.post("/", requireAuth, async (req, res) => {
  const {
    reviewed_id,
    collaboration_context,
    q1_deliver,
    q2_communicate,
    q3_client_facing,
    q4_strongest,
  } = req.body;

  if (!reviewed_id || !q1_deliver || !q2_communicate || !q3_client_facing || !q4_strongest) {
    return res.status(400).json({
      error: "All four feedback responses and reviewed_id are required.",
    });
  }

  // Prevent leaving feedback for yourself
  if (reviewed_id === req.user.id) {
    return res.status(400).json({ error: "You cannot leave feedback for yourself." });
  }

  const { data, error } = await supabaseAdmin
    .from("feedback")
    .insert({
      reviewer_id: req.user.id,
      reviewed_id,
      collaboration_context,
      q1_deliver,
      q2_communicate,
      q3_client_facing,
      q4_strongest,
      visible_on_profile: true,
    })
    .select()
    .single();

  if (error) {
    console.error("Error submitting feedback:", error);
    return res.status(500).json({ error: "Could not submit feedback." });
  }

  res.json({ feedback: data });
});

module.exports = router;
