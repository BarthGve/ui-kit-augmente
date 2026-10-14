// Text checks of the fork publishing workflow (ADR 005, story s56-publish-fork).
// No YAML dependency: the workflow is split into jobs by indentation.
// Run: node --test scripts/publish-fork-workflow.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const repo = (path) => fileURLToPath(new URL(`../${path}`, import.meta.url));
const WORKFLOW = repo(".github/workflows/publish-fork.yml");
const text = existsSync(WORKFLOW) ? readFileSync(WORKFLOW, "utf8") : "";
const lines = text.split("\n");

// Header = everything before `jobs:`; jobs = blocks starting at a 2-space key.
const jobsAt = lines.indexOf("jobs:");
const header = lines.slice(0, jobsAt).join("\n");
const jobs = {};
let current = null;
for (const line of lines.slice(jobsAt + 1)) {
  const m = /^ {2}([\w-]+):\s*$/.exec(line);
  if (m) jobs[(current = m[1])] = [];
  else if (current) jobs[current].push(line);
}
const jobText = (name) => (jobs[name] ?? []).join("\n");
const publishJob = () =>
  Object.keys(jobs).find((name) => /\bnpm publish\b/.test(jobText(name)));

test("the workflow exists and has jobs", () => {
  assert.ok(jobsAt > 0, `${WORKFLOW} missing or without jobs`);
});

test("triggers on fork@* tags only, and on pull requests", () => {
  const on = header.slice(header.indexOf("\non:"));
  const push = /\n {2}push:\n((?: {4}.*\n)+)/.exec(on)?.[1] ?? "";
  const tags = [...push.matchAll(/^ {6}- ["']?([^"'\n]+)["']?$/gm)].map(
    (m) => m[1],
  );
  assert.deepEqual(tags, ["fork@*"]);
  assert.doesNotMatch(push, /branches/);
  assert.match(on, /\n {2}pull_request:/);
});

test("the publish job runs only on a fork@ tag ref", () => {
  const name = publishJob();
  assert.ok(name, "no job runs npm publish");
  const condition = /^ {4}if: (.*)$/m.exec(jobText(name))?.[1] ?? "";
  assert.match(condition, /refs\/tags\/fork@/);
  assert.doesNotMatch(condition, /\|\||pull_request/);
  assert.match(jobText(name), /^ {4}needs: verify$/m);
});

test("id-token appears only in the publish job and no secret is used", () => {
  const name = publishJob();
  const outside = [
    header,
    ...Object.keys(jobs)
      .filter((job) => job !== name)
      .map(jobText),
  ].join("\n");
  assert.doesNotMatch(outside, /id-token/);
  assert.match(jobText(name), /id-token: write/);
  assert.doesNotMatch(
    [header, ...Object.keys(jobs).map(jobText)].join("\n"),
    /secrets\.|NODE_AUTH_TOKEN/,
  );
});

test("the publish job checks the tag commit is an ancestor of main before publishing", () => {
  const job = jobText(publishJob());
  assert.match(job, /fetch-depth: 0/);
  const ancestor = job.search(/git merge-base --is-ancestor .*origin\/main/);
  assert.ok(ancestor >= 0, "no ancestor check against origin/main");
  assert.ok(
    ancestor < job.search(/npm publish/),
    "ancestor check after publish",
  );
  assert.doesNotMatch(job, /registry-url/);
});

test("npm publish carries provenance, public access and the latest tag", () => {
  const publish = /npm publish .*/.exec(jobText(publishJob()))?.[0] ?? "";
  assert.match(publish, /--provenance/);
  assert.match(publish, /--access public/);
  // X.Y.Z-fork.N is a prerelease: npm refuses it without --tag (ADR 005: latest).
  assert.match(publish, /--tag latest(\s|$)/);
});

test("verify lints, tests the scripts, builds, stages the tag version, checks and uploads", () => {
  const job = jobText("verify");
  for (const step of [
    "yarn lint",
    "yarn test",
    "node --test scripts/fork-package.test.mjs",
    "node --test scripts/publish-fork-workflow.test.mjs",
    "yarn build",
    "scripts/check-fork-package.mjs",
    "actions/upload-artifact@",
  ]) {
    assert.ok(job.includes(step), `verify lacks ${step}`);
  }
  // The tag version reaches the stage script through env, never inline.
  assert.match(job, /\$\{TAG#fork@\}/);
  assert.match(job, /scripts\/stage-fork-package\.mjs "\$version"/);
  assert.doesNotMatch(
    job,
    /^ {4}if:/m,
    "verify must also run on pull requests",
  );
});

test("no run line interpolates the git ref", () => {
  assert.doesNotMatch(text, /run: .*\$\{\{ github\.ref/);
  for (const [, block] of text.matchAll(/run: \|\n((?: {10,}.*\n)+)/g)) {
    assert.doesNotMatch(block, /\$\{\{ github\.ref/);
  }
});

test("changesets compares against the integration branch next", () => {
  const config = JSON.parse(
    readFileSync(repo(".changeset/config.json"), "utf8"),
  );
  assert.equal(config.baseBranch, "next");
});
