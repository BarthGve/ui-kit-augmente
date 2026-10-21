import { readRawRows } from ":/components/share/import-modal/utils";

export type ContactRow = { email: string; name: string };
export type EditableContact = ContactRow & { id: string };
export type ContactStatus = "valid" | "invalid" | "duplicate";
export type ValidatedContact = EditableContact & {
  status: ContactStatus;
  /** 1-based position in the table. */
  position?: number;
};

export type ContactParseResult =
  | { rows: ContactRow[]; error?: never }
  | { rows?: never; error: "unreadable" | "empty" };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HEADER = /^(e-?mail|courriel|mail)$/i;

/**
 * Reads contacts from a CSV or XLSX file: the e-mail in the first column and
 * an optional name in the second. A first row that names the e-mail column is
 * a header and is skipped. Addresses are not validated here.
 */
export const parseContacts = async (
  file: File,
): Promise<ContactParseResult> => {
  const raw = await readRawRows(file);
  if (!raw) {
    return { error: "unreadable" };
  }
  const rows = raw
    .map((fields) => fields.map((field) => field.trim()))
    .filter((fields) => fields.some((field) => field !== ""));
  if (rows.length > 0 && HEADER.test(rows[0][0] ?? "")) {
    rows.shift();
  }
  if (rows.length === 0) {
    return { error: "empty" };
  }
  return { rows: rows.map(([email = "", name = ""]) => ({ email, name })) };
};

/**
 * Flags each contact: `invalid` when the address is malformed, `duplicate`
 * when an earlier row has the same address (case and spaces ignored).
 */
export const validateContacts = (
  contacts: EditableContact[],
): ValidatedContact[] => {
  const seen = new Set<string>();
  return contacts.map((contact) => {
    const key = contact.email.trim().toLowerCase();
    if (!EMAIL.test(key)) {
      return { ...contact, status: "invalid" as const };
    }
    if (seen.has(key)) {
      return { ...contact, status: "duplicate" as const };
    }
    seen.add(key);
    return { ...contact, status: "valid" as const };
  });
};
