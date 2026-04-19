// Message routes
// GET  /api/messages        — list all threads for the current member
// GET  /api/messages/:id    — get a single thread (messages between two members)
// POST /api/messages        — send a message

const express = require("express");
const router = express.Router();
const { supabaseAdmin } = require("../lib/supabase");
const requireAuth = require("../middleware/requireAuth");

// List message threads — groups messages by conversation partner
router.get("/", requireAuth, async (req, res) => {
  const userId = req.user.id;

  // Fetch all messages where the current member is sender or recipient
  const { data, error } = await supabaseAdmin
    .from("messages")
    .select(
      `
      id, created_at, body, read_at,
      sender:sender_id (id, first_name, last_name, username),
      recipient:recipient_id (id, first_name, last_name, username)
    `
    )
    .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching messages:", error);
    return res.status(500).json({ error: "Could not fetch messages." });
  }

  // Group into threads by conversation partner
  const threads = {};
  for (const msg of data) {
    const partner =
      msg.sender.id === userId ? msg.recipient : msg.sender;
    if (!threads[partner.id]) {
      threads[partner.id] = { partner, messages: [], unread: 0 };
    }
    threads[partner.id].messages.push(msg);
    // Count unread messages sent to the current member
    if (msg.recipient.id === userId && !msg.read_at) {
      threads[partner.id].unread += 1;
    }
  }

  res.json({ threads: Object.values(threads) });
});

// Get a thread between the current member and another member
router.get("/:partnerId", requireAuth, async (req, res) => {
  const userId = req.user.id;
  const { partnerId } = req.params;

  const { data, error } = await supabaseAdmin
    .from("messages")
    .select(
      `
      id, created_at, body, read_at,
      sender:sender_id (id, first_name, last_name),
      recipient:recipient_id (id, first_name, last_name)
    `
    )
    .or(
      `and(sender_id.eq.${userId},recipient_id.eq.${partnerId}),and(sender_id.eq.${partnerId},recipient_id.eq.${userId})`
    )
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching thread:", error);
    return res.status(500).json({ error: "Could not fetch thread." });
  }

  // Mark messages sent to the current member as read
  const unreadIds = data
    .filter((m) => m.recipient.id === userId && !m.read_at)
    .map((m) => m.id);

  if (unreadIds.length > 0) {
    await supabaseAdmin
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .in("id", unreadIds);
  }

  res.json({ messages: data });
});

// Send a message
router.post("/", requireAuth, async (req, res) => {
  const { recipient_id, body } = req.body;

  if (!recipient_id || !body?.trim()) {
    return res.status(400).json({ error: "recipient_id and body are required." });
  }

  // Prevent messaging yourself
  if (recipient_id === req.user.id) {
    return res.status(400).json({ error: "You cannot message yourself." });
  }

  const { data, error } = await supabaseAdmin
    .from("messages")
    .insert({
      sender_id: req.user.id,
      recipient_id,
      body: body.trim(),
    })
    .select()
    .single();

  if (error) {
    console.error("Error sending message:", error);
    return res.status(500).json({ error: "Could not send message." });
  }

  res.json({ message: data });
});

module.exports = router;
