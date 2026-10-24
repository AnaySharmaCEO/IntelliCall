export interface CanonicalField {
  key: "name" | "email" | "phone" | "company" | "source";
  label: string;
  required: boolean;
  aliases: string[];
}

export const CANONICAL_LEAD_FIELDS: CanonicalField[] = [
  {
    key: "name",
    label: "Name / Full Name",
    required: true,
    aliases: [
      "name",
      "full name",
      "fullname",
      "contact name",
      "lead name",
      "prospect name",
      "first name",
      "contact",
    ],
  },
  {
    key: "email",
    label: "Email Address",
    required: true,
    aliases: [
      "email",
      "email address",
      "e-mail",
      "e-mail address",
      "contact email",
      "work email",
      "primary email",
      "mail",
    ],
  },
  {
    key: "phone",
    label: "Phone Number",
    required: false,
    aliases: [
      "phone",
      "phone number",
      "mobile",
      "mobile phone",
      "contact number",
      "cell",
      "telephone",
      "direct dial",
      "phone_number",
    ],
  },
  {
    key: "company",
    label: "Company / Organization",
    required: false,
    aliases: [
      "company",
      "company name",
      "organization",
      "organisation",
      "employer",
      "account",
      "firm",
      "business",
    ],
  },
  {
    key: "source",
    label: "Lead Source",
    required: false,
    aliases: [
      "source",
      "lead source",
      "channel",
      "origin",
      "campaign source",
      "utm_source",
      "referral source",
    ],
  },
];

/**
 * Normalizes a header string for alias comparison:
 * lowercase, removes special characters / extra punctuation, trims spaces.
 */
export function normalizeHeader(str: string): string {
  return str
    .toLowerCase()
    .replace(/[_\-]+/g, " ")
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Given the uploaded column headers, auto-detects the best match for each canonical field.
 * Returns a mapping: { [canonicalFieldKey]: matchedUploadedHeader | "" }
 */
export function detectColumnMapping(
  uploadedHeaders: string[]
): Record<string, string> {
  const mapping: Record<string, string> = {
    name: "",
    email: "",
    phone: "",
    company: "",
    source: "",
  };

  const usedUploadedHeaders = new Set<string>();

  for (const field of CANONICAL_LEAD_FIELDS) {
    for (const rawHeader of uploadedHeaders) {
      if (usedUploadedHeaders.has(rawHeader)) continue;

      const norm = normalizeHeader(rawHeader);

      // Exact match or matches any defined alias
      const isMatch = field.aliases.some((alias) => {
        const normAlias = normalizeHeader(alias);
        return norm === normAlias || norm === normAlias.replace(/\s+/g, "");
      });

      if (isMatch) {
        mapping[field.key] = rawHeader;
        usedUploadedHeaders.add(rawHeader);
        break;
      }
    }
  }

  return mapping;
}
