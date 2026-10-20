import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, expect, it } from "vitest";

// Vitest stubs stylesheets, so the sources are read from disk.
const SHEETS = [
  "share-modal.scss",
  "items/index.scss",
  "../users-invitation/index.scss",
];

// A length, a hex colour or an rgb(a) function written in a stylesheet. The
// `--c--…--3xs` names of the tokens never match: only values do.
const LITERAL =
  /(?<![\w-])-?\d*\.?\d+(?:px|rem|em)\b|#[0-9a-fA-F]{3,8}\b|rgba?\(/g;

const literals = (sheet: string) =>
  readFileSync(resolve(__dirname, sheet), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .flatMap((line, index) =>
      (line.replace(/\/\/.*$/, "").match(LITERAL) ?? []).map(
        (literal) => `${sheet}:${index + 1} ${literal}`,
      ),
    );

describe("share modal stylesheets", () => {
  it.each(SHEETS)("%s holds no literal length or colour", (sheet) => {
    expect(literals(sheet)).toEqual([]);
  });
});
