// Admin routes — beta only
// All routes require authentication + admin email.
//
// GET  /api/admin/members        — full member list
// GET  /api/admin/invites        — all invites (pending, used, expired)
// POST /api/admin/invites        — create an invite on behalf of a member
// GET  /api/admin/stats          — basic activity counts

const express      = require("express");
const router       = express.Router();
const { supabaseAdmin } = require("../lib/supabase");
const requireAuth  = require("../middleware/requireAuth");
const requireAdmin = require("../middleware/requireAdmin");
const crypto       = require("crypto");
const { sendInviteEmail } = require("../lib/email");

// All admin routes require auth + admin status
router.use(requireAuth, requireAdmin);

// ── Member list ────────────────────────────────────────────────────────

router.get("/members", async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("members")
    .select(
      `id, first_name, last_name, email, username, role, member_since,
       skills, availability_status, created_at,
       inviter:invited_by (first_name, last_name)`
    )
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: "Could not fetch members." });
  res.json({ members: data });
});

// ── Invite list ────────────────────────────────────────────────────────

router.get("/invites", async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("invites")
    .select(
      `id, created_at, invitee_email, token, expires_at, used_at,
       inviter:inviter_id (first_name, last_name, email)`
    )
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: "Could not fetch invites." });
  res.json({ invites: data });
});

// ── Create invite (admin can invite on behalf of any member) ───────────

router.post("/invites", async (req, res) => {
  const { invitee_email, inviter_id } = req.body;

  if (!invitee_email) {
    return res.status(400).json({ error: "invitee_email is required." });
  }

  // Default inviter to the admin user if not specified
  const senderId = inviter_id || req.user.id;

  const token      = crypto.randomBytes(32).toString("hex");
  const expires_at = new Date();
  expires_at.setDate(expires_at.getDate() + 7);

  const { data: invite, error } = await supabaseAdmin
    .from("invites")
    .insert({ inviter_id: senderId, invitee_email, token, expires_at })
    .select()
    .single();

  if (error) return res.status(500).json({ error: "Could not create invite." });

  // Fetch inviter name for the email
  const { data: inviter } = await supabaseAdmin
    .from("members")
    .select("first_name, last_name")
    .eq("id", senderId)
    .single();

  const inviterName = inviter
    ? `${inviter.first_name} ${inviter.last_name}`
    : "FelloWorks";

  try {
    await sendInviteEmail({ inviterName, inviteeEmail: invitee_email, token });
  } catch (emailErr) {
    console.error("Admin invite email failed:", emailErr.message);
  }

  res.json({ invite });
});

// ── Stats ──────────────────────────────────────────────────────────────

router.get("/stats", async (req, res) => {
  const [members, invites, needs, messages] = await Promise.all([
    supabaseAdmin.from("members").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("invites").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("needs").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("messages").select("id", { count: "exact", head: true }),
  ]);

  // Pending invites = created but not used and not expired
  const { count: pendingCount } = await supabaseAdmin
    .from("invites")
    .select("id", { count: "exact", head: true })
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString());

  res.json({
    members:       members.count  ?? 0,
    invites_total: invites.count  ?? 0,
    invites_pending: pendingCount ?? 0,
    needs:         needs.count    ?? 0,
    messages:      messages.count ?? 0,
  });
});

module.exports = router;
