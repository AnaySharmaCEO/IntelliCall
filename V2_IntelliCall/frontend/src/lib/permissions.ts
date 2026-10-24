export type Role = "owner" | "admin" | "manager" | "agent_operator" | "viewer";

export type Permission =
  | "leads.read"
  | "leads.write"
  | "leads.import"
  | "leads.delete"
  | "campaigns.read"
  | "campaigns.write"
  | "campaigns.launch"
  | "agents.read"
  | "agents.write"
  | "agents.publish"
  | "agents.test"
  | "calls.read"
  | "calls.listen"
  | "calls.live_monitor"
  | "review.read"
  | "review.resolve"
  | "appointments.read"
  | "appointments.write"
  | "compliance.read"
  | "compliance.write"
  | "audit.read"
  | "settings.org"
  | "settings.team"
  | "settings.billing"
  | "settings.api_keys"
  | "pii.read";

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  owner: [
    "leads.read",
    "leads.write",
    "leads.import",
    "leads.delete",
    "campaigns.read",
    "campaigns.write",
    "campaigns.launch",
    "agents.read",
    "agents.write",
    "agents.publish",
    "agents.test",
    "calls.read",
    "calls.listen",
    "calls.live_monitor",
    "review.read",
    "review.resolve",
    "appointments.read",
    "appointments.write",
    "compliance.read",
    "compliance.write",
    "audit.read",
    "settings.org",
    "settings.team",
    "settings.billing",
    "settings.api_keys",
    "pii.read",
  ],
  admin: [
    "leads.read",
    "leads.write",
    "leads.import",
    "leads.delete",
    "campaigns.read",
    "campaigns.write",
    "campaigns.launch",
    "agents.read",
    "agents.write",
    "agents.publish",
    "agents.test",
    "calls.read",
    "calls.listen",
    "calls.live_monitor",
    "review.read",
    "review.resolve",
    "appointments.read",
    "appointments.write",
    "compliance.read",
    "compliance.write",
    "audit.read",
    "settings.org",
    "settings.team",
    "settings.billing",
    "settings.api_keys",
    "pii.read",
  ],
  manager: [
    "leads.read",
    "leads.write",
    "leads.import",
    "campaigns.read",
    "campaigns.write",
    "campaigns.launch",
    "agents.read",
    "agents.write",
    "agents.publish",
    "agents.test",
    "calls.read",
    "calls.listen",
    "calls.live_monitor",
    "review.read",
    "review.resolve",
    "appointments.read",
    "appointments.write",
    "compliance.read",
    "audit.read",
    "pii.read",
  ],
  agent_operator: [
    "leads.read",
    "leads.write",
    "campaigns.read",
    "campaigns.launch",
    "agents.read",
    "agents.test",
    "calls.read",
    "calls.listen",
    "calls.live_monitor",
    "review.read",
    "review.resolve",
    "appointments.read",
    "appointments.write",
    "compliance.read",
  ],
  viewer: [
    "leads.read",
    "campaigns.read",
    "agents.read",
    "calls.read",
    "review.read",
    "appointments.read",
    "compliance.read",
    "audit.read",
  ],
};

/**
 * Check if a role has the required permission.
 */
export function can(role: Role | string | undefined | null, permission: Permission): boolean {
  if (!role) return false;
  const normalized = (role as Role).toLowerCase() as Role;
  const perms = ROLE_PERMISSIONS[normalized];
  return perms ? perms.includes(permission) : false;
}

export const hasPermission = can;

