import { parsePhoneNumberFromString } from "libphonenumber-js";

/**
 * Format an integer paise value or numeric INR into Indian currency format (₹1,25,000).
 */
export function formatCurrency(
  value: number,
  options: { isPaise?: boolean; compact?: boolean } = {}
): string {
  const amount = options.isPaise ? value / 100 : value;

  if (options.compact) {
    if (Math.abs(amount) >= 10000000) {
      return `₹${(amount / 10000000).toFixed(1)}Cr`;
    }
    if (Math.abs(amount) >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    }
    if (Math.abs(amount) >= 1000) {
      return `₹${(amount / 1000).toFixed(1)}k`;
    }
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format duration in seconds to m:ss or h:mm:ss.
 */
export function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  const pad = (n: number) => n.toString().padStart(2, "0");

  if (h > 0) {
    return `${h}:${pad(m)}:${pad(s)}`;
  }
  return `${m}:${pad(s)}`;
}

/**
 * Format an ISO timestamp string into Indian Standard Time display.
 */
export function formatDateTime(
  isoString: string | null | undefined,
  options: { includeTime?: boolean; relative?: boolean } = { includeTime: true }
): string {
  if (!isoString) return "—";
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return "—";

  if (options.relative) {
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hr ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
  }

  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(options.includeTime
      ? {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }
      : {}),
  }).format(date);
}

export const formatDate = formatDateTime;


/**
 * Format a phone number to standard Indian presentation (+91 98765 43210).
 * Supports masking for roles lacking PII permissions (+91 98••• ••210).
 */
export function formatPhone(phone: string, masked = false): string {
  if (!phone) return "—";
  const parsed = parsePhoneNumberFromString(phone, "IN");
  const raw = parsed ? parsed.formatInternational() : phone;

  if (masked && raw.length >= 10) {
    const parts = raw.split(" ");
    if (parts.length >= 3) {
      return `${parts[0]} ${parts[1]?.slice(0, 2)}••• ••${parts[2]?.slice(-3)}`;
    }
    return `${raw.slice(0, 5)}•••••${raw.slice(-2)}`;
  }

  return raw;
}

/**
 * Format a ratio/percentage with 1 decimal place.
 */
export function formatPercent(value: number): string {
  return `${(value * (value <= 1 ? 100 : 1)).toFixed(1)}%`;
}
