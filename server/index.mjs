import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dataDir = join(root, ".data");
const dataFile = join(dataDir, "crm.json");
const port = Number(process.env.CRM_API_PORT || 8787);

const now = () => new Date().toISOString();

const seed = {
  leads: [
    {
      id: "lead-peak-roofing",
      businessName: "Peak Shield Roofing",
      niche: "Roofing",
      location: "Austin, TX",
      website: "https://peakshieldroofing.example",
      instagramHandle: "@peakshieldroofing",
      linkedinUrl: "https://linkedin.com/company/peak-shield-roofing",
      email: "owner@peakshieldroofing.example",
      owner: "Mason Holt",
      source: "Instagram search",
      status: "follow_up",
      tags: ["roofing", "texas", "website-redesign"],
      assignedUser: "Raj",
      notes: "Old WordPress site, no booking CTA above the fold. Follow up with before/after homepage mock.",
      setupFee: 1500,
      monthlyFee: 129,
      createdAt: "2026-04-29T09:30:00.000Z",
      updatedAt: "2026-05-03T12:10:00.000Z",
      archived: false
    },
    {
      id: "lead-arctic-air",
      businessName: "Arctic Air HVAC",
      niche: "HVAC",
      location: "Phoenix, AZ",
      website: "https://arcticairphx.example",
      instagramHandle: "@arcticairphx",
      linkedinUrl: "",
      email: "dispatch@arcticairphx.example",
      owner: "Elena Cruz",
      source: "Google Maps",
      status: "interested",
      tags: ["hvac", "phoenix", "chatbot"],
      assignedUser: "Grace",
      notes: "Asked about maintenance and hosting. Needs pricing recap.",
      setupFee: 1500,
      monthlyFee: 129,
      createdAt: "2026-04-30T11:00:00.000Z",
      updatedAt: "2026-05-04T09:15:00.000Z",
      archived: false
    },
    {
      id: "lead-canyon-gutters",
      businessName: "Canyon Gutter Pros",
      niche: "Roofing",
      location: "Denver, CO",
      website: "",
      instagramHandle: "@canyongutterpros",
      linkedinUrl: "",
      email: "",
      owner: "Unknown",
      source: "Instagram comments",
      status: "missing",
      tags: ["gutter", "denver", "missing-email"],
      assignedUser: "Raj",
      notes: "No website found. Good candidate for new build.",
      setupFee: 1500,
      monthlyFee: 129,
      createdAt: "2026-05-02T14:20:00.000Z",
      updatedAt: "2026-05-02T14:20:00.000Z",
      archived: false
    },
    {
      id: "lead-precision-heating",
      businessName: "Precision Heating Co.",
      niche: "HVAC",
      location: "Columbus, OH",
      website: "https://precisionheating.example",
      instagramHandle: "@precisionheatco",
      linkedinUrl: "https://linkedin.com/company/precision-heating-co",
      email: "service@precisionheating.example",
      owner: "Nate Williams",
      source: "LinkedIn",
      status: "contacted",
      tags: ["hvac", "ohio", "slow-site"],
      assignedUser: "Emma",
      notes: "Mentioned slow mobile site and missed form submissions.",
      setupFee: 1500,
      monthlyFee: 129,
      createdAt: "2026-05-01T15:40:00.000Z",
      updatedAt: "2026-05-02T16:30:00.000Z",
      archived: false
    },
    {
      id: "lead-titan-roof",
      businessName: "Titan Roof Rescue",
      niche: "Roofing",
      location: "Tampa, FL",
      website: "https://titanroofrescue.example",
      instagramHandle: "@titanroofrescue",
      linkedinUrl: "",
      email: "hello@titanroofrescue.example",
      owner: "Bianca Price",
      source: "Instagram DM",
      status: "meeting_booked",
      tags: ["roofing", "florida", "storm-damage"],
      assignedUser: "Grace",
      notes: "Discovery call booked. Bring examples of storm restoration pages.",
      setupFee: 1500,
      monthlyFee: 129,
      createdAt: "2026-04-27T13:05:00.000Z",
      updatedAt: "2026-05-04T08:00:00.000Z",
      archived: false
    },
    {
      id: "lead-northline-air",
      businessName: "Northline Air Services",
      niche: "HVAC",
      location: "Charlotte, NC",
      website: "https://northlineair.example",
      instagramHandle: "",
      linkedinUrl: "https://linkedin.com/company/northline-air",
      email: "info@northlineair.example",
      owner: "Samir Patel",
      source: "Cold email list",
      status: "won",
      tags: ["hvac", "north-carolina", "won"],
      assignedUser: "Raj",
      notes: "Closed at standard setup and monthly package. Needs onboarding checklist.",
      setupFee: 1500,
      monthlyFee: 129,
      createdAt: "2026-04-20T10:00:00.000Z",
      updatedAt: "2026-05-01T10:30:00.000Z",
      archived: false
    },
    {
      id: "lead-summit-roof",
      businessName: "Summit Ridge Roofing",
      niche: "Roofing",
      location: "Salt Lake City, UT",
      website: "https://summitridgeroof.example",
      instagramHandle: "@summitridgeroof",
      linkedinUrl: "",
      email: "team@summitridgeroof.example",
      owner: "Kay Morgan",
      source: "Instagram search",
      status: "lost",
      tags: ["roofing", "utah", "price-sensitive"],
      assignedUser: "Emma",
      notes: "Said they already signed with a local agency.",
      setupFee: 1500,
      monthlyFee: 129,
      createdAt: "2026-04-24T11:20:00.000Z",
      updatedAt: "2026-04-30T17:50:00.000Z",
      archived: false
    }
  ],
  outreachEvents: [
    {
      id: "outreach-1",
      leadId: "lead-peak-roofing",
      channel: "instagram",
      accountUsed: "relve.co",
      direction: "outbound",
      status: "follow_up_due",
      sentAt: "2026-05-01T10:00:00.000Z",
      repliedAt: "",
      snippet: "Saw your roofing site and made a few notes on where calls may be leaking.",
      nextFollowUp: "2026-05-05"
    },
    {
      id: "outreach-2",
      leadId: "lead-arctic-air",
      channel: "instagram",
      accountUsed: "relve.co",
      direction: "inbound",
      status: "replied",
      sentAt: "2026-05-02T09:00:00.000Z",
      repliedAt: "2026-05-03T15:45:00.000Z",
      snippet: "They asked what comes with the monthly fee and chatbot setup.",
      nextFollowUp: "2026-05-04"
    },
    {
      id: "outreach-3",
      leadId: "lead-precision-heating",
      channel: "linkedin",
      accountUsed: "Raj LinkedIn",
      direction: "outbound",
      status: "sent",
      sentAt: "2026-05-02T16:30:00.000Z",
      repliedAt: "",
      snippet: "Sent note to Nate about mobile lead flow and seasonal landing pages.",
      nextFollowUp: "2026-05-06"
    },
    {
      id: "outreach-4",
      leadId: "lead-titan-roof",
      channel: "instagram",
      accountUsed: "relve.co",
      direction: "inbound",
      status: "meeting_booked",
      sentAt: "2026-05-03T12:00:00.000Z",
      repliedAt: "2026-05-04T08:00:00.000Z",
      snippet: "Booked discovery call for storm damage website rebuild.",
      nextFollowUp: "2026-05-04"
    },
    {
      id: "outreach-5",
      leadId: "lead-northline-air",
      channel: "email",
      accountUsed: "hello@relve.co",
      direction: "inbound",
      status: "won",
      sentAt: "2026-04-25T10:00:00.000Z",
      repliedAt: "2026-05-01T10:30:00.000Z",
      snippet: "Approved proposal for setup, hosting, maintenance, and chatbot.",
      nextFollowUp: "2026-05-06"
    }
  ],
  campaigns: [
    {
      id: "campaign-roofing-week",
      name: "Roofing local owners - May W1",
      niche: "Roofing",
      locations: ["Austin, TX", "Tampa, FL", "Denver, CO", "Salt Lake City, UT"],
      channelMix: ["instagram", "linkedin", "email"],
      status: "active",
      leadIds: ["lead-peak-roofing", "lead-canyon-gutters", "lead-titan-roof", "lead-summit-roof"],
      createdAt: "2026-05-01T08:00:00.000Z",
      updatedAt: "2026-05-04T08:00:00.000Z"
    },
    {
      id: "campaign-hvac-week",
      name: "HVAC owners - May W1",
      niche: "HVAC",
      locations: ["Phoenix, AZ", "Columbus, OH", "Charlotte, NC"],
      channelMix: ["instagram", "linkedin", "email"],
      status: "active",
      leadIds: ["lead-arctic-air", "lead-precision-heating", "lead-northline-air"],
      createdAt: "2026-05-01T08:00:00.000Z",
      updatedAt: "2026-05-04T09:15:00.000Z"
    }
  ],
  tasks: [
    {
      id: "task-peak-follow",
      leadId: "lead-peak-roofing",
      type: "follow_up",
      dueDate: "2026-05-05",
      status: "open",
      owner: "Raj",
      notes: "Send visual teardown and ask if they want the mockup."
    },
    {
      id: "task-arctic-pricing",
      leadId: "lead-arctic-air",
      type: "reply",
      dueDate: "2026-05-04",
      status: "open",
      owner: "Grace",
      notes: "Clarify $1,500 setup plus $129/month includes hosting, domain, maintenance, chatbot."
    },
    {
      id: "task-titan-call",
      leadId: "lead-titan-roof",
      type: "meeting",
      dueDate: "2026-05-06",
      status: "open",
      owner: "Grace",
      notes: "Prepare roofing website examples and onboarding questions."
    },
    {
      id: "task-northline-onboard",
      leadId: "lead-northline-air",
      type: "onboarding",
      dueDate: "2026-05-06",
      status: "open",
      owner: "Raj",
      notes: "Collect domain access, logo files, service areas, and chatbot FAQ."
    }
  ],
  channels: [
    {
      id: "channel-instagram-relve",
      type: "instagram",
      account: "relve.co",
      status: "active",
      dailyLimit: 70,
      sentToday: 34,
      repliesToday: 2,
      healthScore: 96,
      notes: "Primary Instagram outreach account."
    },
    {
      id: "channel-linkedin-raj",
      type: "linkedin",
      account: "Raj LinkedIn",
      status: "active",
      dailyLimit: 30,
      sentToday: 11,
      repliesToday: 1,
      healthScore: 89,
      notes: "Founder-led LinkedIn profile."
    },
    {
      id: "channel-email-hello",
      type: "email",
      account: "hello@relve.co",
      status: "warming",
      dailyLimit: 50,
      sentToday: 18,
      repliesToday: 1,
      healthScore: 92,
      notes: "Manual recap and proposal follow-ups."
    }
  ],
  meta: {
    version: 1,
    updatedAt: now()
  }
};

async function ensureStore() {
  await mkdir(dataDir, { recursive: true });
  if (!existsSync(dataFile)) {
    await writeFile(dataFile, JSON.stringify(seed, null, 2));
  }
}

async function readStore() {
  await ensureStore();
  const raw = await readFile(dataFile, "utf8");
  return JSON.parse(raw);
}

async function writeStore(store) {
  store.meta = { ...(store.meta || {}), version: 1, updatedAt: now() };
  await writeFile(dataFile, JSON.stringify(store, null, 2));
  return store;
}

function json(res, status, body) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,PATCH,OPTIONS",
    "access-control-allow-headers": "content-type"
  });
  res.end(JSON.stringify(body));
}

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function toCsv(leads) {
  const headers = [
    "businessName",
    "niche",
    "location",
    "website",
    "instagramHandle",
    "linkedinUrl",
    "email",
    "owner",
    "source",
    "status",
    "tags",
    "assignedUser",
    "notes",
    "setupFee",
    "monthlyFee"
  ];
  return [
    headers.join(","),
    ...leads.map((lead) =>
      headers.map((key) => csvEscape(Array.isArray(lead[key]) ? lead[key].join("|") : lead[key])).join(",")
    )
  ].join("\n");
}

function parseCsvLine(line) {
  const cells = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];
    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      i += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      cells.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells;
}

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];
  const headers = parseCsvLine(lines[0]).map((header) => header.trim());
  return lines.slice(1).map((line, index) => {
    const values = parseCsvLine(line);
    const lead = Object.fromEntries(headers.map((header, cellIndex) => [header, values[cellIndex] ?? ""]));
    const idBase = lead.businessName || `Imported lead ${index + 1}`;
    return {
      id: `lead-${idBase.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${Date.now()}-${index}`,
      businessName: lead.businessName || "Untitled business",
      niche: lead.niche || "Local services",
      location: lead.location || "",
      website: lead.website || "",
      instagramHandle: lead.instagramHandle || lead.instagram || "",
      linkedinUrl: lead.linkedinUrl || lead.linkedin || "",
      email: lead.email || "",
      owner: lead.owner || "",
      source: lead.source || "CSV import",
      status: lead.status || "missing",
      tags: lead.tags ? lead.tags.split(/[|;]/).map((tag) => tag.trim()).filter(Boolean) : [],
      assignedUser: lead.assignedUser || "Unassigned",
      notes: lead.notes || "",
      setupFee: Number(lead.setupFee || 1500),
      monthlyFee: Number(lead.monthlyFee || 129),
      createdAt: now(),
      updatedAt: now(),
      archived: false
    };
  });
}

function computeAnalytics(store) {
  const activeLeads = store.leads.filter((lead) => !lead.archived);
  const leadIdsWithOutreach = new Set(store.outreachEvents.map((event) => event.leadId));
  const replies = store.outreachEvents.filter((event) => event.repliedAt || event.status === "replied").length;
  const interested = activeLeads.filter((lead) => ["interested", "meeting_booked", "won"].includes(lead.status)).length;
  const meetings = activeLeads.filter((lead) => ["meeting_booked", "won"].includes(lead.status)).length;
  const won = activeLeads.filter((lead) => lead.status === "won");
  const followUpsDue = store.tasks.filter((task) => task.status === "open").length;

  const byDate = {};
  for (const event of store.outreachEvents) {
    const date = (event.sentAt || now()).slice(0, 10);
    byDate[date] ||= { date, instagram: 0, linkedin: 0, email: 0, call: 0, replies: 0 };
    byDate[date][event.channel] += 1;
    if (event.repliedAt) byDate[date].replies += 1;
  }

  return {
    totalLeads: activeLeads.length,
    reachedOut: leadIdsWithOutreach.size,
    missingOutreach: activeLeads.filter((lead) => !leadIdsWithOutreach.has(lead.id) && lead.status === "missing").length,
    replies,
    replyRate: leadIdsWithOutreach.size ? Number(((replies / leadIdsWithOutreach.size) * 100).toFixed(1)) : 0,
    interested,
    meetings,
    wonRevenue: won.reduce((sum, lead) => sum + Number(lead.setupFee || 0), 0),
    projectedMrr: won.reduce((sum, lead) => sum + Number(lead.monthlyFee || 0), 0),
    followUpsDue,
    channelVolume: Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date))
  };
}

async function readBody(req) {
  let body = "";
  for await (const chunk of req) body += chunk;
  if (!body) return {};
  const contentType = req.headers["content-type"] || "";
  if (contentType.includes("application/json")) return JSON.parse(body);
  return { text: body };
}

function routePath(req) {
  const url = new URL(req.url || "/", "http://localhost");
  return { pathname: url.pathname, searchParams: url.searchParams };
}

createServer(async (req, res) => {
  try {
    if (req.method === "OPTIONS") return json(res, 200, {});
    const { pathname } = routePath(req);
    const store = await readStore();

    if (req.method === "GET" && pathname === "/api/crm") {
      return json(res, 200, { ...store, analytics: computeAnalytics(store) });
    }

    if (req.method === "GET" && pathname === "/api/export/json") {
      return json(res, 200, store);
    }

    if (req.method === "GET" && pathname === "/api/export/csv") {
      res.writeHead(200, {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": "attachment; filename=grace-insta-crm-leads.csv"
      });
      return res.end(toCsv(store.leads.filter((lead) => !lead.archived)));
    }

    if (req.method === "POST" && pathname === "/api/import/csv") {
      const body = await readBody(req);
      const imported = parseCsv(body.text || body.csv || "");
      store.leads.push(...imported);
      await writeStore(store);
      return json(res, 200, { imported: imported.length, leads: imported, analytics: computeAnalytics(store) });
    }

    if (req.method === "POST" && pathname === "/api/leads") {
      const body = await readBody(req);
      const lead = {
        id: body.id || `lead-${Date.now()}`,
        businessName: body.businessName || "Untitled business",
        niche: body.niche || "Local services",
        location: body.location || "",
        website: body.website || "",
        instagramHandle: body.instagramHandle || "",
        linkedinUrl: body.linkedinUrl || "",
        email: body.email || "",
        owner: body.owner || "",
        source: body.source || "Manual",
        status: body.status || "missing",
        tags: Array.isArray(body.tags) ? body.tags : [],
        assignedUser: body.assignedUser || "Unassigned",
        notes: body.notes || "",
        setupFee: Number(body.setupFee || 1500),
        monthlyFee: Number(body.monthlyFee || 129),
        createdAt: now(),
        updatedAt: now(),
        archived: false
      };
      store.leads.unshift(lead);
      await writeStore(store);
      return json(res, 201, { lead, analytics: computeAnalytics(store) });
    }

    const leadMatch = pathname.match(/^\/api\/leads\/([^/]+)$/);
    if (req.method === "PATCH" && leadMatch) {
      const body = await readBody(req);
      const lead = store.leads.find((item) => item.id === leadMatch[1]);
      if (!lead) return json(res, 404, { error: "Lead not found" });
      Object.assign(lead, body, { updatedAt: now() });
      await writeStore(store);
      return json(res, 200, { lead, analytics: computeAnalytics(store) });
    }

    if (req.method === "POST" && pathname === "/api/outreach") {
      const body = await readBody(req);
      const event = {
        id: body.id || `outreach-${Date.now()}`,
        leadId: body.leadId,
        channel: body.channel || "instagram",
        accountUsed: body.accountUsed || "relve.co",
        direction: body.direction || "outbound",
        status: body.status || "sent",
        sentAt: body.sentAt || now(),
        repliedAt: body.repliedAt || "",
        snippet: body.snippet || "",
        nextFollowUp: body.nextFollowUp || ""
      };
      store.outreachEvents.unshift(event);
      const lead = store.leads.find((item) => item.id === event.leadId);
      if (lead && lead.status === "missing") {
        lead.status = event.status === "replied" ? "interested" : "contacted";
        lead.updatedAt = now();
      }
      await writeStore(store);
      return json(res, 201, { event, analytics: computeAnalytics(store) });
    }

    if (req.method === "POST" && pathname === "/api/tasks") {
      const body = await readBody(req);
      const task = {
        id: body.id || `task-${Date.now()}`,
        leadId: body.leadId,
        type: body.type || "follow_up",
        dueDate: body.dueDate || new Date().toISOString().slice(0, 10),
        status: body.status || "open",
        owner: body.owner || "Unassigned",
        notes: body.notes || ""
      };
      store.tasks.unshift(task);
      await writeStore(store);
      return json(res, 201, { task, analytics: computeAnalytics(store) });
    }

    const taskMatch = pathname.match(/^\/api\/tasks\/([^/]+)$/);
    if (req.method === "PATCH" && taskMatch) {
      const body = await readBody(req);
      const task = store.tasks.find((item) => item.id === taskMatch[1]);
      if (!task) return json(res, 404, { error: "Task not found" });
      Object.assign(task, body);
      await writeStore(store);
      return json(res, 200, { task, analytics: computeAnalytics(store) });
    }

    return json(res, 404, { error: "Route not found" });
  } catch (error) {
    console.error(error);
    return json(res, 500, { error: error.message || "Server error" });
  }
}).listen(port, "127.0.0.1", () => {
  console.log(`Grace Insta CRM API running at http://127.0.0.1:${port}`);
});
