#!/usr/bin/env node
// Pack-and-install check of the ui-components archive (ADR 005, ADR 008).
// Installs the archive in a throwaway project under the upstream key
// (@gouvfr-lasuite/ui-components), as existing applications do with the alias,
// then checks the manifest, every exports entry and the ui-tokens dependency.
// Needs the npm registry (the archive's dependencies are installed).
//
// Usage: node scripts/check-package.mjs <archive.tgz> <version>
import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const KEY = "@gouvfr-lasuite/ui-components";
const NAME = "@barthgve/ui-components";
const TOKENS = "@gouvfr-lasuite/ui-tokens";

const [archive, version] = process.argv.slice(2);
if (!archive || !version) {
  console.error("usage: check-package.mjs <archive.tgz> <version>");
  process.exit(1);
}

const project = mkdtempSync(join(tmpdir(), "package-check-"));
const finish = (code) => {
  rmSync(project, { recursive: true, force: true });
  process.exit(code);
};
const check = (ok, label) => {
  console.log(`${ok ? "ok" : "FAIL"} ${label}`);
  if (!ok) finish(1);
};

writeFileSync(
  join(project, "package.json"),
  JSON.stringify({
    name: "package-check",
    private: true,
    type: "module",
    dependencies: { [KEY]: `file:${resolve(archive)}` },
  }),
);
try {
  execFileSync(
    "npm",
    ["install", "--ignore-scripts", "--no-audit", "--no-fund"],
    {
      cwd: project,
      stdio: ["ignore", "ignore", "inherit"],
    },
  );
} catch {
  check(false, `npm install of ${archive}`);
}

const installed = JSON.parse(
  readFileSync(join(project, "node_modules", KEY, "package.json"), "utf8"),
);
check(
  installed.name === NAME,
  `manifest name ${installed.name} (expected ${NAME})`,
);
check(
  installed.version === version,
  `manifest version ${installed.version} (expected ${version})`,
);

// Resolve each exports entry through the alias key, from inside the project.
writeFileSync(
  join(project, "resolve.mjs"),
  "for (const s of process.argv.slice(2)) { let r = null; try { r = import.meta.resolve(s); } catch {} console.log(JSON.stringify(r)); }",
);
const keys = Object.keys(installed.exports ?? {});
const specifiers = keys.map((k) => KEY + k.slice(1));
check(keys.length > 0, "exports map present");
const resolved = execFileSync(
  process.execPath,
  ["resolve.mjs", ...specifiers],
  {
    cwd: project,
    encoding: "utf8",
  },
)
  .trim()
  .split("\n")
  .map((line) => JSON.parse(line));
keys.forEach((key, i) => {
  const url = resolved[i];
  const ok = url?.startsWith("file:") && existsSync(fileURLToPath(url));
  check(ok, `exports ${key} -> ${url ?? "unresolved"}`);
});

const wanted = installed.dependencies?.[TOKENS];
check(Boolean(wanted), `${TOKENS} declared in dependencies (${wanted})`);
const tokensManifest = join(project, "node_modules", TOKENS, "package.json");
const tokensVersion = existsSync(tokensManifest)
  ? JSON.parse(readFileSync(tokensManifest, "utf8")).version
  : "missing";
check(tokensVersion === wanted, `${TOKENS} installed at ${tokensVersion}`);
finish(0);
