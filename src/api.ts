import type { CrmData, Lead, LeadStatus, NewLeadInput, OutreachEvent, Task } from "./types";
import {
  createLocalLead,
  importLocalCsv,
  logLocalOutreach,
  patchLocalLead,
  patchLocalTask,
  readLocalCrm
} from "./localStore";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(options?.headers || {})
    }
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `Request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export function fetchCrm() {
  return request<CrmData>("/api/crm").catch(() => readLocalCrm());
}

export function createLead(input: NewLeadInput) {
  return request<{ lead: Lead; analytics: CrmData["analytics"] }>("/api/leads", {
    method: "POST",
    body: JSON.stringify({
      ...input,
      tags: input.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
    })
  }).catch(() => createLocalLead(input));
}

export function updateLeadStatus(leadId: string, status: LeadStatus) {
  return request<{ lead: Lead; analytics: CrmData["analytics"] }>(`/api/leads/${leadId}`, {
    method: "PATCH",
    body: JSON.stringify({ status })
  }).catch(() => patchLocalLead(leadId, { status }));
}

export function archiveLead(leadId: string) {
  return request<{ lead: Lead; analytics: CrmData["analytics"] }>(`/api/leads/${leadId}`, {
    method: "PATCH",
    body: JSON.stringify({ archived: true })
  }).catch(() => patchLocalLead(leadId, { archived: true }));
}

export function logOutreach(payload: Partial<OutreachEvent> & { leadId: string }) {
  return request<{ event: OutreachEvent; analytics: CrmData["analytics"] }>("/api/outreach", {
    method: "POST",
    body: JSON.stringify(payload)
  }).catch(() => logLocalOutreach(payload));
}

export function importCsv(text: string) {
  return request<{ imported: number; leads: Lead[]; analytics: CrmData["analytics"] }>("/api/import/csv", {
    method: "POST",
    headers: { "content-type": "text/csv" },
    body: text
  }).catch(() => importLocalCsv(text));
}

export function updateTask(taskId: string, patch: Partial<Task>) {
  return request<{ task: Task; analytics: CrmData["analytics"] }>(`/api/tasks/${taskId}`, {
    method: "PATCH",
    body: JSON.stringify(patch)
  }).catch(() => patchLocalTask(taskId, patch));
}
