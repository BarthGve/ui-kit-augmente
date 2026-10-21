import { readSheet } from "read-excel-file/browser";

export const ACCEPTED_FILE_EXTENSIONS = [".csv", ".xlsx"];
export const MAX_IMPORT_FILE_SIZE = 200 * 1024; // 200 KB
export const DEFAULT_MAX_IMPORT_ROWS = 100;

export type ShareImportRow = {
  email: string;
  role: string;
};

export type ShareImportParseError =
  | { type: "file_too_large" }
  | { type: "unreadable" }
  | { type: "empty" }
  | { type: "invalid_row"; row: number }
  | { type: "too_many_rows"; max: number };

export type ShareImportParseResult =
  | { rows: ShareImportRow[]; error?: never }
  | { rows?: never; error: ShareImportParseError };

/**
 * Parses a single CSV line. Quoted fields containing the delimiter are
 * supported, `""` inside quotes unescapes to `"`. Fields spanning several
 * lines are not supported (emails and roles never contain newlines).
 */
const parseCsvLine = (line: string, delimiter: string): string[] => {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === delimiter) {
      fields.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields;
};

/**
 * Validates raw rows: each non-blank row must contain exactly two non-empty
 * fields (email, role). Blank rows are skipped but still counted so that
 * `invalid_row` reports the 1-based row number of the original file.
 */
const toRows = (rawRows: string[][]): ShareImportParseResult => {
  const rows: ShareImportRow[] = [];
  for (let index = 0; index < rawRows.length; index++) {
    const fields = rawRows[index].map((field) => field.trim());
    while (fields.length > 0 && fields[fields.length - 1] === "") {
      fields.pop();
    }
    if (fields.length === 0) {
      continue;
    }
    if (fields.length !== 2 || fields[0] === "" || fields[1] === "") {
      return { error: { type: "invalid_row", row: index + 1 } };
    }
    rows.push({ email: fields[0], role: fields[1] });
  }
  if (rows.length === 0) {
    return { error: { type: "empty" } };
  }
  return { rows };
};

/**
 * Reads the cells of a CSV or XLSX file, one array of strings per row, or
 * `undefined` when the file cannot be read.
 */
export const readRawRows = async (file: File): Promise<string[][] | undefined> => {
  if (file.name.toLowerCase().endsWith(".xlsx")) {
    try {
      const cells = await readSheet(file);
      return cells.map((row) =>
        row.map((cell) => (cell === null ? "" : String(cell))),
      );
    } catch {
      return undefined;
    }
  }
  let text: string;
  try {
    text = await file.text();
  } catch {
    return undefined;
  }
  if (text.charCodeAt(0) === 0xfeff) {
    text = text.slice(1);
  }
  const lines = text.split(/\r\n|\r|\n/);
  // French Excel/Calc exports CSV with ";" as delimiter.
  const firstLine = lines.find((line) => line.trim() !== "");
  const delimiter = firstLine?.includes(";") ? ";" : ",";
  return lines.map((line) => parseCsvLine(line, delimiter));
};

const parseRaw = async (file: File): Promise<ShareImportParseResult> => {
  const raw = await readRawRows(file);
  return raw ? toRows(raw) : { error: { type: "unreadable" } };
};

export const parseShareImportFile = async (
  file: File,
  options?: { maxRows?: number },
): Promise<ShareImportParseResult> => {
  if (file.size > MAX_IMPORT_FILE_SIZE) {
    return { error: { type: "file_too_large" } };
  }
  const result = await parseRaw(file);
  const maxRows = options?.maxRows ?? DEFAULT_MAX_IMPORT_ROWS;
  if (result.rows && result.rows.length > maxRows) {
    return { error: { type: "too_many_rows", max: maxRows } };
  }
  return result;
};
