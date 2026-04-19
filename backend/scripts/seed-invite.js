// Seed script — creates a test invite directly in the database.
// Use during development to test the invite flow without a logged-in member.
// Run with: node scripts/seed-invite.js

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const { supabaseAdmin } = require("../lib/supabase");
const crypto = require("crypto");

async function seedInvite() {
  const token      = crypto.randomBytes(32).toString("hex");
  const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  // First we need a member to be the inviter — insert a placeholder if none exist
  let { data: members } = await supabaseAdmin
    .from("members")
    .select("id")
    .limit(1);

  let inviterId;

  if (!members || members.length === 0) {
    // Create a placeholder auth user + member record for the inviter
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email:          "kim@fello.works",
      password:       "temp-password-change-me",
      email_confirm:  true,
    });

    if (authError) {
      console.error("Could not create placeholder auth user:", authError.message);
      process.exit(1);
    }

    inviterId = authUser.user.id;

    const { error: memberError } = await supabaseAdmin.from("members").insert({
      id:           inviterId,
      first_name:   "Kim",
      last_name:    "Gilmour",
      email:        "kim@fello.works",
      username:     "kim-gilmour",
      role:         "Founder, FelloWorks",
      member_since: new Date().toISOString().split("T")[0],
    });

    if (memberError) {
      console.error("Could not create placeholder member:", memberError.message);
      process.exit(1);
    }

    console.log("Created placeholder inviter member: kim@fello.works");
  } else {
    inviterId = members[0].id;
  }

  // Insert the invite
  const { data: invite, error } = await supabaseAdmin.from("invites").insert({
    inviter_id:    inviterId,
    invitee_email: "kim.gillick@gmail.com",
    token,
    expires_at,
  }).select().single();

  if (error) {
    console.error("Could not create invite:", error.message);
    process.exit(1);
  }

  console.log("\nInvite created successfully.");
  console.log(`Token: ${token}`);
  console.log(`\nTest URL (local):`);
  console.log(`http://192.168.0.26:8080/invite.html?token=${token}\n`);
}

seedInvite();
