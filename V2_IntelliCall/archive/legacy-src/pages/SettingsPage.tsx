import { useState } from "react";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import { Tabs, TabPanel } from "../components/ui/Tabs";

export default function SettingsPage() {
  const [tab, setTab] = useState("workspace");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-[720px]">
      <h1
        className="text-[22px] font-semibold mb-6"
        style={{ color: "var(--color-text-primary)" }}
      >
        Settings
      </h1>

      <Tabs
        tabs={[
          { id: "workspace", label: "Workspace" },
          { id: "users", label: "Users" },
          { id: "voice", label: "Voice & booking" },
          { id: "integrations", label: "Integrations" },
        ]}
        active={tab}
        onChange={setTab}
        className="mb-6"
      />

      {/* ── Workspace ── */}
      <TabPanel id="workspace" active={tab}>
        <div
          className="rounded-[var(--radius-md)] p-6 flex flex-col gap-4"
          style={{
            background: "var(--color-bg-surface)",
            border: "1px solid var(--color-border-subtle)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <h2 className="text-[15px] font-semibold" style={{ color: "var(--color-text-primary)" }}>
            Workspace
          </h2>
          <Input label="Workspace name" defaultValue="Acme Outbound" />
          <Input label="Workspace slug" defaultValue="acme-outbound" />
          <div
            className="flex items-center justify-between pt-4"
            style={{ borderTop: "1px solid var(--color-border-subtle)" }}
          >
            {saved && (
              <span
                className="text-[12px] font-semibold"
                style={{ color: "var(--color-success)" }}
              >
                Changes saved.
              </span>
            )}
            <div className="ml-auto">
              <Button onClick={handleSave}>Save changes</Button>
            </div>
          </div>
        </div>
      </TabPanel>

      {/* ── Users ── */}
      <TabPanel id="users" active={tab}>
        <div
          className="rounded-[var(--radius-md)] overflow-hidden"
          style={{
            background: "var(--color-bg-surface)",
            border: "1px solid var(--color-border-subtle)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div
            className="px-4 py-3.5 flex items-center justify-between"
            style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
          >
            <h2 className="text-[14px] font-semibold" style={{ color: "var(--color-text-primary)" }}>
              Users
            </h2>
            <Button size="sm">Invite user</Button>
          </div>
          {[
            { name: "Jamie Rivera", email: "jamie@acme.com", role: "Admin", initials: "JR" },
            { name: "Sam Chen", email: "sam@acme.com", role: "Member", initials: "SC" },
          ].map(user => (
            <div
              key={user.email}
              className="flex items-center justify-between px-4 py-3 text-[13px]"
              style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center justify-center rounded-full text-[11px] font-semibold flex-shrink-0"
                  style={{
                    width: 32,
                    height: 32,
                    background: "var(--color-action-secondary-bg)",
                    color: "var(--color-action-primary)",
                  }}
                >
                  {user.initials}
                </div>
                <div>
                  <p className="font-medium" style={{ color: "var(--color-text-primary)" }}>
                    {user.name}
                  </p>
                  <p
                    style={{
                      fontFamily: "var(--font-data)",
                      fontSize: 11,
                      color: "var(--color-text-muted)",
                    }}
                  >
                    {user.email}
                  </p>
                </div>
              </div>
              <span style={{ color: "var(--color-text-secondary)" }}>{user.role}</span>
            </div>
          ))}
          <div className="px-4 py-3" style={{ borderTop: "1px solid var(--color-border-subtle)" }}>
            <p className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>
              2 of 5 seats used.
            </p>
          </div>
        </div>
      </TabPanel>

      {/* ── Voice & booking ── */}
      <TabPanel id="voice" active={tab}>
        <div className="flex flex-col gap-4">
          <div
            className="rounded-[var(--radius-md)] p-6"
            style={{
              background: "var(--color-bg-surface)",
              border: "1px solid var(--color-border-subtle)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <h2
              className="text-[15px] font-semibold mb-4"
              style={{ color: "var(--color-text-primary)" }}
            >
              Voice provider
            </h2>
            <div className="flex flex-col gap-3">
              {[
                { id: "alloy", label: "Alloy", desc: "Neutral, clear — recommended for B2B outbound" },
                { id: "echo", label: "Echo", desc: "Warm, measured — suits discovery calls" },
                { id: "nova", label: "Nova", desc: "Friendly, conversational — works for inbound follow-up" },
              ].map(v => (
                <label
                  key={v.id}
                  className="flex items-start gap-3 p-3 rounded-[var(--radius-sm)] cursor-pointer"
                  style={{ background: "var(--color-bg-sunken)" }}
                >
                  <input
                    type="radio"
                    name="voice"
                    defaultChecked={v.id === "alloy"}
                    className="mt-0.5 flex-shrink-0"
                    style={{ accentColor: "var(--color-action-primary-solid)" }}
                  />
                  <div>
                    <p className="text-[13px] font-semibold" style={{ color: "var(--color-text-primary)" }}>
                      {v.label}
                    </p>
                    <p className="text-[12px]" style={{ color: "var(--color-text-secondary)" }}>
                      {v.desc}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div
            className="rounded-[var(--radius-md)] p-6"
            style={{
              background: "var(--color-bg-surface)",
              border: "1px solid var(--color-border-subtle)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <h2
              className="text-[15px] font-semibold mb-4"
              style={{ color: "var(--color-text-primary)" }}
            >
              Booking configuration
            </h2>
            <div className="flex flex-col gap-3">
              <Input label="Calendar link (Calendly or Google Calendar)" defaultValue="https://calendly.com/acme-outbound/30min" />
              <Input label="Meeting title template" defaultValue="{Lead name} × Acme Outbound — Intro call" />
              <Input label="Confirmation email from" defaultValue="calls@acme-outbound.com" />
            </div>
            <div
              className="flex justify-end pt-4 mt-2"
              style={{ borderTop: "1px solid var(--color-border-subtle)" }}
            >
              <Button onClick={handleSave}>Save voice settings</Button>
            </div>
          </div>
        </div>
      </TabPanel>

      {/* ── Integrations ── */}
      <TabPanel id="integrations" active={tab}>
        <div
          className="rounded-[var(--radius-md)] p-6"
          style={{
            background: "var(--color-bg-surface)",
            border: "1px solid var(--color-border-subtle)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <h2
            className="text-[15px] font-semibold mb-4"
            style={{ color: "var(--color-text-primary)" }}
          >
            Integrations
          </h2>
          <div className="flex flex-col gap-3">
            {[
              { name: "CRM (Salesforce, HubSpot)", note: "Coming later" },
              { name: "Calendar (Google Calendar, Calendly)", note: "Coming later" },
              { name: "Voice provider (Twilio, Vonage)", note: "Coming later" },
              { name: "SMS / WhatsApp", note: "Coming later" },
            ].map(item => (
              <div
                key={item.name}
                className="flex items-center justify-between p-3 rounded-[var(--radius-sm)] text-[13px]"
                style={{ background: "var(--color-bg-sunken)" }}
              >
                <span style={{ color: "var(--color-text-secondary)" }}>{item.name}</span>
                <span
                  className="text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {item.note}
                </span>
              </div>
            ))}
          </div>
        </div>
      </TabPanel>
    </div>
  );
}
