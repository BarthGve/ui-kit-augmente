// Tests for the fork publishing scripts (ADR 005, story s56-publish-fork).
// Run: node --test scripts/fork-package.test.mjs
import { test, describe, after } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const STAGE = join(here, "stage-fork-package.mjs");
const CHECK = join(here, "check-fork-package.mjs");

const root = mkdtempSync(join(tmpdir(), "fork-package-test-"));
after(() => rmSync(root, { recursive: true, force: true }));
let n = 0;
const fresh = (name) => join(root, `${name}-${n++}`);

const run = (script, args) =>
  spawnSync(process.execPath, [script, ...args], { encoding: "utf8" });

// A fake ui-components folder: a stub dist plus files that must stay out of the archive.
function fakePackage({ dist = true, exports } = {}) {
  const dir = fresh("pkg");
  mkdirSync(join(dir, "src"), { recursive: true });
  const manifest = {
    name: "@gouvfr-lasuite/ui-components",
    version: "1.3.0",
    license: "MIT",
    type: "module",
    publishConfig: { access: "public" },
    files: ["dist"],
    exports: exports ?? {
      ".": {
        types: "./dist/index.d.ts",
        import: "./dist/index.js",
        require: "./dist/index.cjs",
      },
      "./style": "./dist/style.css",
    },
    dependencies: { "@gouvfr-lasuite/ui-tokens": "3.2.0" },
    peerDependencies: { react: "^19.1.2" },
  };
  writeFileSync(
    join(dir, "package.json"),
    JSON.stringify(manifest, null, 2) + "\n",
  );
  for (const f of [
    "README.md",
    "LICENSE",
    "CHANGELOG.md",
    "notes.txt",
    "src/index.ts",
  ]) {
    writeFileSync(join(dir, f), f);
  }
  if (dist) {
    mkdirSync(join(dir, "dist"));
    for (const f of ["index.js", "index.cjs", "index.d.ts", "style.css"]) {
      writeFileSync(join(dir, "dist", f), "");
    }
  }
  return { dir, manifest };
}

const stage = (pkgDir, version, out) =>
  run(STAGE, [version, "--package-dir", pkgDir, "--out", out]);

describe("stage-fork-package", () => {
  const { dir, manifest } = fakePackage();
  const sourceBytes = readFileSync(join(dir, "package.json"));
  const out = fresh("out");
  const result = stage(dir, "1.3.0-fork.1", out);

  test("stages the package with the fork name and version", () => {
    assert.equal(result.status, 0, result.stderr);
    const staged = JSON.parse(readFileSync(join(out, "package.json"), "utf8"));
    assert.equal(staged.name, "@barthgve/ui-components");
    assert.equal(staged.version, "1.3.0-fork.1");
    assert.equal(typeof staged.repository, "object");
    assert.equal(staged.repository.directory, "packages/ui-components");
    for (const key of [
      "exports",
      "files",
      "dependencies",
      "peerDependencies",
    ]) {
      assert.deepEqual(staged[key], manifest[key], key);
    }
    assert.equal(staged.dependencies["@gouvfr-lasuite/ui-tokens"], "3.2.0");
  });

  test("leaves the source package.json byte-identical", () => {
    assert.ok(readFileSync(join(dir, "package.json")).equals(sourceBytes));
  });

  test("prints an archive holding only dist, package.json, README.md and LICENSE", () => {
    const archive = result.stdout.trim().split("\n").at(-1);
    assert.ok(archive.endsWith(".tgz") && existsSync(archive), archive);
    const listing = spawnSync("npm", ["pack", "--dry-run", "--json", archive], {
      cwd: root,
      encoding: "utf8",
    });
    const paths = JSON.parse(listing.stdout)[0].files.map((f) => f.path);
    assert.ok(paths.includes("dist/index.js"), paths.join());
    const outside = paths.filter(
      (p) =>
        !p.startsWith("dist/") &&
        !["package.json", "README.md", "LICENSE"].includes(p),
    );
    assert.deepEqual(outside, []);
  });

  for (const bad of [
    "1.3.0",
    "1.3.0-fork.0",
    "1.3.0-fork.x",
    "1.4.0-fork.1",
    "abc",
  ]) {
    test(`refuses version ${bad} and writes nothing`, () => {
      const refusedOut = fresh("refused");
      const r = stage(dir, bad, refusedOut);
      assert.notEqual(r.status, 0);
      assert.match(r.stderr, /version/i);
      assert.equal(existsSync(refusedOut), false);
      assert.ok(readFileSync(join(dir, "package.json")).equals(sourceBytes));
    });
  }

  test("refuses when dist is missing and writes nothing", () => {
    const noDist = fakePackage({ dist: false });
    const refusedOut = fresh("refused");
    const r = stage(noDist.dir, "1.3.0-fork.1", refusedOut);
    assert.notEqual(r.status, 0);
    assert.match(r.stderr, /dist/);
    assert.equal(existsSync(refusedOut), false);
  });
});

const online = spawnSync("npm", ["ping"], { encoding: "utf8" }).status === 0;
const offline =
  !online &&
  "skipped: npm ping failed, the install check needs the npm registry";

describe("check-fork-package", { skip: offline }, () => {
  const archiveOf = (pkg) => {
    const r = stage(pkg.dir, "1.3.0-fork.1", fresh("out"));
    assert.equal(r.status, 0, r.stderr);
    return r.stdout.trim().split("\n").at(-1);
  };

  test("passes on a well-formed archive", () => {
    const r = run(CHECK, [archiveOf(fakePackage()), "1.3.0-fork.1"]);
    assert.equal(r.status, 0, r.stdout + r.stderr);
  });

  test("fails when an exports entry points to a missing file", () => {
    const broken = fakePackage({
      exports: {
        ".": { import: "./dist/index.js" },
        "./style": "./dist/missing.css",
      },
    });
    const r = run(CHECK, [archiveOf(broken), "1.3.0-fork.1"]);
    assert.notEqual(r.status, 0);
    assert.match(r.stdout + r.stderr, /\.\/style/);
  });

  test("fails when the version differs from the installed manifest", () => {
    const r = run(CHECK, [archiveOf(fakePackage()), "1.3.0-fork.2"]);
    assert.notEqual(r.status, 0);
  });
});
