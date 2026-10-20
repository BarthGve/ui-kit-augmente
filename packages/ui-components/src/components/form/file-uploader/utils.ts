/**
 * Human-readable file size formatting (decimal units).
 * e.g. 248 * 1000 * 1000 -> "248 MB", 12 * 1000^3 -> "12 GB".
 */
export const formatBytes = (bytes: number, decimals = 0): string => {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }
  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1000)),
    units.length - 1,
  );
  const value = bytes / Math.pow(1000, exponent);
  const rounded = exponent === 0 ? value : Number(value.toFixed(decimals));
  return `${rounded} ${units[exponent]}`;
};

/**
 * Whether a file matches an `accept` attribute value: extensions (`.pdf`),
 * MIME types (`image/png`) and wildcards (`image/*`), comma separated. No
 * restriction when `accept` is empty.
 */
export const isAccepted = (file: File, accept?: string) => {
  const rules = (accept ?? "")
    .split(",")
    .map((rule) => rule.trim().toLowerCase())
    .filter(Boolean);
  if (rules.length === 0) {
    return true;
  }
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return rules.some((rule) =>
    rule.startsWith(".")
      ? name.endsWith(rule)
      : rule.endsWith("/*")
        ? type.startsWith(rule.slice(0, -1))
        : type === rule,
  );
};
