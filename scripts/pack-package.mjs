#!/usr/bin/env node
// Pack ui-components for publication (ADR 008).
// The requested version must equal the one in package.json: a mistyped tag
// would otherwise publish a wrong, immutable npm version.
//
// Usage: node scripts/pack-package.mjs <version>
//          [--package-dir packages/ui-components] [--out <dir>]
// Prints the path of the packed archive as its last line.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const fail = (message) => {
  console.error(`pack-package: ${message}`);
  process.exit(1);
};

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
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

if (!/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(version ?? "")) {
  fail(`version "${version}" is not a semver version x.y.z`);
}
if (version !== source.version) {
  fail(`version "${version}" differs from package.json (${source.version})`);
}
if (!existsSync(join(packageDir, "dist"))) {
  fail(`${join(packageDir, "dist")} is missing: run yarn build first`);
}

const out = values.out
  ? resolve(values.out)
  : mkdtempSync(join(tmpdir(), "package-"));
mkdirSync(out, { recursive: true });

const packed = execFileSync(
  "npm",
  ["pack", "--ignore-scripts", "--json", "--pack-destination", out],
  { cwd: packageDir, encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] },
);
console.log(join(out, JSON.parse(packed)[0].filename));
