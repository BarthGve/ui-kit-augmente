// Tests for the publishing scripts (ADR 005, ADR 008).
// Run: node --test scripts/package.test.mjs
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
const PACK = join(here, "pack-package.mjs");
const CHECK = join(here, "check-package.mjs");

const root = mkdtempSync(join(tmpdir(), "package-test-"));
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
    name: "@barthgve/ui-components",
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

const pack = (pkgDir, version, out) =>
  run(PACK, [version, "--package-dir", pkgDir, "--out", out]);

describe("pack-package", () => {
  const { dir, manifest } = fakePackage();
  const sourceBytes = readFileSync(join(dir, "package.json"));
  const out = fresh("out");
  const result = pack(dir, "1.3.0", out);

  test("packs the source manifest unchanged", () => {
    assert.equal(result.status, 0, result.stderr);
    const archive = result.stdout.trim().split("\n").at(-1);
    const staged = JSON.parse(
      spawnSync("tar", ["-xzOf", archive, "package/package.json"], {
        encoding: "utf8",
      }).stdout,
    );
    assert.equal(staged.name, "@barthgve/ui-components");
    assert.equal(staged.version, "1.3.0");
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

  // Not semver, or not the package.json version (1.3.0).
  for (const bad of ["1.3.1", "1.3.0-fork.1", "2.0.0", "1.3", "abc"]) {
    test(`refuses version ${bad} and writes nothing`, () => {
      const refusedOut = fresh("refused");
      const r = pack(dir, bad, refusedOut);
      assert.notEqual(r.status, 0);
      assert.match(r.stderr, /version/i);
      assert.equal(existsSync(refusedOut), false);
      assert.ok(readFileSync(join(dir, "package.json")).equals(sourceBytes));
    });
  }

  test("refuses when dist is missing and writes nothing", () => {
    const noDist = fakePackage({ dist: false });
    const refusedOut = fresh("refused");
    const r = pack(noDist.dir, "1.3.0", refusedOut);
    assert.notEqual(r.status, 0);
    assert.match(r.stderr, /dist/);
    assert.equal(existsSync(refusedOut), false);
  });
});

const online = spawnSync("npm", ["ping"], { encoding: "utf8" }).status === 0;
const offline =
  !online &&
  "skipped: npm ping failed, the install check needs the npm registry";

describe("check-package", { skip: offline }, () => {
  const archiveOf = (pkg) => {
    const r = pack(pkg.dir, "1.3.0", fresh("out"));
    assert.equal(r.status, 0, r.stderr);
    return r.stdout.trim().split("\n").at(-1);
  };

  test("passes on a well-formed archive", () => {
    const r = run(CHECK, [archiveOf(fakePackage()), "1.3.0"]);
    assert.equal(r.status, 0, r.stdout + r.stderr);
  });

  test("fails when an exports entry points to a missing file", () => {
    const broken = fakePackage({
      exports: {
        ".": { import: "./dist/index.js" },
        "./style": "./dist/missing.css",
      },
    });
    const r = run(CHECK, [archiveOf(broken), "1.3.0"]);
    assert.notEqual(r.status, 0);
    assert.match(r.stdout + r.stderr, /\.\/style/);
  });

  test("fails when the version differs from the installed manifest", () => {
    const r = run(CHECK, [archiveOf(fakePackage()), "1.3.1"]);
    assert.notEqual(r.status, 0);
  });
});
