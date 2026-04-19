// requireAdmin middleware
// Restricts a route to admin email addresses only.
// Add additional emails to ADMIN_EMAILS as needed.
// Must be used after requireAuth (which sets req.user).

const ADMIN_EMAILS = [
  "kim@fello.works",
  "kim.gillick@gmail.com", // also allow the Gmail for local testing
];

function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated." });
  }

  if (!ADMIN_EMAILS.includes(req.user.email)) {
    return res.status(403).json({ error: "Not authorised." });
  }

  next();
}

module.exports = requireAdmin;
