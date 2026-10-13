// Commit-lint rule of the fork (story s58-ci-green-basics): squash and release
// commits, whose title ends with `(#<pr>)`, are exempt; every other commit keeps
// gitlint's default rules (B1: body lines of at most 80 characters).
// Needs `gitlint` on the PATH (the `lint-git` CI job installs it with pip).
// Run: node --test scripts/gitlint-config.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const config = join(root, ".gitlint");
const hasGitlint = !spawnSync("gitlint", ["--version"]).error;
const skip = hasGitlint ? false : "gitlint is not installed (pip install gitlint)";

function lint(message) {
  const dir = mkdtempSync(join(tmpdir(), "gitlint-"));
  try {
    const file = join(dir, "msg");
    writeFileSync(file, message);
    return spawnSync(
      "gitlint",
      ["--config", config, "--msg-filename", file],
      { cwd: root, encoding: "utf8" },
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const line = (length) => "x".repeat(length);

test("a squash/release commit titled `(#n)` passes despite a 103-character body line", { skip }, () => {
  const result = lint(`🔖(release) bump ui-components to 1.4.0 (#200)\n\n* ${line(101)}\n`);
  assert.equal(result.status, 0, result.stderr);
});

test("a commit without `(#n)` in its title is rejected for an 81-character body line (B1)", { skip }, () => {
  const result = lint(`✨(Modal) add variant system\n\n${line(81)}\n`);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /B1 Line exceeds max length \(81>80\)/);
});

test("a normal short commit passes", { skip }, () => {
  const result = lint("✨(Modal) add variant system\n\nAdd the info, success and error variants.\n");
  assert.equal(result.status, 0, result.stderr);
});
