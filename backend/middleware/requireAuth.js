// requireAuth middleware
// Validates the Supabase JWT sent in the Authorization header.
// Attach to any route that requires a logged-in member.
// Usage: router.get("/protected", requireAuth, handler)

const { supabase } = require("../lib/supabase");

async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Not authenticated." });
  }

  const token = authHeader.replace("Bearer ", "");

  // Verify the token with Supabase and get the user
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data?.user) {
    return res.status(401).json({ error: "Invalid or expired session." });
  }

  // Attach the user to the request for use in route handlers
  req.user = data.user;
  next();
}

module.exports = requireAuth;
