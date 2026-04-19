// Seed script — inserts 10 realistic test members + sample needs.
// Safe to run multiple times: skips members whose email already exists.
// Run with: node scripts/seed-members.js

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const { supabaseAdmin } = require("../lib/supabase");

// ── Member data ────────────────────────────────────────────────────────────

const members = [
  {
    email:     "marco.rossi@example.com",
    password:  "seed-password-1",
    first_name: "Marco",
    last_name:  "Rossi",
    username:   "marco-rossi",
    role:       "Brand designer & art director",
    bio:        "I work at the intersection of brand strategy and visual identity. Fifteen years building brands for European startups, cultural institutions, and the occasional football club. I care about craft and I'm direct about what I think will work.",
    location:   "Milan, IT",
    skills:     ["Brand design", "UX / product design", "Illustration"],
    languages:  ["English", "Italian"],
    rate_min:   600,
    rate_max:   900,
    availability_status: "now",
    member_since: "2026-01-10",
  },
  {
    email:     "sophie.vanderberg@example.com",
    password:  "seed-password-2",
    first_name: "Sophie",
    last_name:  "van der Berg",
    username:   "sophie-vanderberg",
    role:       "UX designer & design systems lead",
    bio:        "I design products people actually want to use. Specialised in complex B2B tools, design systems, and getting cross-functional teams aligned before a single pixel gets pushed. Based in Amsterdam, open to remote across Europe.",
    location:   "Amsterdam, NL",
    skills:     ["UX / product design", "No-code / low-code"],
    languages:  ["English", "Dutch", "German"],
    rate_min:   650,
    rate_max:   850,
    availability_status: "from_date",
    availability_date:   "2026-05-15",
    member_since: "2026-01-22",
  },
  {
    email:     "lea.moreau@example.com",
    password:  "seed-password-3",
    first_name: "Léa",
    last_name:  "Moreau",
    username:   "lea-moreau",
    role:       "Copywriter & content strategist",
    bio:        "Words are the last thing people think about and the first thing they read. I write for tech companies, B2B SaaS, and fintech — mostly in English, sometimes in French. I'll push back if the brief is wrong.",
    location:   "Paris, FR",
    skills:     ["Copywriting", "Content strategy", "PR & communications"],
    languages:  ["English", "French"],
    rate_min:   500,
    rate_max:   700,
    availability_status: "now",
    member_since: "2026-02-03",
  },
  {
    email:     "tom.eriksson@example.com",
    password:  "seed-password-4",
    first_name: "Tom",
    last_name:  "Eriksson",
    username:   "tom-eriksson",
    role:       "Full-stack developer",
    bio:        "I build things on the web. Comfortable across the stack — React, Node, Postgres — with a strong preference for keeping things simple. Former agency lead, now independent. I take on about two projects at a time.",
    location:   "Stockholm, SE",
    skills:     ["Web development", "App development", "No-code / low-code"],
    languages:  ["English", "Swedish"],
    rate_min:   700,
    rate_max:   1000,
    availability_status: "unavailable",
    member_since: "2026-02-14",
  },
  {
    email:     "priya.sharma@example.com",
    password:  "seed-password-5",
    first_name: "Priya",
    last_name:  "Sharma",
    username:   "priya-sharma",
    role:       "Motion designer & creative director",
    bio:        "Motion is how ideas move. I've directed title sequences, brand films, and social campaigns for clients from Nike to small indie studios. Strong in After Effects and Cinema 4D. Always interested in unusual briefs.",
    location:   "London, UK",
    skills:     ["Motion design", "3D / CGI", "Video production"],
    languages:  ["English"],
    rate_min:   650,
    rate_max:   900,
    availability_status: "now",
    member_since: "2026-02-20",
  },
  {
    email:     "karim.benzali@example.com",
    password:  "seed-password-6",
    first_name: "Karim",
    last_name:  "Benzali",
    username:   "karim-benzali",
    role:       "Strategy consultant & facilitator",
    bio:        "I help leadership teams make better decisions faster. Workshop design, strategic roadmaps, positioning work. Mostly technology and professional services clients. I've been independent for eight years and I prefer it that way.",
    location:   "Brussels, BE",
    skills:     ["Strategy & consulting", "Project management"],
    languages:  ["English", "French", "Arabic"],
    rate_min:   900,
    rate_max:   1400,
    availability_status: "from_date",
    availability_date:   "2026-06-01",
    member_since: "2026-03-01",
  },
  {
    email:     "anna.kowalski@example.com",
    password:  "seed-password-7",
    first_name: "Anna",
    last_name:  "Kowalski",
    username:   "anna-kowalski",
    role:       "Illustrator & visual storyteller",
    bio:        "Editorial illustration, book covers, branded visual worlds. I work in a loose, expressive style with strong typographic sensibility. Clients include publishers, agencies, and independent founders who want something that doesn't look like everything else.",
    location:   "Warsaw, PL",
    skills:     ["Illustration", "Brand design"],
    languages:  ["English", "Polish"],
    rate_min:   400,
    rate_max:   650,
    availability_status: "now",
    member_since: "2026-03-08",
  },
  {
    email:     "david.muller@example.com",
    password:  "seed-password-8",
    first_name: "David",
    last_name:  "Müller",
    username:   "david-muller",
    role:       "Data analyst & dashboard designer",
    bio:        "I turn messy data into something people can act on. Comfortable in Python, SQL, and Tableau. I've worked embedded in product teams and as an external consultant — both work, depending on what you need.",
    location:   "Berlin, DE",
    skills:     ["Data & analytics", "AI / machine learning"],
    languages:  ["English", "German"],
    rate_min:   600,
    rate_max:   850,
    availability_status: "from_date",
    availability_date:   "2026-05-01",
    member_since: "2026-03-15",
  },
  {
    email:     "clara.santos@example.com",
    password:  "seed-password-9",
    first_name: "Clara",
    last_name:  "Santos",
    username:   "clara-santos",
    role:       "Social media strategist & community builder",
    bio:        "I build audiences for brands that have something real to say. Social strategy, content planning, community management. I don't do vanity metrics. Based in Lisbon, working with clients across Europe.",
    location:   "Lisbon, PT",
    skills:     ["Social media", "Content strategy", "Community & events"],
    languages:  ["English", "Portuguese", "Spanish"],
    rate_min:   400,
    rate_max:   600,
    availability_status: "now",
    member_since: "2026-03-22",
  },
  {
    email:     "james.obrien@example.com",
    password:  "seed-password-10",
    first_name: "James",
    last_name:  "O'Brien",
    username:   "james-obrien",
    role:       "Video director & producer",
    bio:        "Documentary, brand film, interview content — I direct and produce across formats. I've built and led crews of two and twenty. Currently based in Dublin but regularly working in London and across Europe.",
    location:   "Dublin, IE",
    skills:     ["Video production", "Photography"],
    languages:  ["English"],
    rate_min:   700,
    rate_max:   1100,
    availability_status: "unavailable",
    member_since: "2026-04-01",
  },
];

// ── Portfolio items ────────────────────────────────────────────────────────

const portfolioItems = [
  {
    member_username: "marco-rossi",
    title: "Fiorello Restaurant Group — Brand Identity",
    description: "Full visual identity for a group of four restaurants across Milan and Turin. Wordmark, menu system, packaging, and signage.",
    type: "Brand identity",
    year: 2024,
  },
  {
    member_username: "marco-rossi",
    title: "Aether Skincare — Visual World",
    description: "Brand direction for a clean beauty startup launching across EU markets. Photography direction, packaging, digital guidelines.",
    type: "Brand identity",
    year: 2023,
  },
  {
    member_username: "sophie-vanderberg",
    title: "Tidal — B2B Analytics Platform",
    description: "End-to-end UX design for a data analytics platform used by logistics teams. Design system, dashboard architecture, and user research.",
    type: "Product design",
    year: 2025,
  },
  {
    member_username: "sophie-vanderberg",
    title: "Korvai Design System",
    description: "Component library and design tokens for a fintech startup scaling from 3 to 30 engineers. Built in Figma with full documentation.",
    type: "Design systems",
    year: 2024,
  },
  {
    member_username: "lea-moreau",
    title: "Lune — Brand Voice & Website Copy",
    description: "Tone of voice development and full website copy (12 pages) for a Paris-based sustainable travel platform.",
    type: "Copywriting",
    year: 2025,
  },
  {
    member_username: "lea-moreau",
    title: "Forma Capital — Content Strategy",
    description: "Six-month content strategy for a VC firm entering the European market. Editorial calendar, LinkedIn playbook, and investor newsletter.",
    type: "Content strategy",
    year: 2024,
  },
  {
    member_username: "priya-sharma",
    title: "Nike — Air Max Day Campaign",
    description: "Motion direction and After Effects production for a Europe-wide social campaign. Delivered 40+ assets across formats.",
    type: "Motion design",
    year: 2024,
  },
  {
    member_username: "priya-sharma",
    title: "Miro — Product Feature Launch",
    description: "Brand film and social motion package for a new Miro feature launch. Directed three animators across two time zones.",
    type: "Motion design",
    year: 2023,
  },
  {
    member_username: "anna-kowalski",
    title: "Rest & Wander — Editorial Illustrations",
    description: "Series of twelve editorial illustrations for a travel magazine's annual print edition. Ink and digital, loose expressive style.",
    type: "Editorial illustration",
    year: 2025,
  },
  {
    member_username: "anna-kowalski",
    title: "Głos — Book Cover Series",
    description: "Cover illustrations for a Polish literary publisher's 2024 fiction imprint. Five titles, consistent visual language across the series.",
    type: "Book covers",
    year: 2024,
  },
  {
    member_username: "david-muller",
    title: "Schritt Logistics — Operations Dashboard",
    description: "Tableau dashboard suite for a Berlin logistics operator. Consolidated five data sources into one ops view used daily by 80 staff.",
    type: "Data visualisation",
    year: 2025,
  },
  {
    member_username: "james-obrien",
    title: "Thin Air — Documentary Short",
    description: "20-minute documentary about high-altitude mountain rescue. Shot over three weeks in the Alps. Festival selected 2025.",
    type: "Documentary",
    year: 2025,
  },
  {
    member_username: "james-obrien",
    title: "Merrion Hotel — Brand Film",
    description: "A three-minute brand film for Dublin's Merrion Hotel. Shot over two days with a crew of eight.",
    type: "Brand film",
    year: 2024,
  },
];

// ── Feedback ───────────────────────────────────────────────────────────────

const feedbackEntries = [
  {
    reviewer_username: "lea-moreau",
    reviewed_username: "marco-rossi",
    body: "Marco delivered every asset on time and the quality was consistently high — no chasing needed. He flagged a scope issue early in week two before it became a problem. Articulate and calm under pressure, and clients responded to him well. His real strength is translating a vague brief into something specific and visual. He has a clear point of view without being rigid about it.",
    would_collaborate_again: true,
  },
  {
    reviewer_username: "marco-rossi",
    reviewed_username: "lea-moreau",
    body: "Léa delivered two rounds of copy on schedule and handled revisions graciously. She checked in at the right moments and flagged when a brief was unclear rather than guessing. The tone of voice work was exceptional — she nailed the brief on the first attempt. Precise, distinctive, and practical to actually use.",
    would_collaborate_again: true,
  },
  {
    reviewer_username: "sophie-vanderberg",
    reviewed_username: "tom-eriksson",
    body: "Tom flagged early when a design decision had technical implications, which saved real time later. Standups were short and useful — he'd surface issues the same day they appeared. He joined two client calls and was clear and confident without over-promising. His technical rigour without being precious about it made the design system work at a level I hadn't expected.",
    would_collaborate_again: true,
  },
  {
    reviewer_username: "karim-benzali",
    reviewed_username: "david-muller",
    body: "The dashboard David built exceeded what we'd scoped. He sent a short written update every Friday without being asked. He presented the data findings to the exec team and fielded technical questions clearly. His ability to turn messy operational data into something a non-technical board can act on is a rare and valuable skill.",
    would_collaborate_again: true,
  },
];

// ── Sample needs ───────────────────────────────────────────────────────────
// Posted by specific seed members (referenced by username after insertion)

const needs = [
  {
    posted_by_username: "marco-rossi",
    skill_title:   "Copywriter for brand identity project",
    skill_tags:    ["Copywriting", "Content strategy"],
    description:   "We're rolling out a new brand for a Milan-based architecture firm. The visual system is done — we need a copywriter who can develop the tone of voice, write the website copy (about 8 pages), and produce a short brand narrative. Experience with professional services or luxury clients preferred.",
    start_date_label:   "Within 2 weeks",
    duration_label:     "1–4 weeks",
    commitment_label:   "Part-time",
    rate_min: 500,
    rate_max: 700,
    visibility: "all",
  },
  {
    posted_by_username: "priya-sharma",
    skill_title:   "UX designer for short-term product sprint",
    skill_tags:    ["UX / product design"],
    description:   "I'm directing a product launch campaign and need a UX designer to prototype and test a microsite experience. About 2 weeks of focused work. You'll work alongside me and the client's dev team. Strong prototyping skills essential, Figma preferred.",
    start_date_label:   "Immediately",
    duration_label:     "1–4 weeks",
    commitment_label:   "Full-time",
    rate_min: 600,
    rate_max: 850,
    visibility: "all",
  },
  {
    posted_by_username: "karim-benzali",
    skill_title:   "Data analyst for strategy engagement",
    skill_tags:    ["Data & analytics"],
    description:   "I'm running a strategic review for a mid-size logistics company. Need a data analyst who can work with operational datasets (Excel/CSV), build clear visualisations, and present findings to non-technical stakeholders. 3–4 weeks, mostly remote with one on-site week in Brussels.",
    start_date_label:   "Within 2 weeks",
    duration_label:     "1–4 weeks",
    commitment_label:   "Full-time",
    rate_min: 550,
    rate_max: 750,
    visibility: "all",
  },
  {
    posted_by_username: "lea-moreau",
    skill_title:   "Illustrator for editorial series",
    skill_tags:    ["Illustration"],
    description:   "I'm producing a content series for a fintech client — six long-form articles that each need a bespoke header illustration. Loose, editorial style. I'll provide the article text and a brief for each piece. Turnaround is roughly one illustration per week over six weeks.",
    start_date_label:   "Within 2 weeks",
    duration_label:     "1–3 months",
    commitment_label:   "Part-time",
    rate_min: 350,
    rate_max: 500,
    visibility: "all",
  },
];

// ── Main ───────────────────────────────────────────────────────────────────

async function seed() {
  console.log("Starting seed pass…\n");

  // Fetch Kim's member record to use as inviter
  const { data: kim } = await supabaseAdmin
    .from("members")
    .select("id")
    .eq("username", "kim-gilmour")
    .single();

  if (!kim) {
    console.error("Could not find kim-gilmour member record. Run seed-invite.js first.");
    process.exit(1);
  }

  const inviterId = kim.id;
  const insertedMembers = {};

  for (const m of members) {
    process.stdout.write(`  ${m.first_name} ${m.last_name} (${m.email})… `);

    // Skip if auth user already exists
    const { data: existing } = await supabaseAdmin
      .from("members")
      .select("id, username")
      .eq("email", m.email)
      .single();

    if (existing) {
      console.log("already exists, skipping.");
      insertedMembers[existing.username] = existing.id;
      continue;
    }

    // Create auth user
    const { data: authUser, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email:         m.email,
      password:      m.password,
      email_confirm: true,
    });

    if (authErr) {
      console.log(`AUTH ERROR: ${authErr.message}`);
      continue;
    }

    // Insert member record
    const { error: memberErr } = await supabaseAdmin.from("members").insert({
      id:                   authUser.user.id,
      first_name:           m.first_name,
      last_name:            m.last_name,
      email:                m.email,
      username:             m.username,
      role:                 m.role,
      bio:                  m.bio,
      location:             m.location,
      skills:               m.skills,
      languages:            m.languages,
      rate_min:             m.rate_min,
      rate_max:             m.rate_max,
      availability_status:  m.availability_status,
      availability_date:    m.availability_date || null,
      invited_by:           inviterId,
      member_since:         m.member_since,
    });

    if (memberErr) {
      console.log(`MEMBER ERROR: ${memberErr.message}`);
      continue;
    }

    insertedMembers[m.username] = authUser.user.id;
    console.log("done.");
  }

  // ── Needs ──────────────────────────────────────────────────────────────

  console.log("\nSeeding needs…\n");

  for (const n of needs) {
    const memberId = insertedMembers[n.posted_by_username];
    if (!memberId) {
      console.log(`  Skipping need "${n.skill_title}" — poster not found.`);
      continue;
    }

    process.stdout.write(`  "${n.skill_title}"… `);

    // Skip if already exists (same title + member)
    const { data: existingNeed } = await supabaseAdmin
      .from("needs")
      .select("id")
      .eq("member_id", memberId)
      .eq("skill_title", n.skill_title)
      .single();

    if (existingNeed) {
      console.log("already exists, skipping.");
      continue;
    }

    const { error: needErr } = await supabaseAdmin.from("needs").insert({
      member_id:        memberId,
      skill_title:      n.skill_title,
      skill_tags:       n.skill_tags,
      description:      n.description,
      start_date_label: n.start_date_label,
      duration_label:   n.duration_label,
      commitment_label: n.commitment_label,
      rate_min:         n.rate_min,
      rate_max:         n.rate_max,
      visibility:       n.visibility,
      status:           "active",
    });

    if (needErr) {
      console.log(`ERROR: ${needErr.message}`);
    } else {
      console.log("done.");
    }
  }

  // ── Portfolio items ────────────────────────────────────────────────────

  console.log("\nSeeding portfolio items…\n");

  for (const p of portfolioItems) {
    const memberId = insertedMembers[p.member_username];
    if (!memberId) {
      console.log(`  Skipping portfolio item "${p.title}" — member not found.`);
      continue;
    }

    process.stdout.write(`  "${p.title}"… `);

    const { data: existing } = await supabaseAdmin
      .from("portfolio_items")
      .select("id")
      .eq("member_id", memberId)
      .eq("title", p.title)
      .single();

    if (existing) { console.log("already exists, skipping."); continue; }

    const { error } = await supabaseAdmin.from("portfolio_items").insert({
      member_id:   memberId,
      title:       p.title,
      description: p.description,
      type:        p.type,
      year:        p.year,
      og_fetched:  false,
    });

    console.log(error ? `ERROR: ${error.message}` : "done.");
  }

  // ── Feedback ──────────────────────────────────────────────────────────

  console.log("\nSeeding feedback…\n");

  for (const f of feedbackEntries) {
    const reviewerId = insertedMembers[f.reviewer_username];
    const reviewedId = insertedMembers[f.reviewed_username];

    if (!reviewerId || !reviewedId) {
      console.log(`  Skipping feedback ${f.reviewer_username} → ${f.reviewed_username} — member not found.`);
      continue;
    }

    process.stdout.write(`  ${f.reviewer_username} → ${f.reviewed_username}… `);

    const { data: existing } = await supabaseAdmin
      .from("feedback")
      .select("id")
      .eq("reviewer_id", reviewerId)
      .eq("reviewed_id", reviewedId)
      .single();

    if (existing) { console.log("already exists, skipping."); continue; }

    const { error } = await supabaseAdmin.from("feedback").insert({
      reviewer_id:             reviewerId,
      reviewed_id:             reviewedId,
      body:                    f.body,
      would_collaborate_again: f.would_collaborate_again,
      status:                  "approved",
    });

    console.log(error ? `ERROR: ${error.message}` : "done.");
  }

  console.log("\nSeed complete.");
}

seed().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
