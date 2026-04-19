// Feedback routes
// GET  /api/feedback/pending     — feedback awaiting the current member's approval
// POST /api/feedback             — submit feedback (requires prior message thread)
// PUT  /api/feedback/:id/approve — recipient approves feedback
// PUT  /api/feedback/:id/decline — recipient declines feedback

const express = require("express");
const router  = express.Router();
const { supabaseAdmin }            = require("../lib/supabase");
const requireAuth                  = require("../middleware/requireAuth");
const { sendFeedbackNotificationEmail } = require("../lib/email");

// ── Pending feedback awaiting approval ────────────────────────────────────

router.get("/pending", requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("feedback")
    .select(`
      id, created_at, body, would_collaborate_again,
      reviewer:reviewer_id (first_name, last_name, role, username)
    `)
    .eq("reviewed_id", req.user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: "Could not fetch pending feedback." });
  res.json({ pending: data || [] });
});

// ── Submit feedback ───────────────────────────────────────────────────────

router.post("/", requireAuth, async (req, res) => {
  const { reviewed_id, body, would_collaborate_again } = req.body;

  if (!reviewed_id || !body?.trim()) {
    return res.status(400).json({ error: "reviewed_id and body are required." });
  }

  if (reviewed_id === req.user.id) {
    return res.status(400).json({ error: "You cannot leave feedback for yourself." });
  }

  // Require a prior message thread between the two members
  const { data: messages } = await supabaseAdmin
    .from("messages")
    .select("id")
    .or(
      `and(sender_id.eq.${req.user.id},recipient_id.eq.${reviewed_id}),` +
      `and(sender_id.eq.${reviewed_id},recipient_id.eq.${req.user.id})`
    )
    .limit(1);

  if (!messages?.length) {
    return res.status(400).json({
      error: "You can only leave feedback for members you've messaged.",
    });
  }

  // Check for existing feedback in this direction
  const { data: existing } = await supabaseAdmin
    .from("feedback")
    .select("id")
    .eq("reviewer_id", req.user.id)
    .eq("reviewed_id", reviewed_id)
    .single();

  if (existing) {
    return res.status(400).json({ error: "You've already left feedback for this member." });
  }

  const { data: feedback, error } = await supabaseAdmin
    .from("feedback")
    .insert({
      reviewer_id:             req.user.id,
      reviewed_id,
      body:                    body.trim(),
      would_collaborate_again: would_collaborate_again !== false,
      status:                  "pending",
    })
    .select()
    .single();

  if (error) {
    console.error("Error submitting feedback:", error);
    return res.status(500).json({ error: "Could not submit feedback." });
  }

  // Send notification email to recipient
  try {
    const [{ data: reviewer }, { data: recipient }] = await Promise.all([
      supabaseAdmin.from("members").select("first_name, last_name").eq("id", req.user.id).single(),
      supabaseAdmin.from("members").select("first_name, email").eq("id", reviewed_id).single(),
    ]);

    if (reviewer && recipient) {
      await sendFeedbackNotificationEmail({
        reviewerName:       `${reviewer.first_name} ${reviewer.last_name}`,
        recipientFirstName: recipient.first_name,
        recipientEmail:     recipient.email,
      });
    }
  } catch (emailErr) {
    console.error("Feedback notification email failed:", emailErr.message);
  }

  res.json({ feedback });
});

// ── Approve feedback ──────────────────────────────────────────────────────

router.put("/:id/approve", requireAuth, async (req, res) => {
  const { data: feedback } = await supabaseAdmin
    .from("feedback")
    .select("reviewed_id")
    .eq("id", req.params.id)
    .single();

  if (!feedback || feedback.reviewed_id !== req.user.id) {
    return res.status(403).json({ error: "Not authorised." });
  }

  const { error } = await supabaseAdmin
    .from("feedback")
    .update({ status: "approved" })
    .eq("id", req.params.id);

  if (error) return res.status(500).json({ error: "Could not approve feedback." });
  res.json({ success: true });
});

// ── Decline feedback ──────────────────────────────────────────────────────

router.put("/:id/decline", requireAuth, async (req, res) => {
  const { data: feedback } = await supabaseAdmin
    .from("feedback")
    .select("reviewed_id, reviewer_id")
    .eq("id", req.params.id)
    .single();

  if (!feedback || feedback.reviewed_id !== req.user.id) {
    return res.status(403).json({ error: "Not authorised." });
  }

  const { error } = await supabaseAdmin
    .from("feedback")
    .update({ status: "declined" })
    .eq("id", req.params.id);

  if (error) return res.status(500).json({ error: "Could not decline feedback." });

  // Check if this reviewer has 2+ declined entries — flag for founder review
  const { count } = await supabaseAdmin
    .from("feedback")
    .select("id", { count: "exact", head: true })
    .eq("reviewer_id", feedback.reviewer_id)
    .eq("status", "declined");

  if (count >= 2) {
    console.warn(
      `[ADMIN ALERT] Member ${feedback.reviewer_id} has ${count} declined feedback entries.`
    );
  }

  res.json({ success: true });
});

module.exports = router;
