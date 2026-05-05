import { ChangeEvent, FormEvent, ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  Bolt,
  Bot,
  BrainCircuit,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  CircleDot,
  ClipboardList,
  Crosshair,
  Download,
  Eye,
  Filter,
  Flame,
  Globe2,
  Inbox,
  Instagram,
  LayoutDashboard,
  Linkedin,
  Mail,
  MessageSquareText,
  MoreHorizontal,
  PanelsTopLeft,
  Phone,
  Plus,
  Search,
  Send,
  Sparkles,
  Square,
  Upload,
  UserRoundCheck,
  Users,
  Workflow,
  Zap
} from "lucide-react";
import {
  createLead,
  fetchCrm,
  importCsv,
  logOutreach,
  updateLeadStatus,
  updateTask
} from "./api";
import type {
  Analytics,
  Campaign,
  ChannelAccount,
  ChannelType,
  CrmData,
  Lead,
  LeadStatus,
  NewLeadInput,
  OutreachEvent,
  Task
} from "./types";

type ViewKey =
  | "copilot"
  | "agents"
  | "leads"
  | "channels"
  | "campaigns"
  | "inbox"
  | "analytics"
  | "crm"
  | "visitors"
  | "placement"
  | "automations"
  | "tasks";

type TopChannel = "all" | "instagram" | "linkedin" | "email";
type InboxTab = "primary" | "others";
type AnalyticsMode = "campaign" | "account";

const statusLabels: Record<LeadStatus, string> = {
  missing: "Missing",
  contacted: "Contacted",
  follow_up: "Follow-up",
  interested: "Interested",
  meeting_booked: "Meeting booked",
  won: "Won",
  lost: "Lost"
};

const statusTone: Record<LeadStatus, string> = {
  missing: "slate",
  contacted: "blue",
  follow_up: "amber",
  interested: "green",
  meeting_booked: "violet",
  won: "lime",
  lost: "red"
};

const channels: ChannelType[] = ["instagram", "linkedin", "email", "call"];

const emptyLead: NewLeadInput = {
  businessName: "",
  niche: "Roofing",
  location: "",
  website: "",
  instagramHandle: "",
  linkedinUrl: "",
  email: "",
  owner: "",
  source: "Manual",
  assignedUser: "Raj",
  notes: "",
  tags: "roofing, local-business"
};

function App() {
  const [data, setData] = useState<CrmData | null>(null);
  const [activeView, setActiveView] = useState<ViewKey>("inbox");
  const [topChannel, setTopChannel] = useState<TopChannel>("all");
  const [inboxTab, setInboxTab] = useState<InboxTab>("primary");
  const [analyticsMode, setAnalyticsMode] = useState<AnalyticsMode>("campaign");
  const [analyticsRange, setAnalyticsRange] = useState("Last 4 weeks");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "all">("all");
  const [channelFilter, setChannelFilter] = useState<ChannelType | "all">("all");
  const [selectedLeadId, setSelectedLeadId] = useState<string>("");
  const [newLead, setNewLead] = useState<NewLeadInput>(emptyLead);
  const [csvText, setCsvText] = useState("");
  const [notice, setNotice] = useState("Loading CRM...");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const nextData = await fetchCrm();
      setData(nextData);
      setSelectedLeadId((current) => current || nextData.leads.find((lead) => !lead.archived)?.id || "");
      setNotice(`Synced ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not load CRM");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const activeLeads = useMemo(() => data?.leads.filter((lead) => !lead.archived) ?? [], [data]);
  const outreachByLead = useMemo(() => groupOutreachByLead(data?.outreachEvents ?? []), [data]);
  const selectedLead = activeLeads.find((lead) => lead.id === selectedLeadId) ?? activeLeads[0];

  const filteredLeads = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return activeLeads.filter((lead) => {
      const matchesQuery =
        !normalizedQuery ||
        [
          lead.businessName,
          lead.niche,
          lead.location,
          lead.owner,
          lead.instagramHandle,
          lead.email,
          lead.source,
          lead.tags.join(" ")
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
      const leadOutreach = outreachByLead.get(lead.id) ?? [];
      const matchesChannel = channelFilter === "all" || leadOutreach.some((event) => event.channel === channelFilter);
      const matchesTopChannel =
        topChannel === "all" ||
        (topChannel === "instagram" && Boolean(lead.instagramHandle || leadOutreach.some((event) => event.channel === "instagram"))) ||
        (topChannel === "linkedin" && Boolean(lead.linkedinUrl || leadOutreach.some((event) => event.channel === "linkedin"))) ||
        (topChannel === "email" && Boolean(lead.email || leadOutreach.some((event) => event.channel === "email")));
      const matchesInboxTab =
        activeView !== "inbox" ||
        inboxTab === "primary" ||
        ["won", "lost"].includes(lead.status) ||
        leadOutreach.some((event) => event.repliedAt || event.direction === "inbound");
      return matchesQuery && matchesStatus && matchesChannel && matchesTopChannel && matchesInboxTab;
    });
  }, [activeLeads, activeView, channelFilter, inboxTab, outreachByLead, query, statusFilter, topChannel]);

  async function handleCreateLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newLead.businessName.trim()) {
      setNotice("Business name is required.");
      return;
    }
    await createLead(newLead);
    setNewLead(emptyLead);
    await refresh();
    setActiveView("leads");
    setNotice("Lead added.");
  }

  async function handleStatusChange(leadId: string, status: LeadStatus) {
    await updateLeadStatus(leadId, status);
    await refresh();
    setNotice(`Lead marked ${statusLabels[status]}.`);
  }

  async function handleLogOutreach(leadId: string, channel: ChannelType = "instagram") {
    const lead = activeLeads.find((item) => item.id === leadId);
    await logOutreach({
      leadId,
      channel,
      accountUsed: channel === "instagram" ? "relve.co" : channel === "linkedin" ? "Raj LinkedIn" : "hello@relve.co",
      direction: "outbound",
      status: "sent",
      snippet: `Manual ${channel} outreach logged for ${lead?.businessName ?? "lead"}.`,
      nextFollowUp: addDays(3)
    });
    await refresh();
    setNotice(`${channelLabel(channel)} outreach logged.`);
  }

  async function handleCsvImport() {
    if (!csvText.trim()) {
      setNotice("Paste CSV text before importing.");
      return;
    }
    const result = await importCsv(csvText);
    setCsvText("");
    await refresh();
    setNotice(`Imported ${result.imported} leads.`);
  }

  async function handleCompleteTask(task: Task) {
    await updateTask(task.id, { status: task.status === "done" ? "open" : "done" });
    await refresh();
    setNotice(task.status === "done" ? "Task reopened." : "Task completed.");
  }

  function handleStartNewLeadFlow() {
    setActiveView("leads");
    setQuery("");
    setStatusFilter("all");
    setNotice("Lead intake opened. Add manually or import CSV.");
  }

  function handleShareReport() {
    exportText("grace-insta-crm-report.json", JSON.stringify({ analytics: data?.analytics, leads: activeLeads }, null, 2), "application/json");
    setNotice("Analytics report exported.");
  }

  if (!data) {
    return (
      <div className="boot-screen">
        <div className="brand-bolt">
          <Bolt size={26} fill="currentColor" />
        </div>
        <p>{notice}</p>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <IconRail activeView={activeView} onChange={setActiveView} />
      <SectionSidebar
        activeView={activeView}
        analytics={data.analytics}
        leads={activeLeads}
        tasks={data.tasks}
        campaigns={data.campaigns}
        channels={data.channels}
        onStatusFilter={(status) => {
          setStatusFilter(status);
          setActiveView("inbox");
        }}
        onOpenView={setActiveView}
      />
      <main className="workspace">
        <Topbar
          notice={notice}
          loading={loading}
          topChannel={topChannel}
          onTopChannel={setTopChannel}
          onExportCsv={() => exportText("grace-insta-crm-leads.csv", leadsToCsv(activeLeads), "text/csv")}
          onGetLeads={handleStartNewLeadFlow}
        />
        <div className="workspace-body">
          {activeView === "copilot" && (
            <CopilotScreen analytics={data.analytics} leads={activeLeads} tasks={data.tasks} onOpenTasks={() => setActiveView("tasks")} />
          )}
          {activeView === "agents" && (
            <AgentsScreen leads={activeLeads} onRunAgent={() => setNotice("AI agent draft queued for selected lead list.")} />
          )}
          {activeView === "analytics" && (
            <AnalyticsScreen
              analytics={data.analytics}
              campaigns={data.campaigns}
              channels={data.channels}
              leads={activeLeads}
              outreachByLead={outreachByLead}
              mode={analyticsMode}
              range={analyticsRange}
              onMode={setAnalyticsMode}
              onRange={() => setAnalyticsRange((current) => (current === "Last 4 weeks" ? "This week" : "Last 4 weeks"))}
              onShare={handleShareReport}
            />
          )}
          {activeView === "leads" && (
            <LeadsScreen
              leads={filteredLeads}
              allLeads={activeLeads}
              outreachByLead={outreachByLead}
              query={query}
              statusFilter={statusFilter}
              channelFilter={channelFilter}
              newLead={newLead}
              csvText={csvText}
              onQuery={setQuery}
              onStatusFilter={setStatusFilter}
              onChannelFilter={setChannelFilter}
              onLeadChange={setNewLead}
              onSubmitLead={handleCreateLead}
              onCsvText={setCsvText}
              onCsvImport={handleCsvImport}
              onExportJson={() => exportText("grace-insta-crm.json", JSON.stringify(data, null, 2), "application/json")}
              onStatusChange={handleStatusChange}
              onLogOutreach={handleLogOutreach}
              onSelectLead={(leadId) => {
                setSelectedLeadId(leadId);
                setActiveView("inbox");
              }}
            />
          )}
          {activeView === "inbox" && (
            <InboxScreen
              leads={filteredLeads}
              allLeads={activeLeads}
              selectedLead={selectedLead}
              outreachByLead={outreachByLead}
              statusFilter={statusFilter}
              query={query}
              inboxTab={inboxTab}
              onQuery={setQuery}
              onStatusFilter={setStatusFilter}
              onInboxTab={setInboxTab}
              onSelectLead={setSelectedLeadId}
              onStatusChange={handleStatusChange}
              onLogOutreach={handleLogOutreach}
            />
          )}
          {activeView === "campaigns" && (
            <CampaignsScreen
              campaigns={data.campaigns}
              leads={activeLeads}
              outreachByLead={outreachByLead}
              onOpenList={(campaign) => {
                setQuery(campaign.niche);
                setActiveView("leads");
              }}
              onNewList={handleStartNewLeadFlow}
            />
          )}
          {activeView === "channels" && (
            <ChannelsScreen
              channels={data.channels}
              outreachEvents={data.outreachEvents}
              onAddChannel={() => setNotice("Channel setup is manual for v1. Add accounts in the local data file or duplicate an existing channel.")}
            />
          )}
          {activeView === "crm" && (
            <CrmPipelineScreen leads={activeLeads} onOpenLead={(leadId) => {
              setSelectedLeadId(leadId);
              setActiveView("inbox");
            }} />
          )}
          {activeView === "visitors" && (
            <WebsiteVisitorsScreen leads={activeLeads} onConvert={handleStartNewLeadFlow} />
          )}
          {activeView === "placement" && (
            <InboxPlacementScreen channels={data.channels} onRunTest={() => setNotice("Inbox placement test added to the local QA queue.")} />
          )}
          {activeView === "automations" && (
            <AutomationsScreen campaigns={data.campaigns} onCreateFlow={() => setNotice("Manual automation checklist created for the active campaign.")} />
          )}
          {activeView === "tasks" && (
            <TasksScreen
              tasks={data.tasks}
              leads={activeLeads}
              onComplete={handleCompleteTask}
              onSelectLead={(leadId) => {
                setSelectedLeadId(leadId);
                setActiveView("inbox");
              }}
            />
          )}
        </div>
      </main>
    </div>
  );
}

function IconRail({ activeView, onChange }: { activeView: ViewKey; onChange: (view: ViewKey) => void }) {
  const nav: Array<{ key: ViewKey; label: string; icon: ReactNode; badge?: string }> = [
    { key: "copilot", label: "Instantly Copilot", icon: <Sparkles size={20} /> },
    { key: "agents", label: "AI Agents", icon: <BrainCircuit size={20} /> },
    { key: "leads", label: "SuperSearch", icon: <Search size={20} /> },
    { key: "channels", label: "Email Accounts", icon: <Mail size={20} /> },
    { key: "campaigns", label: "Campaigns", icon: <Send size={20} /> },
    { key: "inbox", label: "Unibox", icon: <Inbox size={20} />, badge: "2" },
    { key: "analytics", label: "Analytics", icon: <BarChart3 size={20} /> },
    { key: "crm", label: "CRM", icon: <Bolt size={20} />, badge: "2" },
    { key: "visitors", label: "Website Visitors", icon: <Eye size={20} /> },
    { key: "placement", label: "Inbox Placement", icon: <LayoutDashboard size={20} /> },
    { key: "automations", label: "Automations", icon: <Workflow size={20} /> },
    { key: "tasks", label: "Tasks", icon: <ClipboardList size={20} />, badge: "4" }
  ];

  return (
    <aside className="icon-rail">
      <button className="logo-button" aria-label="Grace Insta CRM home" onClick={() => onChange("analytics")}>
        <Bolt size={26} fill="currentColor" />
      </button>
      <nav>
        {nav.map((item) => (
          <button
            key={item.key}
            className={`rail-button ${activeView === item.key ? "active" : ""}`}
            aria-label={item.label}
            title={item.label}
            onClick={() => onChange(item.key)}
          >
            {item.icon}
            {item.badge && <span className="rail-badge">{item.badge}</span>}
          </button>
        ))}
      </nav>
      <button className="avatar-button" aria-label="Workspace user">
        R
      </button>
    </aside>
  );
}

function SectionSidebar({
  activeView,
  analytics,
  leads,
  tasks,
  campaigns,
  channels,
  onStatusFilter,
  onOpenView
}: {
  activeView: ViewKey;
  analytics: Analytics;
  leads: Lead[];
  tasks: Task[];
  campaigns: Campaign[];
  channels: ChannelAccount[];
  onStatusFilter: (status: LeadStatus | "all") => void;
  onOpenView: (view: ViewKey) => void;
}) {
  const sidebar = sidebarConfig(activeView, analytics, leads, tasks, campaigns, channels);
  return (
    <aside className="section-sidebar">
      <div className="section-title">
        <h1>{sidebar.title}</h1>
        <button aria-label="Collapse sidebar">
          <PanelsTopLeft size={16} />
        </button>
      </div>
      <div className="section-scroll">
        {sidebar.groups.map((group) => (
          <div className="sidebar-group" key={group.title}>
            {group.title && <h2>{group.title}</h2>}
            {group.items.map((item) => (
              <button
                className={`sidebar-item ${item.active ? "active" : ""}`}
                key={item.label}
                onClick={() => {
                  if (item.status) onStatusFilter(item.status);
                  if (item.view) onOpenView(item.view);
                }}
              >
                <span className={`dot dot-${item.tone || "blue"}`} />
                <span>{item.label}</span>
                {typeof item.count === "number" && <strong>{item.count}</strong>}
              </button>
            ))}
          </div>
        ))}
      </div>
    </aside>
  );
}

function Topbar({
  notice,
  loading,
  topChannel,
  onTopChannel,
  onExportCsv,
  onGetLeads
}: {
  notice: string;
  loading: boolean;
  topChannel: TopChannel;
  onTopChannel: (channel: TopChannel) => void;
  onExportCsv: () => void;
  onGetLeads: () => void;
}) {
  const tabs: Array<{ key: TopChannel; label: string }> = [
    { key: "all", label: "Everything" },
    { key: "instagram", label: "Instagram" },
    { key: "linkedin", label: "LinkedIn" },
    { key: "email", label: "Email" }
  ];
  return (
    <header className="topbar">
      <div className="topbar-tabs">
        {tabs.map((tab) => (
          <button
            className={`top-tab ${topChannel === tab.key ? "active" : ""}`}
            key={tab.key}
            type="button"
            onClick={() => onTopChannel(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="topbar-actions">
        <div className="credit-chip">
          <Flame size={15} />
          <span>Manual only</span>
        </div>
        <div className="sync-chip">
          <CircleDot size={11} className={loading ? "pulse" : ""} />
          <span>{notice}</span>
        </div>
        <button className="primary-button" type="button" onClick={onExportCsv}>
          <Download size={16} />
          Export CSV
        </button>
        <button className="primary-button" type="button" onClick={onGetLeads}>
          <Plus size={16} />
          Get Leads
        </button>
        <button className="org-button" type="button" onClick={onGetLeads}>
          Grace Insta CRM
          <ChevronDown size={16} />
        </button>
      </div>
    </header>
  );
}

function AnalyticsScreen({
  analytics,
  campaigns,
  channels: channelAccounts,
  leads,
  outreachByLead,
  mode,
  range,
  onMode,
  onRange,
  onShare
}: {
  analytics: Analytics;
  campaigns: Campaign[];
  channels: ChannelAccount[];
  leads: Lead[];
  outreachByLead: Map<string, OutreachEvent[]>;
  mode: AnalyticsMode;
  range: string;
  onMode: (mode: AnalyticsMode) => void;
  onRange: () => void;
  onShare: () => void;
}) {
  const accountRows = channelAccounts.map((channel) => ({
    account: channel.account,
    contacted: channel.sentToday,
    replied: channel.repliesToday,
    score: channel.healthScore
  }));

  return (
    <section className="screen screen-analytics">
      <div className="screen-toolbar align-end">
        <button className="ghost-button" type="button" onClick={onShare}>
          <Send size={15} />
          Share
        </button>
        <button className="ghost-button" type="button" onClick={() => onMode(mode === "campaign" ? "account" : "campaign")}>
          <Filter size={15} />
          {mode === "campaign" ? "Campaign view" : "Account view"}
          <ChevronDown size={15} />
        </button>
        <button className="ghost-button" type="button" onClick={onRange}>
          {range}
          <ChevronDown size={15} />
        </button>
      </div>
      <div className="analytics-frame">
        <div className="metric-grid">
          <MetricCard tone="amber" label="Total leads" value={analytics.totalLeads} />
          <MetricCard tone="blue" label="Reached out" value={analytics.reachedOut} />
          <MetricCard tone="red" label="Missing outreach" value={analytics.missingOutreach} />
          <MetricCard tone="green" label="Reply rate" value={`${analytics.replyRate}%`} />
          <MetricCard tone="violet" label="Opportunities" value={`${analytics.interested}`} detail={`$${analytics.wonRevenue}`} />
        </div>
        <VolumeChart data={analytics.channelVolume} />
      </div>

      <div className="split-tabs">
        <button className={`tab-option ${mode === "campaign" ? "active" : ""}`} type="button" onClick={() => onMode("campaign")}>
          <BarChart3 size={18} />
          Campaign Analytics
        </button>
        <button className={`tab-option ${mode === "account" ? "active" : ""}`} type="button" onClick={() => onMode("account")}>
          <Activity size={18} />
          Account Analytics
        </button>
      </div>

      <div className="analytics-lower">
        {mode === "campaign" && <Panel title="Campaign analytics">
          <div className="data-table compact">
            <div className="table-row table-head">
              <span>Campaign</span>
              <span>Sequence started</span>
              <span>Reached</span>
              <span>Replied</span>
              <span>Opportunities</span>
              <span>Actions</span>
            </div>
            {campaigns.map((campaign) => {
              const campaignLeads = leads.filter((lead) => campaign.leadIds.includes(lead.id));
              const reached = campaignLeads.filter((lead) => outreachByLead.has(lead.id)).length;
              const replied = campaignLeads.filter((lead) =>
                (outreachByLead.get(lead.id) ?? []).some((event) => event.repliedAt)
              ).length;
              const opportunities = campaignLeads.filter((lead) =>
                ["interested", "meeting_booked", "won"].includes(lead.status)
              ).length;
              return (
                <div className="table-row" key={campaign.id}>
                  <span className="strong-cell">{campaign.name}</span>
                  <span>
                    <StatusPill status={campaign.status === "active" ? "contacted" : "lost"} label={campaign.status} />
                  </span>
                  <span>{reached}</span>
                  <span>{replied}</span>
                  <span>{opportunities}</span>
                  <span>
                    <MoreHorizontal size={18} />
                  </span>
                </div>
              );
            })}
          </div>
        </Panel>}
        <Panel title="Account performance">
          <div className="data-table compact">
            <div className="table-row table-head">
              <span>Sending account</span>
              <span>Contacted</span>
              <span>Replied</span>
              <span>Score</span>
            </div>
            {accountRows.map((row) => (
              <div className="table-row" key={row.account}>
                <span className="strong-cell">{row.account}</span>
                <span className="blue-number">{row.contacted}</span>
                <span className="blue-number">{row.replied}</span>
                <span>{row.score}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </section>
  );
}

function LeadsScreen({
  leads,
  allLeads,
  outreachByLead,
  query,
  statusFilter,
  channelFilter,
  newLead,
  csvText,
  onQuery,
  onStatusFilter,
  onChannelFilter,
  onLeadChange,
  onSubmitLead,
  onCsvText,
  onCsvImport,
  onExportJson,
  onStatusChange,
  onLogOutreach,
  onSelectLead
}: {
  leads: Lead[];
  allLeads: Lead[];
  outreachByLead: Map<string, OutreachEvent[]>;
  query: string;
  statusFilter: LeadStatus | "all";
  channelFilter: ChannelType | "all";
  newLead: NewLeadInput;
  csvText: string;
  onQuery: (value: string) => void;
  onStatusFilter: (value: LeadStatus | "all") => void;
  onChannelFilter: (value: ChannelType | "all") => void;
  onLeadChange: (value: NewLeadInput) => void;
  onSubmitLead: (event: FormEvent<HTMLFormElement>) => void;
  onCsvText: (value: string) => void;
  onCsvImport: () => void;
  onExportJson: () => void;
  onStatusChange: (leadId: string, status: LeadStatus) => void;
  onLogOutreach: (leadId: string, channel?: ChannelType) => void;
  onSelectLead: (leadId: string) => void;
}) {
  const niches = Array.from(new Set(allLeads.map((lead) => lead.niche)));

  return (
    <section className="screen screen-leads">
      <div className="leads-layout">
        <aside className="filter-panel">
          <div className="panel-heading">
            <h2>Filters</h2>
            <button aria-label="Save filters">
              <Square size={15} />
            </button>
          </div>
          <label className="toggle-row">
            <input type="checkbox" defaultChecked />
            <span>Skip already contacted</span>
          </label>
          <FilterStack title="Job Titles" items={["Owner", "Founder", "Operations Manager"]} />
          <FilterStack title="Location" items={["Texas", "Florida", "Arizona", "Colorado"]} />
          <FilterStack title="Industry and Keywords" items={niches.length ? niches : ["Roofing", "HVAC"]} />
          <FilterStack title="Signals" items={["No website", "Slow website", "No booking CTA"]} />
        </aside>

        <div className="leads-main">
          <div className="screen-toolbar">
            <SearchBox value={query} onChange={onQuery} placeholder="Search businesses, cities, handles..." />
            <SelectPill value={statusFilter} onChange={onStatusFilter} options={["all", ...Object.keys(statusLabels)]} />
            <SelectPill value={channelFilter} onChange={onChannelFilter} options={["all", ...channels]} />
            <button className="ghost-button" type="button" onClick={onExportJson}>
              <Download size={16} />
              JSON
            </button>
          </div>

          <Panel title="SuperSearch leads" action={`${leads.length} visible`}>
            <LeadTable
              leads={leads}
              outreachByLead={outreachByLead}
              onStatusChange={onStatusChange}
              onLogOutreach={onLogOutreach}
              onSelectLead={onSelectLead}
            />
          </Panel>

          <div className="lead-actions-grid">
            <Panel title="Add a lead manually">
              <LeadForm lead={newLead} onChange={onLeadChange} onSubmit={onSubmitLead} />
            </Panel>
            <Panel title="CSV import" action="Paste rows">
              <textarea
                className="csv-box"
                value={csvText}
                onChange={(event) => onCsvText(event.target.value)}
                placeholder={
                  "businessName,niche,location,website,instagramHandle,email,owner,tags\nApex Roofing,Roofing,Dallas TX,https://example.com,@apexroofing,owner@example.com,Ana roofing|texas"
                }
              />
              <div className="panel-actions">
                <button className="primary-button" type="button" onClick={onCsvImport}>
                  <Upload size={16} />
                  Import CSV
                </button>
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </section>
  );
}

function InboxScreen({
  leads,
  allLeads,
  selectedLead,
  outreachByLead,
  statusFilter,
  query,
  inboxTab,
  onQuery,
  onStatusFilter,
  onInboxTab,
  onSelectLead,
  onStatusChange,
  onLogOutreach
}: {
  leads: Lead[];
  allLeads: Lead[];
  selectedLead?: Lead;
  outreachByLead: Map<string, OutreachEvent[]>;
  statusFilter: LeadStatus | "all";
  query: string;
  inboxTab: InboxTab;
  onQuery: (value: string) => void;
  onStatusFilter: (value: LeadStatus | "all") => void;
  onInboxTab: (tab: InboxTab) => void;
  onSelectLead: (leadId: string) => void;
  onStatusChange: (leadId: string, status: LeadStatus) => void;
  onLogOutreach: (leadId: string, channel?: ChannelType) => void;
}) {
  const selectedEvents = selectedLead ? outreachByLead.get(selectedLead.id) ?? [] : [];
  return (
    <section className="screen screen-inbox">
      <div className="inbox-grid">
        <div className="conversation-list">
          <div className="inbox-tabs">
            <button className={inboxTab === "primary" ? "active" : ""} type="button" onClick={() => onInboxTab("primary")}>
              Primary
            </button>
            <button className={inboxTab === "others" ? "active" : ""} type="button" onClick={() => onInboxTab("others")}>
              Others
            </button>
          </div>
          <SearchBox value={query} onChange={onQuery} placeholder="Search lead inbox" />
          <div className="inbox-filter-line">
            <SelectPill value={statusFilter} onChange={onStatusFilter} options={["all", ...Object.keys(statusLabels)]} />
          </div>
          <div className="thread-stack">
            {leads.map((lead) => {
              const events = outreachByLead.get(lead.id) ?? [];
              const latest = events[0];
              return (
                <button
                  className={`thread-card ${selectedLead?.id === lead.id ? "active" : ""}`}
                  key={lead.id}
                  onClick={() => onSelectLead(lead.id)}
                >
                  <span className="thread-icon">{channelIcon(latest?.channel || "instagram")}</span>
                  <span className="thread-main">
                    <span className="thread-meta">
                      <strong>{latest?.status === "follow_up_due" ? "Sent. Follow up?" : statusLabels[lead.status]}</strong>
                      <time>{dateShort(latest?.sentAt || lead.updatedAt)}</time>
                    </span>
                    <span className="thread-name">{lead.businessName}</span>
                    <span className="thread-snippet">{latest?.snippet || "Missing outreach. Log the first touch."}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="conversation-detail">
          {selectedLead ? (
            <>
              <div className="lead-detail-header">
                <div>
                  <p className="eyeline">{selectedLead.niche} · {selectedLead.location}</p>
                  <h2>{selectedLead.businessName}</h2>
                  <p>{selectedLead.notes}</p>
                </div>
                <StatusPill status={selectedLead.status} />
              </div>
              <div className="contact-strip">
                <ContactItem icon={<Instagram size={16} />} label={selectedLead.instagramHandle || "No Instagram"} />
                <ContactItem icon={<Linkedin size={16} />} label={selectedLead.linkedinUrl ? "LinkedIn found" : "No LinkedIn"} />
                <ContactItem icon={<Mail size={16} />} label={selectedLead.email || "No email"} />
                <ContactItem icon={<Globe2 size={16} />} label={selectedLead.website ? "Website found" : "No website"} />
              </div>
              <div className="timeline">
                {selectedEvents.length ? (
                  selectedEvents.map((event) => (
                    <div className="timeline-item" key={event.id}>
                      <div className="timeline-icon">{channelIcon(event.channel)}</div>
                      <div>
                        <strong>
                          {channelLabel(event.channel)} · {event.direction}
                        </strong>
                        <p>{event.snippet}</p>
                        <span>
                          {dateShort(event.sentAt)}
                          {event.nextFollowUp && ` · Next follow-up ${event.nextFollowUp}`}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <Zap size={34} />
                    <h3>No outreach logged yet</h3>
                    <p>Use this view to make the next agent instantly understand what is missing.</p>
                  </div>
                )}
              </div>
              <div className="reply-box">
                <div>
                  <strong>Next manual action</strong>
                  <p>
                    Send a short Instagram DM about the $1,500 setup and $129/month care plan, then log the touch.
                  </p>
                </div>
                <div className="reply-actions">
                  <button className="primary-button" onClick={() => onLogOutreach(selectedLead.id, "instagram")}>
                    <Instagram size={16} />
                    Log IG touch
                  </button>
                  <button className="ghost-button" onClick={() => onLogOutreach(selectedLead.id, "linkedin")}>
                    <Linkedin size={16} />
                    LinkedIn
                  </button>
                  <button className="ghost-button" onClick={() => onStatusChange(selectedLead.id, "interested")}>
                    <Sparkles size={16} />
                    Interested
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="empty-state center">
              <Users size={36} />
              <h3>No leads yet</h3>
              <p>Add a lead or import CSV to start tracking outreach.</p>
            </div>
          )}
        </div>
      </div>
      <div className="inbox-footer-note">
        {allLeads.length} active leads · {allLeads.filter((lead) => lead.status === "missing").length} missing first touch
      </div>
    </section>
  );
}

function CampaignsScreen({
  campaigns,
  leads,
  outreachByLead,
  onOpenList,
  onNewList
}: {
  campaigns: Campaign[];
  leads: Lead[];
  outreachByLead: Map<string, OutreachEvent[]>;
  onOpenList: (campaign: Campaign) => void;
  onNewList: () => void;
}) {
  return (
    <section className="screen">
      <div className="screen-toolbar align-end">
        <button className="primary-button" type="button" onClick={onNewList}>
          <Plus size={16} />
          New list
        </button>
      </div>
      <div className="campaign-grid">
        {campaigns.map((campaign) => {
          const campaignLeads = leads.filter((lead) => campaign.leadIds.includes(lead.id));
          const missing = campaignLeads.filter((lead) => !outreachByLead.has(lead.id)).length;
          return (
            <article className="campaign-panel" key={campaign.id}>
              <div className="campaign-top">
                <div>
                  <p className="eyeline">{campaign.niche}</p>
                  <h2>{campaign.name}</h2>
                </div>
                <StatusPill status={campaign.status === "active" ? "contacted" : "lost"} label={campaign.status} />
              </div>
              <div className="campaign-stats">
                <MetricMini label="Leads" value={campaignLeads.length} />
                <MetricMini label="Missing" value={missing} tone="red" />
                <MetricMini label="Channels" value={campaign.channelMix.length} />
              </div>
              <div className="location-list">
                {campaign.locations.map((location) => (
                  <span key={location}>{location}</span>
                ))}
              </div>
              <button className="ghost-button full" onClick={() => onOpenList(campaign)}>
                Open lead list
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function ChannelsScreen({
  channels: channelAccounts,
  outreachEvents,
  onAddChannel
}: {
  channels: ChannelAccount[];
  outreachEvents: OutreachEvent[];
  onAddChannel: () => void;
}) {
  return (
    <section className="screen">
      <div className="screen-toolbar align-end">
        <button className="ghost-button" type="button">
          <Bolt size={16} />
          All statuses
          <ChevronDown size={16} />
        </button>
        <button className="primary-button" type="button" onClick={onAddChannel}>
          <Plus size={16} />
          Add channel
        </button>
      </div>
      <Panel title="Outreach channels">
        <div className="data-table channels-table">
          <div className="table-row table-head">
            <span>Account</span>
            <span>Type</span>
            <span>Sent today</span>
            <span>Replies</span>
            <span>Health score</span>
            <span>Status</span>
          </div>
          {channelAccounts.map((channel) => (
            <div className="table-row" key={channel.id}>
              <span className="strong-cell with-icon">
                {channelIcon(channel.type)}
                {channel.account}
              </span>
              <span>{channelLabel(channel.type)}</span>
              <span>
                {channel.sentToday} of {channel.dailyLimit}
              </span>
              <span>{channel.repliesToday}</span>
              <span>{channel.healthScore}%</span>
              <span>
                <StatusPill status={channel.status === "active" ? "won" : "follow_up"} label={channel.status} />
              </span>
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="Recent manual sends" action={`${outreachEvents.length} total`}>
        <div className="event-grid">
          {outreachEvents.slice(0, 8).map((event) => (
            <div className="event-card" key={event.id}>
              <span>{channelIcon(event.channel)}</span>
              <strong>{event.accountUsed}</strong>
              <p>{event.snippet}</p>
              <time>{dateShort(event.sentAt)}</time>
            </div>
          ))}
        </div>
      </Panel>
    </section>
  );
}

function TasksScreen({
  tasks,
  leads,
  onComplete,
  onSelectLead
}: {
  tasks: Task[];
  leads: Lead[];
  onComplete: (task: Task) => void;
  onSelectLead: (leadId: string) => void;
}) {
  const leadById = new Map(leads.map((lead) => [lead.id, lead]));
  const sortedTasks = [...tasks].sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  return (
    <section className="screen">
      <Panel title="Tasks and follow-ups" action={`${tasks.filter((task) => task.status === "open").length} open`}>
        <div className="task-list">
          {sortedTasks.map((task) => {
            const lead = leadById.get(task.leadId);
            return (
              <div className={`task-row ${task.status === "done" ? "done" : ""}`} key={task.id}>
                <button className="check-button" onClick={() => onComplete(task)} aria-label="Toggle task">
                  {task.status === "done" ? <CheckCircle2 size={20} /> : <CircleDot size={20} />}
                </button>
                <div>
                  <strong>{task.notes}</strong>
                  <p>
                    {lead?.businessName || "Unknown lead"} · {task.type} · due {task.dueDate}
                  </p>
                </div>
                <button className="ghost-button" onClick={() => onSelectLead(task.leadId)}>
                  Open
                </button>
              </div>
            );
          })}
        </div>
      </Panel>
    </section>
  );
}

function CopilotScreen({
  analytics,
  leads,
  tasks,
  onOpenTasks
}: {
  analytics: Analytics;
  leads: Lead[];
  tasks: Task[];
  onOpenTasks: () => void;
}) {
  const warmLead = leads.find((lead) => ["interested", "meeting_booked"].includes(lead.status));
  return (
    <section className="screen">
      <div className="copilot-hero">
        <Sparkles size={26} />
        <div>
          <p className="eyeline">Instantly Copilot style workspace</p>
          <h2>Memory for Grace’s outreach process</h2>
          <p>
            Pitch: $1,500 setup plus $129/month for hosting, maintenance, domains, and chatbot support.
          </p>
        </div>
      </div>
      <div className="campaign-grid">
        <Panel title="Read my website">
          <div className="copilot-card">
            <Globe2 size={28} />
            <strong>Website teardown memory</strong>
            <p>Use notes from each lead to shape the next Instagram or LinkedIn follow-up.</p>
          </div>
        </Panel>
        <Panel title="Read a PDF or text file">
          <div className="copilot-card">
            <ClipboardList size={28} />
            <strong>Offer and objection notes</strong>
            <p>Keep the agency package, pricing, and follow-up scripts visible for the next agent.</p>
          </div>
        </Panel>
      </div>
      <Panel title="Recommended next move" action={`${analytics.followUpsDue} open`}>
        <div className="task-row">
          <button className="check-button" type="button" onClick={onOpenTasks}>
            <CalendarClock size={20} />
          </button>
          <div>
            <strong>{warmLead ? `Follow up with ${warmLead.businessName}` : "Open the follow-up queue"}</strong>
            <p>{tasks.find((task) => task.status === "open")?.notes || "No open task. Add new leads from SuperSearch."}</p>
          </div>
          <button className="ghost-button" type="button" onClick={onOpenTasks}>
            Open tasks
          </button>
        </div>
      </Panel>
    </section>
  );
}

function AgentsScreen({ leads, onRunAgent }: { leads: Lead[]; onRunAgent: () => void }) {
  const agentRows = [
    ["Website audit agent", "Find weak hero sections, missing CTAs, no booking flow", leads.filter((lead) => Boolean(lead.website)).length],
    ["Instagram opener agent", "Draft short first-touch DMs for missing leads", leads.filter((lead) => lead.status === "missing").length],
    ["Follow-up agent", "Prepare value follow-ups for warm conversations", leads.filter((lead) => lead.status === "follow_up").length]
  ] as const;
  return (
    <section className="screen">
      <Panel title="AI Sales Agents" action="Manual approval only">
        <div className="data-table agent-table">
          <div className="table-row table-head">
            <span>Agent</span>
            <span>Job</span>
            <span>Queue</span>
            <span>Action</span>
          </div>
          {agentRows.map(([name, job, queue]) => (
            <div className="table-row" key={name}>
              <span className="strong-cell with-icon">
                <Bot size={18} />
                {name}
              </span>
              <span>{job}</span>
              <span className="blue-number">{queue}</span>
              <span>
                <button className="ghost-button" type="button" onClick={onRunAgent}>
                  Draft
                </button>
              </span>
            </div>
          ))}
        </div>
      </Panel>
    </section>
  );
}

function CrmPipelineScreen({ leads, onOpenLead }: { leads: Lead[]; onOpenLead: (leadId: string) => void }) {
  const pipeline: LeadStatus[] = ["missing", "contacted", "follow_up", "interested", "meeting_booked", "won"];
  return (
    <section className="screen">
      <div className="pipeline-board">
        {pipeline.map((status) => (
          <div className="pipeline-column" key={status}>
            <div className="panel-heading">
              <h2>{statusLabels[status]}</h2>
              <span>{leads.filter((lead) => lead.status === status).length}</span>
            </div>
            {leads
              .filter((lead) => lead.status === status)
              .map((lead) => (
                <button className="pipeline-card" key={lead.id} onClick={() => onOpenLead(lead.id)}>
                  <strong>{lead.businessName}</strong>
                  <span>{lead.niche} · {lead.location}</span>
                  <small>{lead.instagramHandle || lead.email || "missing channel"}</small>
                </button>
              ))}
          </div>
        ))}
      </div>
    </section>
  );
}

function WebsiteVisitorsScreen({ leads, onConvert }: { leads: Lead[]; onConvert: () => void }) {
  const visitors = leads.filter((lead) => lead.website).slice(0, 6);
  return (
    <section className="screen">
      <Panel title="Website visitors" action="simulated from tracked leads">
        <div className="data-table visitor-table">
          <div className="table-row table-head">
            <span>Business</span>
            <span>Page signal</span>
            <span>Intent</span>
            <span>Action</span>
          </div>
          {visitors.map((lead, index) => (
            <div className="table-row" key={lead.id}>
              <span className="strong-cell">{lead.businessName}</span>
              <span>{index % 2 ? "Pricing / care plan" : "Homepage / CTA audit"}</span>
              <span>
                <StatusPill status={index % 2 ? "interested" : "contacted"} label={index % 2 ? "high" : "medium"} />
              </span>
              <span>
                <button className="ghost-button" type="button" onClick={onConvert}>
                  Convert to lead
                </button>
              </span>
            </div>
          ))}
        </div>
      </Panel>
    </section>
  );
}

function InboxPlacementScreen({ channels, onRunTest }: { channels: ChannelAccount[]; onRunTest: () => void }) {
  return (
    <section className="screen">
      <div className="empty-state placement-state">
        <LayoutDashboard size={46} />
        <h3>Add a new test to get started</h3>
        <p>Track whether outbound accounts are healthy before running larger manual batches.</p>
        <button className="primary-button" type="button" onClick={onRunTest}>
          <Plus size={16} />
          Add New
        </button>
      </div>
      <Panel title="Account readiness">
        <div className="event-grid">
          {channels.map((channel) => (
            <div className="event-card" key={channel.id}>
              <span>{channelIcon(channel.type)}</span>
              <strong>{channel.account}</strong>
              <p>{channel.notes}</p>
              <time>{channel.healthScore}% health score</time>
            </div>
          ))}
        </div>
      </Panel>
    </section>
  );
}

function AutomationsScreen({ campaigns, onCreateFlow }: { campaigns: Campaign[]; onCreateFlow: () => void }) {
  return (
    <section className="screen">
      <Panel title="Manual salesflows" action="no auto-send">
        <div className="campaign-grid automation-grid">
          {campaigns.map((campaign) => (
            <article className="campaign-panel" key={campaign.id}>
              <div className="campaign-top">
                <div>
                  <p className="eyeline">{campaign.niche}</p>
                  <h2>{campaign.name}</h2>
                </div>
                <Workflow size={22} />
              </div>
              <div className="location-list">
                {["First DM", "Value follow-up", "Meeting ask"].map((step) => (
                  <span key={step}>{step}</span>
                ))}
              </div>
              <button className="ghost-button full" type="button" onClick={onCreateFlow}>
                Build checklist
              </button>
            </article>
          ))}
        </div>
      </Panel>
    </section>
  );
}

function LeadTable({
  leads,
  outreachByLead,
  onStatusChange,
  onLogOutreach,
  onSelectLead
}: {
  leads: Lead[];
  outreachByLead: Map<string, OutreachEvent[]>;
  onStatusChange: (leadId: string, status: LeadStatus) => void;
  onLogOutreach: (leadId: string, channel?: ChannelType) => void;
  onSelectLead: (leadId: string) => void;
}) {
  return (
    <div className="data-table leads-table">
      <div className="table-row table-head">
        <span />
        <span>Business</span>
        <span>Niche</span>
        <span>Location</span>
        <span>Channels</span>
        <span>Status</span>
        <span>Owner</span>
        <span>Actions</span>
      </div>
      {leads.map((lead) => {
        const events = outreachByLead.get(lead.id) ?? [];
        return (
          <div className="table-row" key={lead.id}>
            <span>
              <input aria-label={`Select ${lead.businessName}`} type="checkbox" />
            </span>
            <button className="lead-name" onClick={() => onSelectLead(lead.id)}>
              <strong>{lead.businessName}</strong>
              <small>{lead.instagramHandle || lead.email || lead.website || "missing contact"}</small>
            </button>
            <span>{lead.niche}</span>
            <span>{lead.location}</span>
            <span className="channel-cluster">
              {lead.instagramHandle && <Instagram size={16} />}
              {lead.linkedinUrl && <Linkedin size={16} />}
              {lead.email && <Mail size={16} />}
              {lead.website && <Globe2 size={16} />}
            </span>
            <span>
              <select
                className="status-select"
                value={lead.status}
                onChange={(event) => onStatusChange(lead.id, event.target.value as LeadStatus)}
              >
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </span>
            <span>{lead.assignedUser}</span>
            <span className="row-actions">
              <button className="icon-button" title="Log Instagram touch" onClick={() => onLogOutreach(lead.id, "instagram")}>
                <Instagram size={16} />
              </button>
              <button className="icon-button" title="Open lead" onClick={() => onSelectLead(lead.id)}>
                <MessageSquareText size={16} />
              </button>
              {!events.length && <span className="missing-chip">Missing</span>}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function LeadForm({
  lead,
  onChange,
  onSubmit
}: {
  lead: NewLeadInput;
  onChange: (lead: NewLeadInput) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  function bind<K extends keyof NewLeadInput>(key: K) {
    return {
      value: lead[key],
      onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        onChange({ ...lead, [key]: event.target.value })
    };
  }

  return (
    <form className="lead-form" onSubmit={onSubmit}>
      <div className="form-grid">
        <label>
          Business
          <input {...bind("businessName")} placeholder="Apex Roofing" />
        </label>
        <label>
          Niche
          <select {...bind("niche")}>
            <option>Roofing</option>
            <option>HVAC</option>
            <option>Plumbing</option>
            <option>Local services</option>
          </select>
        </label>
        <label>
          Location
          <input {...bind("location")} placeholder="Dallas, TX" />
        </label>
        <label>
          Instagram
          <input {...bind("instagramHandle")} placeholder="@business" />
        </label>
        <label>
          Email
          <input {...bind("email")} placeholder="owner@example.com" />
        </label>
        <label>
          Owner
          <input {...bind("owner")} placeholder="Owner name" />
        </label>
      </div>
      <label>
        Notes
        <textarea {...bind("notes")} placeholder="Website issue, hook, next message..." />
      </label>
      <div className="form-grid">
        <label>
          Website
          <input {...bind("website")} placeholder="https://..." />
        </label>
        <label>
          LinkedIn
          <input {...bind("linkedinUrl")} placeholder="https://linkedin.com/company/..." />
        </label>
        <label>
          Source
          <input {...bind("source")} />
        </label>
        <label>
          Tags
          <input {...bind("tags")} />
        </label>
      </div>
      <button className="primary-button" type="submit">
        <Plus size={16} />
        Add lead
      </button>
    </form>
  );
}

function MetricCard({
  label,
  value,
  tone,
  detail
}: {
  label: string;
  value: ReactNode;
  tone: string;
  detail?: string;
}) {
  return (
    <div className="metric-card">
      <div className="metric-label">
        <span className={`metric-swatch ${tone}`} />
        <span>{label}</span>
        <CircleDot size={14} />
      </div>
      <div className="metric-value">
        {value}
        {detail && <small>{detail}</small>}
      </div>
    </div>
  );
}

function MetricMini({ label, value, tone = "blue" }: { label: string; value: ReactNode; tone?: string }) {
  return (
    <div className="metric-mini">
      <span>{label}</span>
      <strong className={`text-${tone}`}>{value}</strong>
    </div>
  );
}

function VolumeChart({ data }: { data: Analytics["channelVolume"] }) {
  const chartData = data.length
    ? data
    : [
        { date: "2026-05-01", instagram: 0, linkedin: 0, email: 0, call: 0, replies: 0 },
        { date: "2026-05-02", instagram: 0, linkedin: 0, email: 0, call: 0, replies: 0 }
      ];
  const max = Math.max(1, ...chartData.map((item) => item.instagram + item.linkedin + item.email + item.call));
  const width = 980;
  const height = 250;
  const points = chartData
    .map((item, index) => {
      const x = chartData.length === 1 ? 0 : (index / (chartData.length - 1)) * width;
      const y = height - ((item.instagram + item.linkedin + item.email + item.call) / max) * (height - 20);
      return `${x},${y}`;
    })
    .join(" ");
  const area = `0,${height} ${points} ${width},${height}`;

  return (
    <div className="chart-wrap">
      <div className="chart-legend">
        <span>
          <i className="legend-blue" /> Sent
        </span>
        <span>
          <i className="legend-yellow" /> Replies
        </span>
        <span>
          <i className="legend-green" /> Opportunities
        </span>
      </div>
      <svg viewBox={`0 0 ${width} ${height + 36}`} role="img" aria-label="Manual outreach volume chart">
        {[0, 1, 2, 3].map((line) => (
          <line
            key={line}
            x1="0"
            x2={width}
            y1={20 + line * 62}
            y2={20 + line * 62}
            className="grid-line"
          />
        ))}
        <polygon points={area} className="chart-area" />
        <polyline points={points} className="chart-line" />
        <line x1="0" x2={width} y1={height} y2={height} className="reply-line" />
        {chartData.map((item, index) => {
          const x = chartData.length === 1 ? 0 : (index / (chartData.length - 1)) * width;
          return (
            <text key={item.date} x={x} y={height + 30} textAnchor={index === 0 ? "start" : index === chartData.length - 1 ? "end" : "middle"}>
              {dateShort(item.date)}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

function Panel({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>{title}</h2>
        {action && <span>{action}</span>}
      </div>
      {children}
    </section>
  );
}

function SearchBox({
  value,
  onChange,
  placeholder
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="search-box">
      <Search size={18} />
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </label>
  );
}

function SelectPill<T extends string>({
  value,
  onChange,
  options
}: {
  value: T;
  onChange: (value: T) => void;
  options: string[];
}) {
  return (
    <label className="select-pill">
      <Bolt size={15} />
      <select value={value} onChange={(event) => onChange(event.target.value as T)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option === "all" ? "All statuses" : option.replace("_", " ")}
          </option>
        ))}
      </select>
      <ChevronDown size={14} />
    </label>
  );
}

function StatusPill({ status, label }: { status: LeadStatus; label?: string }) {
  return <span className={`status-pill ${statusTone[status]}`}>{label || statusLabels[status]}</span>;
}

function ContactItem({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span className="contact-item">
      {icon}
      {label}
    </span>
  );
}

function FilterStack({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="filter-stack">
      <div className="filter-title">
        <span>{title}</span>
        <ChevronDown size={16} />
      </div>
      {items.map((item) => (
        <button key={item}>{item}</button>
      ))}
    </div>
  );
}

type SidebarItem = {
  label: string;
  active?: boolean;
  count?: number;
  tone?: string;
  status?: LeadStatus | "all";
  view?: ViewKey;
};

type SidebarGroup = {
  title: string;
  items: SidebarItem[];
};

function sidebarConfig(
  activeView: ViewKey,
  analytics: Analytics,
  leads: Lead[],
  tasks: Task[],
  campaigns: Campaign[],
  channelAccounts: ChannelAccount[]
) : { title: string; groups: SidebarGroup[] } {
  if (activeView === "copilot") {
    return {
      title: "Instantly Copilot",
      groups: [
        {
          title: "",
          items: [
            { label: "New chat", active: true, count: analytics.followUpsDue, tone: "blue", view: "tasks" },
            { label: "Memory", count: leads.length, tone: "green", view: "copilot" },
            { label: "Tasks", count: tasks.filter((task) => task.status === "open").length, tone: "amber", view: "tasks" }
          ]
        },
        {
          title: "Recents",
          items: [
            { label: "Roofing follow-ups", count: leads.filter((lead) => lead.niche === "Roofing").length, tone: "blue", view: "leads" },
            { label: "HVAC pricing replies", count: leads.filter((lead) => lead.niche === "HVAC").length, tone: "green", view: "inbox" }
          ]
        }
      ]
    };
  }
  if (activeView === "agents") {
    return {
      title: "AI Sales Agents",
      groups: [
        {
          title: "Agents",
          items: [
            { label: "Website audit", active: true, count: leads.filter((lead) => Boolean(lead.website)).length, tone: "blue" },
            { label: "Instagram opener", count: leads.filter((lead) => lead.status === "missing").length, tone: "violet" },
            { label: "Follow-up drafter", count: leads.filter((lead) => lead.status === "follow_up").length, tone: "amber" }
          ]
        }
      ]
    };
  }
  if (activeView === "analytics") {
    return {
      title: "Analytics",
      groups: [
        {
          title: "",
          items: [
            { label: "Campaign Analytics", active: true, count: analytics.reachedOut, tone: "blue" },
            { label: "Account Analytics", count: channelAccounts.length, tone: "green" }
          ]
        },
        {
          title: "Snapshot",
          items: [
            { label: "Missing outreach", count: analytics.missingOutreach, tone: "red", status: "missing" },
            { label: "Follow-ups due", count: analytics.followUpsDue, tone: "amber", view: "tasks" },
            { label: "Won", count: leads.filter((lead) => lead.status === "won").length, tone: "lime", status: "won" }
          ]
        }
      ]
    };
  }
  if (activeView === "leads") {
    return {
      title: "SuperSearch",
      groups: [
        {
          title: "Saved Searches",
          items: [
            { label: "Roofing owners", active: true, count: leads.filter((lead) => lead.niche === "Roofing").length, tone: "blue" },
            { label: "HVAC owners", count: leads.filter((lead) => lead.niche === "HVAC").length, tone: "green" },
            { label: "No website", count: leads.filter((lead) => !lead.website).length, tone: "amber" }
          ]
        },
        {
          title: "Lead Lists",
          items: campaigns.map((campaign) => ({
            label: campaign.name,
            count: campaign.leadIds.length,
            tone: campaign.niche === "Roofing" ? "blue" : "green"
          }))
        }
      ]
    };
  }
  if (activeView === "inbox") {
    return {
      title: "Unibox",
      groups: [
        {
          title: "Status",
          items: [
            { label: "Lead", active: true, count: leads.filter((lead) => lead.status === "missing").length, tone: "blue", status: "missing" },
            { label: "Interested", count: leads.filter((lead) => lead.status === "interested").length, tone: "green", status: "interested" },
            { label: "Meeting booked", count: leads.filter((lead) => lead.status === "meeting_booked").length, tone: "violet", status: "meeting_booked" },
            { label: "Won", count: leads.filter((lead) => lead.status === "won").length, tone: "lime", status: "won" }
          ]
        },
        {
          title: "Opportunities",
          items: [
            { label: "All Leads", count: leads.length, tone: "blue", status: "all" },
            { label: "Campaigns", count: campaigns.length, tone: "blue", view: "campaigns" },
            { label: "AI Sales Agents", count: analytics.followUpsDue, tone: "amber", view: "agents" }
          ]
        },
        {
          title: "More",
          items: [
            { label: "Lists", count: campaigns.length, tone: "blue" },
            { label: "Reports", count: analytics.replies, tone: "green" }
          ]
        }
      ]
    };
  }
  if (activeView === "campaigns") {
    return {
      title: "Campaigns",
      groups: [
        {
          title: "Lists",
          items: campaigns.map((campaign) => ({
            label: campaign.name,
            active: campaign.status === "active",
            count: campaign.leadIds.length,
            tone: campaign.niche === "Roofing" ? "blue" : "green"
          }))
        }
      ]
    };
  }
  if (activeView === "channels") {
    return {
      title: "Channels",
      groups: [
        {
          title: "Accounts",
          items: channelAccounts.map((channel) => ({
            label: channel.account,
            count: channel.sentToday,
            tone: channel.type === "instagram" ? "violet" : channel.type === "linkedin" ? "blue" : "green"
          }))
        }
      ]
    };
  }
  if (activeView === "crm") {
    return {
      title: "CRM",
      groups: [
        {
          title: "Pipeline",
          items: [
            { label: "All Leads", active: true, count: leads.length, tone: "blue", status: "all" },
            { label: "Interested", count: leads.filter((lead) => lead.status === "interested").length, tone: "green", status: "interested" },
            { label: "Meeting booked", count: leads.filter((lead) => lead.status === "meeting_booked").length, tone: "violet", status: "meeting_booked" },
            { label: "Won", count: leads.filter((lead) => lead.status === "won").length, tone: "lime", status: "won" }
          ]
        }
      ]
    };
  }
  if (activeView === "visitors") {
    return {
      title: "Website Visitors",
      groups: [
        {
          title: "Signals",
          items: [
            { label: "Pricing visits", active: true, count: leads.filter((lead) => Boolean(lead.website)).length, tone: "green" },
            { label: "Missing CTA", count: leads.filter((lead) => !lead.website).length, tone: "amber", status: "missing" }
          ]
        }
      ]
    };
  }
  if (activeView === "placement") {
    return {
      title: "Inbox Placement",
      groups: [
        {
          title: "Tests",
          items: channelAccounts.map((channel) => ({
            label: channel.account,
            count: channel.healthScore,
            tone: channel.healthScore > 90 ? "green" : "amber"
          }))
        }
      ]
    };
  }
  if (activeView === "automations") {
    return {
      title: "Automations",
      groups: [
        {
          title: "Salesflows",
          items: campaigns.map((campaign) => ({
            label: campaign.name,
            count: campaign.leadIds.length,
            tone: campaign.niche === "Roofing" ? "blue" : "green",
            view: "campaigns" as ViewKey
          }))
        }
      ]
    };
  }
  return {
    title: "Tasks",
    groups: [
      {
        title: "Open Work",
        items: [
          { label: "Follow-ups", active: true, count: tasks.filter((task) => task.type === "follow_up" && task.status === "open").length, tone: "amber" },
          { label: "Replies", count: tasks.filter((task) => task.type === "reply" && task.status === "open").length, tone: "green" },
          { label: "Meetings", count: tasks.filter((task) => task.type === "meeting" && task.status === "open").length, tone: "violet" },
          { label: "Onboarding", count: tasks.filter((task) => task.type === "onboarding" && task.status === "open").length, tone: "blue" }
        ]
      }
    ]
  };
}

function groupOutreachByLead(events: OutreachEvent[]) {
  const map = new Map<string, OutreachEvent[]>();
  for (const event of events) {
    const current = map.get(event.leadId) ?? [];
    current.push(event);
    map.set(
      event.leadId,
      current.sort((a, b) => (b.sentAt || "").localeCompare(a.sentAt || ""))
    );
  }
  return map;
}

function channelIcon(channel: ChannelType) {
  const size = 17;
  if (channel === "instagram") return <Instagram size={size} />;
  if (channel === "linkedin") return <Linkedin size={size} />;
  if (channel === "email") return <Mail size={size} />;
  return <Phone size={size} />;
}

function channelLabel(channel: ChannelType) {
  if (channel === "instagram") return "Instagram";
  if (channel === "linkedin") return "LinkedIn";
  if (channel === "email") return "Email";
  return "Call";
}

function dateShort(value: string) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en", { month: "short", day: "2-digit" }).format(new Date(value));
}

function addDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function leadsToCsv(leads: Lead[]) {
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
      headers
        .map((header) => {
          const value = lead[header as keyof Lead];
          return csvEscape(Array.isArray(value) ? value.join("|") : value);
        })
        .join(",")
    )
  ].join("\n");
}

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function exportText(filename: string, text: string, mimeType: string) {
  const blob = new Blob([text], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export default App;
