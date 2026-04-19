// FelloWorks backend — Express entry point
// Write clean, well-commented code. Use CSS custom properties for all design tokens.
// Organise files logically. The founder needs to be able to make copy and style edits without assistance.

require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// Allow requests from the frontend origin
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:8080",
    credentials: true,
  })
);

app.use(express.json());

// --- Routes ---
app.use("/api/invites", require("./routes/invites"));
app.use("/api/members", require("./routes/members"));
app.use("/api/needs", require("./routes/needs"));
app.use("/api/messages", require("./routes/messages"));
app.use("/api/shortlist", require("./routes/shortlist"));
app.use("/api/feedback", require("./routes/feedback"));
app.use("/api/portfolio", require("./routes/portfolio"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/og", require("./routes/og")); // Open Graph metadata fetch for portfolio links

// Basic health check — useful for Render/Railway uptime monitoring
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "felloworks-backend" });
});

app.listen(PORT, () => {
  console.log(`FelloWorks backend running on port ${PORT}`);
});
