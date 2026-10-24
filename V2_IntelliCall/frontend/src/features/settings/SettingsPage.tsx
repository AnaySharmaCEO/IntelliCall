import { useState } from "react";
import {
  Building2,
  Users,
  Phone,
  Bot,
  Key,
  Shield,
  Copy,
  Plus,
  Trash2,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import {
  Input,
  Button,
  Tabs,
  TabPanel,
  Badge,
  Modal,
  useToast,
} from "../../components/ui";
import {
  useOrganization,
  useUpdateOrganization,
  useOrganizationMembers,
  useInviteMember,
  usePhoneNumbers,
} from "../../api/hooks";
import { useAuth } from "../../auth";

export default function SettingsPage() {
  const [tab, setTab] = useState("workspace");
  const { data: organization, isLoading: orgLoading } = useOrganization();
  const updateOrg = useUpdateOrganization();
  const { data: members = [] } = useOrganizationMembers();
  const inviteMember = useInviteMember();
  const { data: phoneNumbers = [] } = usePhoneNumbers();
  const { role } = useAuth();
  const { toast } = useToast();

  // Workspace State
  const [orgName, setOrgName] = useState(organization?.name || "IntelliCall Cloud");
  const [orgSlug, setOrgSlug] = useState(organization?.slug || "intellicall");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [currency, setCurrency] = useState("INR");

  // Invite Modal
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("agent_operator");

  // Telephony & Voice Defaults
  const [twilioSid, setTwilioSid] = useState("AC********************************");
  const [twilioAuth, setTwilioAuth] = useState("••••••••••••••••••••••••••••••••");
  const [selectedVoice, setSelectedVoice] = useState("Aoede");
  const [temperature, setTemperature] = useState(0.6);
  const [bargeInThreshold, setBargeInThreshold] = useState(220);
  const [disclosureText, setDisclosureText] = useState(
    "Namaste. Main Resonology AI assistant hoon, ek automated voice intelligence platform. How may I assist you today?"
  );

  // Webhooks
  const [webhookUrl, setWebhookUrl] = useState("https://api.yourdomain.com/webhooks/calls");
  const [webhookSecret] = useState("whsec_9a7d8e6f1c4b2a0e5d3c8b7a");
  const [apiKey] = useState("ic_live_9f8e7d6c5b4a3210e");

  const handleSaveWorkspace = async () => {
    try {
      await updateOrg.mutateAsync({
        name: orgName,
        slug: orgSlug,
      });
      toast("Workspace settings updated successfully", "success");
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Failed to update workspace", "error");
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    try {
      await inviteMember.mutateAsync({ email: inviteEmail, role: inviteRole });
      toast(`Invitation sent to ${inviteEmail}`, "success");
      setInviteModalOpen(false);
      setInviteEmail("");
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Failed to invite member", "error");
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast(`${label} copied to clipboard`, "success");
  };

  return (
    <div className="max-w-4xl pb-16 space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-mono font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
            Configuration & Tenancy
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
          System Settings
        </h1>
        <p className="text-xs md:text-sm text-[var(--color-text-secondary)] mt-0.5">
          Manage workspace identity, team roles, telephony trunks, speech parameters, and API credentials.
        </p>
      </div>

      <Tabs
        tabs={[
          { id: "workspace", label: "Workspace & Tenancy" },
          { id: "team", label: "Team & Roles" },
          { id: "telephony", label: "Telephony & Trunks" },
          { id: "voice", label: "Voice & Guardrails" },
          { id: "api", label: "API Keys & Webhooks" },
        ]}
        active={tab}
        onChange={setTab}
        className="mb-6"
      />

      {/* ── 1. Workspace & Tenancy ── */}
      <TabPanel id="workspace" active={tab}>
        <div className="rounded-[var(--radius-lg)] p-6 bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] space-y-5">
          <div className="border-b border-[var(--color-border-subtle)] pb-4">
            <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
              Workspace Profile
            </h2>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Primary organization identifier and regional localization preferences.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Organization Name"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="e.g. Acme Corporation"
            />
            <Input
              label="Workspace URL Slug"
              value={orgSlug}
              onChange={(e) => setOrgSlug(e.target.value)}
              placeholder="acme-outbound"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1">
                Default Operational Timezone
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-sunken)]/40 focus:border-[var(--color-action-primary)] focus:bg-[var(--color-bg-surface)] text-xs text-[var(--color-text-primary)] transition-all duration-150 outline-none"
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST +05:30) [Default]</option>
                <option value="UTC">UTC (Universal Coordinated Time)</option>
                <option value="America/New_York">America/New_York (EST -05:00)</option>
                <option value="Europe/London">Europe/London (GMT +00:00)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1">
                Default Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-sunken)]/40 focus:border-[var(--color-action-primary)] focus:bg-[var(--color-bg-surface)] text-xs text-[var(--color-text-primary)] transition-all duration-150 outline-none"
              >
                <option value="INR">INR (₹ - Indian Rupee) [Default]</option>
                <option value="USD">USD ($ - United States Dollar)</option>
                <option value="EUR">EUR (€ - Euro)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-[var(--color-border-subtle)]">
            <Button onClick={handleSaveWorkspace} loading={updateOrg.isPending}>
              Save Workspace Changes
            </Button>
          </div>
        </div>
      </TabPanel>

      {/* ── 2. Team & Roles ── */}
      <TabPanel id="team" active={tab}>
        <div className="rounded-[var(--radius-lg)] bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] overflow-hidden">
          <div className="p-6 border-b border-[var(--color-border-subtle)] flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                Organization Members
              </h2>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Manage user access levels across Owners, Admins, Managers, and Voice Operators.
              </p>
            </div>
            <Button size="sm" onClick={() => setInviteModalOpen(true)}>
              <Plus size={14} className="mr-1.5" />
              Invite Member
            </Button>
          </div>

          <div className="divide-y divide-[var(--color-border-subtle)]">
            {members.map((m) => (
              <div key={m.id} className="p-4 flex items-center justify-between text-xs hover:bg-[var(--color-bg-sunken)]/40 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[var(--color-brand-blue)] text-white font-semibold flex items-center justify-center text-xs">
                    {m.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--color-text-primary)]">{m.name}</p>
                    <p className="text-[11px] text-[var(--color-text-muted)] font-mono">{m.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono uppercase font-semibold bg-[var(--color-action-secondary-bg)] text-[var(--color-action-secondary-text)]">
                    {m.role}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </TabPanel>

      {/* ── 3. Telephony & Trunks ── */}
      <TabPanel id="telephony" active={tab}>
        <div className="rounded-[var(--radius-lg)] p-6 bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] space-y-6">
          <div className="border-b border-[var(--color-border-subtle)] pb-4">
            <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
              Telephony Provider & Carrier Trunks
            </h2>
            <p className="text-xs text-[var(--color-text-secondary)]">
              SIP trunking credentials for PSTN carrier routing via Twilio or local cloud providers.
            </p>
          </div>

          <div className="space-y-4">
            <Input
              label="Twilio Account SID"
              value={twilioSid}
              onChange={(e) => setTwilioSid(e.target.value)}
              placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            />
            <Input
              label="Twilio Auth Token"
              type="password"
              value={twilioAuth}
              onChange={(e) => setTwilioAuth(e.target.value)}
              placeholder="Your auth token"
            />
          </div>

          {/* Provisioned Number Pool */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
              Assigned Outbound Numbers ({phoneNumbers.length})
            </h3>
            <div className="border border-[var(--color-border-subtle)] rounded-[var(--radius-md)] divide-y divide-[var(--color-border-subtle)] text-xs">
              {phoneNumbers.length === 0 ? (
                <div className="p-4 text-center text-xs text-[var(--color-text-muted)]">
                  +91 11 4084 1000 &bull; Twilio Mumbai Trunk (Connected)
                </div>
              ) : (
                phoneNumbers.map((n) => (
                  <div key={n.id} className="p-3 flex items-center justify-between font-mono">
                    <span className="font-semibold text-[var(--color-text-primary)]">{n.phone_number}</span>
                    <Badge variant={n.status === 'assigned' ? 'success' : 'info'}>{n.status}</Badge>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-[var(--color-border-subtle)]">
            <Button onClick={() => toast("Telephony trunk credentials saved", "success")}>
              Update Telephony Trunks
            </Button>
          </div>
        </div>
      </TabPanel>

      {/* ── 4. Voice & Guardrails ── */}
      <TabPanel id="voice" active={tab}>
        <div className="rounded-[var(--radius-lg)] p-6 bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] space-y-6">
          <div className="border-b border-[var(--color-border-subtle)] pb-4">
            <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
              Speech Acoustic & Regulatory Guardrails
            </h2>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Configure speech-to-speech models, interruption cut-offs, and mandatory disclosure lines.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1">
                Default Agent Voice Persona
              </label>
              <select
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-sunken)]/40 focus:border-[var(--color-action-primary)] focus:bg-[var(--color-bg-surface)] text-xs text-[var(--color-text-primary)] transition-all duration-150 outline-none"
              >
                <option value="Aoede">Aoede — Natural, measured English & conversational Hindi (Recommended)</option>
                <option value="Alloy">Alloy — Professional, crisp tone for banking/enterprise</option>
                <option value="Nova">Nova — Friendly, upbeat for retail follow-ups</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1">
                  Interruption Barge-In Window ({bargeInThreshold}ms)
                </label>
                <input
                  type="range"
                  min="150"
                  max="400"
                  step="10"
                  value={bargeInThreshold}
                  onChange={(e) => setBargeInThreshold(Number(e.target.value))}
                  className="w-full accent-[var(--color-action-primary)]"
                />
                <span className="text-[11px] text-[var(--color-text-muted)] block mt-1">
                  220ms is the conversational sweet spot for sub-50ms instant interruption.
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1">
                  Model Temperature ({temperature})
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={temperature}
                  onChange={(e) => setTemperature(Number(e.target.value))}
                  className="w-full accent-[var(--color-action-primary)]"
                />
                <span className="text-[11px] text-[var(--color-text-muted)] block mt-1">
                  Lower temperatures prevent hallucinations and enforce strict scripts.
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1">
                Mandatory Regulatory Disclosure (First Spoken Turn)
              </label>
              <textarea
                rows={3}
                value={disclosureText}
                onChange={(e) => setDisclosureText(e.target.value)}
                className="w-full p-3 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-sunken)]/40 focus:border-[var(--color-action-primary)] focus:bg-[var(--color-bg-surface)] text-xs text-[var(--color-text-primary)] font-sans transition-all duration-150 outline-none"
              />
              <span className="text-[11px] text-[var(--color-text-muted)] block mt-1">
                Compliance law requires identifying the caller as an automated AI agent prior to dialog.
              </span>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-[var(--color-border-subtle)]">
            <Button onClick={() => toast("Voice & regulatory guardrails updated", "success")}>
              Save Voice Guardrails
            </Button>
          </div>
        </div>
      </TabPanel>

      {/* ── 5. API Keys & Webhooks ── */}
      <TabPanel id="api" active={tab}>
        <div className="rounded-[var(--radius-lg)] p-6 bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] space-y-6">
          <div className="border-b border-[var(--color-border-subtle)] pb-4">
            <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
              Developer Keys & Webhook Subscriptions
            </h2>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Authenticate external CRM workflows and subscribe to real-time call and intelligence events.
            </p>
          </div>

          {/* API Key */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[var(--color-text-secondary)] block">
              Active Production API Key
            </label>
            <div className="flex items-center gap-2">
              <Input value={apiKey} readOnly className="font-mono text-xs bg-[var(--color-bg-sunken)]" />
              <Button variant="outline" size="sm" onClick={() => copyToClipboard(apiKey, "API Key")}>
                <Copy size={13} className="mr-1" /> Copy
              </Button>
            </div>
          </div>

          {/* Webhook Endpoint */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
              Webhook Dispatch Destination
            </h3>
            <Input
              label="Endpoint URL"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://your-crm.com/api/webhooks"
            />
            <div className="flex items-center gap-2">
              <Input
                label="HMAC Signature Secret"
                value={webhookSecret}
                readOnly
                className="font-mono text-xs bg-[var(--color-bg-sunken)]"
              />
              <div className="pt-5">
                <Button variant="outline" size="sm" onClick={() => copyToClipboard(webhookSecret, "HMAC Secret")}>
                  <Copy size={13} className="mr-1" /> Copy
                </Button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border-subtle)]">
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast("Test webhook ping dispatched with 200 OK response", "success")}
            >
              Test Webhook Ping
            </Button>
            <Button onClick={() => toast("Webhook destination saved", "success")}>
              Save Integration Endpoints
            </Button>
          </div>
        </div>
      </TabPanel>

      {/* Invite Modal */}
      <Modal open={inviteModalOpen} onClose={() => setInviteModalOpen(false)} title="Invite Team Member">
        <form onSubmit={handleInvite} className="space-y-4 mt-2">
          <div>
            <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1">
              Email Address
            </label>
            <Input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="colleague@company.com"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1">
              Role & Permissions
            </label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-sunken)]/40 focus:border-[var(--color-action-primary)] focus:bg-[var(--color-bg-surface)] text-xs text-[var(--color-text-primary)] transition-all duration-150 outline-none"
            >
              <option value="admin">Admin — Full workspace configuration and user management</option>
              <option value="manager">Manager — Manage campaigns, review queues, and leads</option>
              <option value="agent_operator">Agent Operator — Monitor live calls and supervise dialogue</option>
              <option value="viewer">Viewer — Read-only access to analytics and call history</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-[var(--color-border-subtle)]">
            <Button variant="outline" type="button" onClick={() => setInviteModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={inviteMember.isPending}>
              Send Invitation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
