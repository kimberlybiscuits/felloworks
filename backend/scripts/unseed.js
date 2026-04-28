// Removes all seed members and their associated data from Supabase.
// Run with: node scripts/unseed.js

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const { supabaseAdmin } = require("../lib/supabase");

const SEED_EMAILS = [
  "marco.rossi@example.com",
  "sophie.vanderberg@example.com",
  "lea.moreau@example.com",
  "tom.eriksson@example.com",
  "priya.sharma@example.com",
  "karim.benzali@example.com",
  "anna.kowalski@example.com",
  "david.muller@example.com",
  "clara.santos@example.com",
  "james.obrien@example.com",
];

async function unseed() {
  console.log("Looking up seed member IDs…");

  const { data: members, error: lookupErr } = await supabaseAdmin
    .from("members")
    .select("id, email")
    .in("email", SEED_EMAILS);

  if (lookupErr) {
    console.error("Lookup failed:", lookupErr.message);
    process.exit(1);
  }

  if (!members || members.length === 0) {
    console.log("No seed members found — nothing to remove.");
    return;
  }

  console.log(`Found ${members.length} seed member(s):`, members.map(m => m.email));
  const ids = members.map(m => m.id);

  // Delete dependent data first (FK constraints)
  const tables = ["messages", "shortlist", "portfolio", "feedback", "needs", "invites"];
  for (const table of tables) {
    const col = table === "invites" ? "inviter_id" : "member_id";
    const { error } = await supabaseAdmin.from(table).delete().in(col, ids);
    if (error) console.warn(`  Warning deleting from ${table}:`, error.message);
    else console.log(`  Cleared ${table}`);
  }

  // Delete member records
  const { error: memberErr } = await supabaseAdmin
    .from("members")
    .delete()
    .in("id", ids);
  if (memberErr) {
    console.error("Failed to delete member records:", memberErr.message);
  } else {
    console.log("  Deleted member records");
  }

  // Delete Supabase auth users
  for (const id of ids) {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (error) console.warn(`  Warning deleting auth user ${id}:`, error.message);
  }
  console.log("  Deleted auth users");

  console.log("Done. Seed members removed.");
}

unseed().catch(console.error);
