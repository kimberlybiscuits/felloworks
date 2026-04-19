// Open Graph metadata fetch
// POST /api/og — accepts a URL, fetches OG tags server-side, returns title/description/image
// Used when a member pastes a portfolio link — auto-fills the form fields.
// Server-side fetch is required because browsers block cross-origin requests to arbitrary URLs.

const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/requireAuth");

router.post("/", requireAuth, async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: "url is required." });
  }

  // Basic URL validation — must be http or https
  let parsed;
  try {
    parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new Error("Invalid protocol");
    }
  } catch {
    return res.status(400).json({ error: "Invalid URL." });
  }

  try {
    // node-fetch is ESM-only in v3 — dynamically import it
    const { default: fetch } = await import("node-fetch");

    const response = await fetch(parsed.href, {
      headers: {
        // Present as a browser to improve OG tag availability on most sites
        "User-Agent":
          "Mozilla/5.0 (compatible; FelloWorks/1.0; +https://fello.works)",
      },
      // Timeout after 5 seconds — don't block the user waiting for slow sites
      signal: AbortSignal.timeout(5000),
    });

    const html = await response.text();

    // Extract OG tags with simple regex — no dependency on a full HTML parser
    const get = (property) => {
      const match =
        html.match(
          new RegExp(
            `<meta[^>]+property=["']og:${property}["'][^>]+content=["']([^"']+)["']`,
            "i"
          )
        ) ||
        html.match(
          new RegExp(
            `<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:${property}["']`,
            "i"
          )
        );
      return match ? match[1] : null;
    };

    // Fall back to <title> if og:title is absent
    const titleFallback = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] ?? null;

    res.json({
      title: get("title") || titleFallback,
      description: get("description"),
      image: get("image"),
    });
  } catch (err) {
    // Fetch failed — the frontend will fall back to manual entry
    console.error("OG fetch failed:", err.message);
    res.json({ title: null, description: null, image: null });
  }
});

module.exports = router;
