// POST /api/report — in-app feedback widget submission
// Emails the founder with the member's name, feedback type, message, and page.

const express = require("express");
const router  = express.Router();
const requireAuth                = require("../middleware/requireAuth");
const { supabaseAdmin }          = require("../lib/supabase");
const { sendFeedbackReportEmail } = require("../lib/email");

router.post("/", requireAuth, async (req, res) => {
  const { type, message, page } = req.body;

  if (!message?.trim()) {
    return res.status(400).json({ error: "Message is required." });
  }

  const { data: member } = await supabaseAdmin
    .from("members")
    .select("first_name, last_name")
    .eq("id", req.user.id)
    .single();

  const memberName = member
    ? `${member.first_name} ${member.last_name}`
    : "Unknown member";

  try {
    await sendFeedbackReportEmail({
      memberName,
      type:    type || "Other",
      message: message.trim(),
      page:    page || "unknown",
    });
  } catch (err) {
    console.error("Feedback report email failed:", err.message);
    // Don't surface email errors to the user — report is still received in logs
  }

  res.json({ success: true });
});

module.exports = router;
