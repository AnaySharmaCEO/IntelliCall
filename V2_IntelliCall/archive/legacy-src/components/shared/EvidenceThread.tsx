interface EvidenceThreadStep {
  role: "Statement" | "Signal" | "Decision";
  content: string;
}

interface EvidenceThreadProps {
  steps: EvidenceThreadStep[];
}

export default function EvidenceThread({ steps }: EvidenceThreadProps) {
  return (
    <div className="flex flex-col">
      {steps.map((step, i) => (
        <div
          key={i}
          className={[
            "relative pl-5 pb-4 ml-1",
            i < steps.length - 1
              ? "border-l border-[var(--color-border-default)]"
              : "",
          ].join(" ")}
        >
          <div
            className="absolute left-[-4.5px] top-[2px] w-2 h-2 rounded-full bg-[var(--color-action-primary-solid)]"
            aria-hidden="true"
          />
          <p className="text-[10px] uppercase tracking-[0.04em] text-[var(--color-text-muted)] font-semibold mb-0.5">
            {step.role}
          </p>
          <p className="text-[13px] text-[var(--color-text-primary)]">{step.content}</p>
        </div>
      ))}
    </div>
  );
}
