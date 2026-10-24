import { useState } from "react";
import { Link } from "react-router-dom";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";

export default function AccountSettingsPage() {
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-[720px]">
      {/* Breadcrumb */}
      <nav className="text-[12px] mb-4" style={{ color: "var(--color-text-muted)" }}>
        <Link
          to="/settings"
          className="hover:underline"
          style={{ color: "var(--color-action-primary)" }}
        >
          Settings
        </Link>
        <span className="mx-1.5">›</span>
        <span style={{ color: "var(--color-text-primary)" }}>Account</span>
      </nav>

      <h1 className="text-[22px] font-semibold mb-6" style={{ color: "var(--color-text-primary)" }}>
        Account
      </h1>

      {/* Profile section */}
      <div
        className="rounded-[var(--radius-md)] p-6 flex flex-col gap-4 mb-4"
        style={{
          background: "var(--color-bg-surface)",
          border: "1px solid var(--color-border-subtle)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <h2 className="text-[15px] font-semibold" style={{ color: "var(--color-text-primary)" }}>
          Profile
        </h2>
        <Input label="Full name" defaultValue="Jamie Rivera" />
        <Input label="Email address" type="email" defaultValue="jamie@acme.com" />
        <div
          className="flex items-center justify-between pt-4"
          style={{ borderTop: "1px solid var(--color-border-subtle)" }}
        >
          {saved && (
            <span className="text-[12px] font-semibold" style={{ color: "var(--color-success)" }}>
              Saved.
            </span>
          )}
          <Button onClick={handleSave} className="ml-auto">Save profile</Button>
        </div>
      </div>

      {/* Password section */}
      <div
        className="rounded-[var(--radius-md)] p-6 flex flex-col gap-4 mb-4"
        style={{
          background: "var(--color-bg-surface)",
          border: "1px solid var(--color-border-subtle)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <h2 className="text-[15px] font-semibold" style={{ color: "var(--color-text-primary)" }}>
          Password
        </h2>
        <Input label="Current password" type="password" placeholder="••••••••" />
        <Input label="New password" type="password" placeholder="••••••••" />
        <Input label="Confirm new password" type="password" placeholder="••••••••" />
        <div
          className="flex justify-end pt-4"
          style={{ borderTop: "1px solid var(--color-border-subtle)" }}
        >
          <Button>Update password</Button>
        </div>
      </div>

      {/* Notifications section */}
      <div
        className="rounded-[var(--radius-md)] p-6 flex flex-col gap-3"
        style={{
          background: "var(--color-bg-surface)",
          border: "1px solid var(--color-border-subtle)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <h2 className="text-[15px] font-semibold mb-1" style={{ color: "var(--color-text-primary)" }}>
          Notifications
        </h2>
        {[
          { id: "review", label: "Decision review required", desc: "Notify when a decision needs human approval", defaultChecked: true },
          { id: "outcome", label: "Outcome updates", desc: "Notify when a lead progresses to a new stage", defaultChecked: true },
          { id: "call", label: "Call completed", desc: "Notify when an AI call finishes", defaultChecked: false },
        ].map(pref => (
          <label
            key={pref.id}
            className="flex items-start gap-3 cursor-pointer py-2"
            style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
          >
            <input
              type="checkbox"
              defaultChecked={pref.defaultChecked}
              className="mt-0.5 flex-shrink-0"
              style={{ accentColor: "var(--color-action-primary-solid)" }}
            />
            <div>
              <p className="text-[13px] font-medium" style={{ color: "var(--color-text-primary)" }}>
                {pref.label}
              </p>
              <p className="text-[12px]" style={{ color: "var(--color-text-secondary)" }}>
                {pref.desc}
              </p>
            </div>
          </label>
        ))}
        <div className="flex justify-end pt-2">
          <Button>Save preferences</Button>
        </div>
      </div>
    </div>
  );
}
