#!/usr/bin/env node
// Stage and pack ui-components under the fork's npm scope (ADR 005).
// The source package.json is never written: name and version are rewritten
// in a staging copy only.
//
// Usage: node scripts/stage-fork-package.mjs <version> [--scope @barthgve]
//          [--package-dir packages/ui-components] [--out <staging dir>]
// Prints the path of the packed archive as its last line.
import { execFileSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const fail = (message) => {
  console.error(`stage-fork-package: ${message}`);
  process.exit(1);
};

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    scope: { type: "string", default: "@barthgve" },
    "package-dir": {
      type: "string",
      default: fileURLToPath(
        new URL("../packages/ui-components", import.meta.url),
      ),
    },
    out: { type: "string" },
  },
});

const [version] = positionals;
const packageDir = resolve(values["package-dir"]);
const source = JSON.parse(
  readFileSync(join(packageDir, "package.json"), "utf8"),
);

const match = /^(\d+\.\d+\.\d+)-fork\.([1-9]\d*)$/.exec(version ?? "");
if (!match) fail(`version "${version}" must be <base>-fork.<N> with N >= 1`);
if (match[1] !== source.version) {
  fail(
    `version "${version}" has base ${match[1]}, expected ${source.version} (current version)`,
  );
}
if (!existsSync(join(packageDir, "dist"))) {
  fail(`${join(packageDir, "dist")} is missing: run yarn build first`);
}

const out = values.out
  ? resolve(values.out)
  : mkdtempSync(join(tmpdir(), "fork-stage-"));
mkdirSync(out, { recursive: true });
cpSync(join(packageDir, "dist"), join(out, "dist"), { recursive: true });
for (const file of ["README.md", "LICENSE"]) {
  if (existsSync(join(packageDir, file)))
    cpSync(join(packageDir, file), join(out, file));
}

const staged = {
  ...source,
  name: `${values.scope}/${source.name.split("/").at(-1)}`,
  version,
  repository: {
    type: "git",
    url: "git+https://github.com/BarthGve/ui-kit-augmente.git",
    directory: "packages/ui-components",
  },
};
writeFileSync(
  join(out, "package.json"),
  JSON.stringify(staged, null, 2) + "\n",
);

const packed = execFileSync(
  "npm",
  ["pack", "--ignore-scripts", "--json", "--pack-destination", out],
  { cwd: out, encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] },
);
console.log(join(out, JSON.parse(packed)[0].filename));
