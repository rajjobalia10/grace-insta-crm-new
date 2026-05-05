export type LeadStatus =
  | "missing"
  | "contacted"
  | "follow_up"
  | "interested"
  | "meeting_booked"
  | "won"
  | "lost";

export type ChannelType = "instagram" | "linkedin" | "email" | "call";

export type OutreachDirection = "outbound" | "inbound";

export type Lead = {
  id: string;
  businessName: string;
  niche: string;
  location: string;
  website: string;
  instagramHandle: string;
  linkedinUrl: string;
  email: string;
  owner: string;
  source: string;
  status: LeadStatus;
  tags: string[];
  assignedUser: string;
  notes: string;
  setupFee: number;
  monthlyFee: number;
  createdAt: string;
  updatedAt: string;
  archived: boolean;
};

export type OutreachEvent = {
  id: string;
  leadId: string;
  channel: ChannelType;
  accountUsed: string;
  direction: OutreachDirection;
  status: string;
  sentAt: string;
  repliedAt: string;
  snippet: string;
  nextFollowUp: string;
};

export type Campaign = {
  id: string;
  name: string;
  niche: string;
  locations: string[];
  channelMix: ChannelType[];
  status: string;
  leadIds: string[];
  createdAt: string;
  updatedAt: string;
};

export type Task = {
  id: string;
  leadId: string;
  type: string;
  dueDate: string;
  status: string;
  owner: string;
  notes: string;
};

export type ChannelAccount = {
  id: string;
  type: ChannelType;
  account: string;
  status: string;
  dailyLimit: number;
  sentToday: number;
  repliesToday: number;
  healthScore: number;
  notes: string;
};

export type ChannelVolume = {
  date: string;
  instagram: number;
  linkedin: number;
  email: number;
  call: number;
  replies: number;
};

export type Analytics = {
  totalLeads: number;
  reachedOut: number;
  missingOutreach: number;
  replies: number;
  replyRate: number;
  interested: number;
  meetings: number;
  wonRevenue: number;
  projectedMrr: number;
  followUpsDue: number;
  channelVolume: ChannelVolume[];
};

export type CrmData = {
  leads: Lead[];
  outreachEvents: OutreachEvent[];
  campaigns: Campaign[];
  tasks: Task[];
  channels: ChannelAccount[];
  analytics: Analytics;
  meta?: {
    version: number;
    updatedAt: string;
  };
};

export type NewLeadInput = Pick<
  Lead,
  | "businessName"
  | "niche"
  | "location"
  | "website"
  | "instagramHandle"
  | "linkedinUrl"
  | "email"
  | "owner"
  | "source"
  | "assignedUser"
  | "notes"
> & {
  tags: string;
};
