// Invite routes
// POST /api/invites          — create a new invite (authenticated member only)
// GET  /api/invites/:token   — validate a token (public, used on /invite/[token] and /welcome)
// POST /api/invites/accept   — accept invite + create member account

const express = require("express");
const router = express.Router();
const { supabaseAdmin } = require("../lib/supabase");
const requireAuth = require("../middleware/requireAuth");
const crypto = require("crypto");
const { sendInviteEmail } = require("../lib/email");

// Validate an invite token — called on page load for /invite/[token] and /welcome
// Returns invite details (inviter name, role, expiry) without exposing sensitive fields
router.get("/:token", async (req, res) => {
  const { token } = req.params;

  const { data: invite, error } = await supabaseAdmin
    .from("invites")
    .select(
      `
      id,
      invitee_email,
      expires_at,
      used_at,
      inviter:inviter_id (
        id, first_name, last_name, role
      )
    `
    )
    .eq("token", token)
    .single();

  if (error || !invite) {
    return res.status(404).json({ error: "Invite not found." });
  }

  if (invite.used_at) {
    return res.status(410).json({ error: "This invitation has already been accepted." });
  }

  if (new Date(invite.expires_at) < new Date()) {
    return res.status(410).json({ error: "This invitation has expired." });
  }

  res.json({ invite });
});

// Create an invite — requires the sender to be authenticated
router.post("/", requireAuth, async (req, res) => {
  const { invitee_email } = req.body;

  if (!invitee_email) {
    return res.status(400).json({ error: "invitee_email is required." });
  }

  // Generate a secure random token
  const token = crypto.randomBytes(32).toString("hex");

  // Invites expire after 7 days
  const expires_at = new Date();
  expires_at.setDate(expires_at.getDate() + 7);

  const { data, error } = await supabaseAdmin.from("invites").insert({
    inviter_id: req.user.id,
    invitee_email,
    token,
    expires_at: expires_at.toISOString(),
  }).select().single();

  if (error) {
    console.error("Error creating invite:", error);
    return res.status(500).json({ error: "Could not create invite." });
  }

  // Fetch the inviter's name to personalise the email
  const { data: inviter } = await supabaseAdmin
    .from("members")
    .select("first_name, last_name")
    .eq("id", req.user.id)
    .single();

  const inviterName = inviter
    ? `${inviter.first_name} ${inviter.last_name}`
    : "A FelloWorks member";

  try {
    await sendInviteEmail({ inviterName, inviteeEmail: invitee_email, token });
  } catch (emailErr) {
    // Log the failure but don't block the response — the invite record exists
    // and the link can be shared manually if needed
    console.error("Invite email failed to send:", emailErr.message);
  }

  res.json({ invite: data });
});

// Accept an invite — creates the Supabase auth user and member record
router.post("/accept", async (req, res) => {
  const { token, first_name, last_name, email, password } = req.body;

  if (!token || !first_name || !last_name || !email || !password) {
    return res.status(400).json({ error: "All fields are required." });
  }

  // Validate the token
  const { data: invite, error: inviteError } = await supabaseAdmin
    .from("invites")
    .select("*")
    .eq("token", token)
    .single();

  if (inviteError || !invite) {
    return res.status(404).json({ error: "Invite not found." });
  }

  if (invite.used_at) {
    return res.status(410).json({ error: "This invitation has already been accepted." });
  }

  if (new Date(invite.expires_at) < new Date()) {
    return res.status(410).json({ error: "This invitation has expired." });
  }

  // Validate that the email matches the invite — security check
  if (invite.invitee_email && invite.invitee_email.toLowerCase() !== email.toLowerCase()) {
    return res.status(403).json({
      error: "The email address you entered does not match the invitation.",
    });
  }

  // Create the Supabase auth user
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Skip confirmation email — invite is the verification
  });

  if (authError) {
    console.error("Error creating auth user:", authError);
    return res.status(500).json({ error: "Could not create account." });
  }

  const userId = authData.user.id;

  // Generate a username slug from first_name + last_name
  // e.g. "Kim Gilmour" → "kim-gilmour". Append random suffix to ensure uniqueness.
  const baseSlug = `${first_name}-${last_name}`
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-");
  const username = `${baseSlug}-${crypto.randomBytes(3).toString("hex")}`;

  // Create the member record
  const { error: memberError } = await supabaseAdmin.from("members").insert({
    id: userId,
    first_name,
    last_name,
    email,
    username,
    invited_by: invite.inviter_id,
    member_since: new Date().toISOString().split("T")[0],
  });

  if (memberError) {
    console.error("Error creating member record:", memberError);
    return res.status(500).json({ error: "Account created but profile setup failed." });
  }

  // Mark the invite as used
  await supabaseAdmin
    .from("invites")
    .update({ used_at: new Date().toISOString() })
    .eq("id", invite.id);

  res.json({ success: true, userId });
});

module.exports = router;
