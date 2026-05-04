// POST /api/cron/abandonment — called by an external cron (e.g. cron-job.org, daily)
// Finds members who joined 24–48 hours ago and still have an incomplete profile
// (missing role, skills, or availability) and sends them a single nudge email.
// Protected by CRON_SECRET env var so it can't be triggered by members.

const express = require("express");
const router  = express.Router();
const { supabaseAdmin }         = require("../lib/supabase");
const { sendAbandonmentEmail }  = require("../lib/email");

router.post("/abandonment", async (req, res) => {
  const secret = req.headers["x-cron-secret"];
  if (!secret || secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: "Unauthorised." });
  }

  const now     = new Date();
  const from    = new Date(now - 48 * 60 * 60 * 1000).toISOString(); // 48h ago
  const to      = new Date(now - 24 * 60 * 60 * 1000).toISOString(); // 24h ago

  // Find members who joined in that window and haven't completed their profile
  const { data: members, error } = await supabaseAdmin
    .from("members")
    .select("id, first_name, email, role, bio, skills, availability_status, abandonment_email_sent")
    .gte("created_at", from)
    .lte("created_at", to)
    .eq("abandonment_email_sent", false);

  if (error) {
    console.error("Abandonment cron query failed:", error.message);
    return res.status(500).json({ error: "Query failed." });
  }

  let sent = 0;
  for (const m of members || []) {
    const isComplete =
      m.role?.trim() &&
      m.bio?.trim() &&
      (m.skills || []).length > 0 &&
      m.availability_status;

    if (isComplete) continue; // profile is done — skip

    try {
      await sendAbandonmentEmail({ firstName: m.first_name, email: m.email });
      await supabaseAdmin
        .from("members")
        .update({ abandonment_email_sent: true })
        .eq("id", m.id);
      sent++;
    } catch (err) {
      console.error(`Abandonment email failed for ${m.id}:`, err.message);
    }
  }

  res.json({ checked: (members || []).length, sent });
});

module.exports = router;
