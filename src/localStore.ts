import type { Analytics, CrmData, Lead, NewLeadInput, OutreachEvent, Task } from "./types";

const storageKey = "grace-insta-crm-data";

const now = () => new Date().toISOString();

const seedData: CrmData = {
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
      id: "outreach-4",
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
      locations: ["Austin, TX", "Tampa, FL", "Denver, CO"],
      channelMix: ["instagram", "linkedin", "email"],
      status: "active",
      leadIds: ["lead-peak-roofing", "lead-canyon-gutters", "lead-titan-roof"],
      createdAt: "2026-05-01T08:00:00.000Z",
      updatedAt: "2026-05-04T08:00:00.000Z"
    },
    {
      id: "campaign-hvac-week",
      name: "HVAC owners - May W1",
      niche: "HVAC",
      locations: ["Phoenix, AZ", "Charlotte, NC"],
      channelMix: ["instagram", "linkedin", "email"],
      status: "active",
      leadIds: ["lead-arctic-air", "lead-northline-air"],
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
  analytics: {
    totalLeads: 0,
    reachedOut: 0,
    missingOutreach: 0,
    replies: 0,
    replyRate: 0,
    interested: 0,
    meetings: 0,
    wonRevenue: 0,
    projectedMrr: 0,
    followUpsDue: 0,
    channelVolume: []
  },
  meta: { version: 1, updatedAt: now() }
};

export function readLocalCrm(): CrmData {
  const stored = window.localStorage.getItem(storageKey);
  if (stored) return withAnalytics(JSON.parse(stored) as CrmData);
  return writeLocalCrm(seedData);
}

export function writeLocalCrm(data: CrmData): CrmData {
  const next = withAnalytics({ ...data, meta: { version: 1, updatedAt: now() } });
  window.localStorage.setItem(storageKey, JSON.stringify(next));
  return next;
}

export function createLocalLead(input: NewLeadInput) {
  const data = readLocalCrm();
  const lead: Lead = {
    id: `lead-${Date.now()}`,
    businessName: input.businessName || "Untitled business",
    niche: input.niche || "Local services",
    location: input.location || "",
    website: input.website || "",
    instagramHandle: input.instagramHandle || "",
    linkedinUrl: input.linkedinUrl || "",
    email: input.email || "",
    owner: input.owner || "",
    source: input.source || "Manual",
    status: "missing",
    tags: input.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
    assignedUser: input.assignedUser || "Unassigned",
    notes: input.notes || "",
    setupFee: 1500,
    monthlyFee: 129,
    createdAt: now(),
    updatedAt: now(),
    archived: false
  };
  data.leads.unshift(lead);
  const next = writeLocalCrm(data);
  return { lead, analytics: next.analytics };
}

export function patchLocalLead(leadId: string, patch: Partial<Lead>) {
  const data = readLocalCrm();
  const lead = data.leads.find((item) => item.id === leadId);
  if (!lead) throw new Error("Lead not found");
  Object.assign(lead, patch, { updatedAt: now() });
  const next = writeLocalCrm(data);
  return { lead, analytics: next.analytics };
}

export function logLocalOutreach(payload: Partial<OutreachEvent> & { leadId: string }) {
  const data = readLocalCrm();
  const event: OutreachEvent = {
    id: `outreach-${Date.now()}`,
    leadId: payload.leadId,
    channel: payload.channel || "instagram",
    accountUsed: payload.accountUsed || "relve.co",
    direction: payload.direction || "outbound",
    status: payload.status || "sent",
    sentAt: payload.sentAt || now(),
    repliedAt: payload.repliedAt || "",
    snippet: payload.snippet || "",
    nextFollowUp: payload.nextFollowUp || ""
  };
  data.outreachEvents.unshift(event);
  const lead = data.leads.find((item) => item.id === event.leadId);
  if (lead && lead.status === "missing") {
    lead.status = event.status === "replied" ? "interested" : "contacted";
    lead.updatedAt = now();
  }
  const next = writeLocalCrm(data);
  return { event, analytics: next.analytics };
}

export function patchLocalTask(taskId: string, patch: Partial<Task>) {
  const data = readLocalCrm();
  const task = data.tasks.find((item) => item.id === taskId);
  if (!task) throw new Error("Task not found");
  Object.assign(task, patch);
  const next = writeLocalCrm(data);
  return { task, analytics: next.analytics };
}

export function importLocalCsv(text: string) {
  const data = readLocalCrm();
  const imported = parseCsv(text);
  data.leads.push(...imported);
  const next = writeLocalCrm(data);
  return { imported: imported.length, leads: imported, analytics: next.analytics };
}

function withAnalytics(data: CrmData): CrmData {
  return { ...data, analytics: computeAnalytics(data) };
}

function computeAnalytics(data: CrmData): Analytics {
  const activeLeads = data.leads.filter((lead) => !lead.archived);
  const reachedLeadIds = new Set(data.outreachEvents.map((event) => event.leadId));
  const replies = data.outreachEvents.filter((event) => event.repliedAt || event.status === "replied").length;
  const interested = activeLeads.filter((lead) => ["interested", "meeting_booked", "won"].includes(lead.status)).length;
  const meetings = activeLeads.filter((lead) => ["meeting_booked", "won"].includes(lead.status)).length;
  const won = activeLeads.filter((lead) => lead.status === "won");
  const byDate: Record<string, Analytics["channelVolume"][number]> = {};

  for (const event of data.outreachEvents) {
    const date = (event.sentAt || now()).slice(0, 10);
    byDate[date] ||= { date, instagram: 0, linkedin: 0, email: 0, call: 0, replies: 0 };
    byDate[date][event.channel] += 1;
    if (event.repliedAt) byDate[date].replies += 1;
  }

  return {
    totalLeads: activeLeads.length,
    reachedOut: reachedLeadIds.size,
    missingOutreach: activeLeads.filter((lead) => !reachedLeadIds.has(lead.id) && lead.status === "missing").length,
    replies,
    replyRate: reachedLeadIds.size ? Number(((replies / reachedLeadIds.size) * 100).toFixed(1)) : 0,
    interested,
    meetings,
    wonRevenue: won.reduce((sum, lead) => sum + lead.setupFee, 0),
    projectedMrr: won.reduce((sum, lead) => sum + lead.monthlyFee, 0),
    followUpsDue: data.tasks.filter((task) => task.status === "open").length,
    channelVolume: Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date))
  };
}

function parseCsv(text: string): Lead[] {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];
  const headers = parseCsvLine(lines[0]).map((header) => header.trim());
  return lines.slice(1).map((line, index) => {
    const values = parseCsvLine(line);
    const row = Object.fromEntries(headers.map((header, cellIndex) => [header, values[cellIndex] ?? ""]));
    return {
      id: `lead-import-${Date.now()}-${index}`,
      businessName: row.businessName || "Untitled business",
      niche: row.niche || "Local services",
      location: row.location || "",
      website: row.website || "",
      instagramHandle: row.instagramHandle || row.instagram || "",
      linkedinUrl: row.linkedinUrl || row.linkedin || "",
      email: row.email || "",
      owner: row.owner || "",
      source: row.source || "CSV import",
      status: "missing",
      tags: row.tags ? row.tags.split(/[|;]/).map((tag) => tag.trim()).filter(Boolean) : [],
      assignedUser: row.assignedUser || "Unassigned",
      notes: row.notes || "",
      setupFee: Number(row.setupFee || 1500),
      monthlyFee: Number(row.monthlyFee || 129),
      createdAt: now(),
      updatedAt: now(),
      archived: false
    };
  });
}

function parseCsvLine(line: string) {
  const cells: string[] = [];
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
