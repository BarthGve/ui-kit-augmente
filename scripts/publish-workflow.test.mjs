// Text checks of the publishing workflow (ADR 005, 007, 008).
// The file keeps the name publish-fork.yml: npm trusted publishing is bound to it.
// No YAML dependency: the workflow is split into jobs by indentation.
// Run: node --test scripts/publish-workflow.test.mjs
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

test("triggers on ui-components@* tags only, and on pull requests", () => {
  const on = header.slice(header.indexOf("\non:"));
  const push = /\n {2}push:\n((?: {4}.*\n)+)/.exec(on)?.[1] ?? "";
  const tags = [...push.matchAll(/^ {6}- ["']?([^"'\n]+)["']?$/gm)].map(
    (m) => m[1],
  );
  assert.deepEqual(tags, ["ui-components@*"]);
  assert.doesNotMatch(push, /branches/);
  assert.match(on, /\n {2}pull_request:/);
});

test("the publish job runs only on a ui-components@ tag ref", () => {
  const name = publishJob();
  assert.ok(name, "no job runs npm publish");
  const condition = /^ {4}if: (.*)$/m.exec(jobText(name))?.[1] ?? "";
  assert.match(condition, /refs\/tags\/ui-components@/);
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
  // Explicit, so a prerelease version would also be published as latest (ADR 005).
  assert.match(publish, /--tag latest(\s|$)/);
});

test("verify lints, tests the scripts, builds, packs the tag version, checks and uploads", () => {
  const job = jobText("verify");
  for (const step of [
    "yarn lint",
    "yarn test",
    "node --test scripts/package.test.mjs",
    "node --test scripts/publish-workflow.test.mjs",
    "yarn build",
    "scripts/check-package.mjs",
    "actions/upload-artifact@",
  ]) {
    assert.ok(job.includes(step), `verify lacks ${step}`);
  }
  // The tag version reaches the pack script through env, never inline.
  assert.match(job, /\$\{TAG#ui-components@\}/);
  assert.match(job, /scripts\/pack-package\.mjs "\$version"/);
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

// Job-level permissions: the 6-space keys under `    permissions:`.
const permissionsOf = (name) =>
  /^ {4}permissions:\n((?: {6}.*\n?)+)/m
    .exec(jobText(name))?.[1]
    .trim()
    .split(/\n\s*/) ?? [];
const conditionOf = (name) => /^ {4}if: (.*)$/m.exec(jobText(name))?.[1] ?? "";

test("the release job runs after publish, on the same tag condition (ADR 007)", () => {
  const job = jobText("release");
  assert.ok(jobs.release, "no release job");
  assert.match(job, /^ {4}needs: publish$/m);
  assert.match(conditionOf("release"), /refs\/tags\/ui-components@/);
  assert.doesNotMatch(conditionOf("release"), /\|\||pull_request/);
  assert.equal(conditionOf("release"), conditionOf(publishJob()));
});

test("only release writes contents, publish keeps read and id-token", () => {
  assert.deepEqual(permissionsOf("release"), ["contents: write"]);
  assert.deepEqual(permissionsOf(publishJob()), [
    "contents: read",
    "id-token: write",
  ]);
  // Not even in a comment: publishJob() and the id-token test key on these.
  assert.doesNotMatch(jobText("release"), /npm publish|id-token/);
});

test("the release job attaches the checked archive to an idempotent release", () => {
  const job = jobText("release");
  assert.match(job, /actions\/download-artifact@v8/);
  assert.match(job, /name: package/);
  assert.match(job, /GH_TOKEN: \$\{\{ github\.token \}\}/);
  assert.match(job, /\$GITHUB_REF_NAME/);
  const create = job.search(/gh release create/);
  assert.ok(create >= 0, "no gh release create");
  const view = job.search(/gh release view/);
  assert.ok(
    view >= 0 && view < create,
    "no gh release view guard before create",
  );
  assert.match(job, /gh release upload .*--clobber/);
  for (const flag of [
    "--latest=false",
    "--verify-tag",
    "--generate-notes",
    "--notes-start-tag",
    "https://www.npmjs.com/package/@barthgve/ui-components/v/",
  ]) {
    assert.ok(job.includes(flag), `release lacks ${flag}`);
  }
  // Plain semver versions are not prereleases (ADR 008).
  assert.doesNotMatch(job, /--prerelease/);
  // Notes start: the previous ui-components@ tag (sort -V), else the last fork@ tag.
  assert.match(job, /gh api .*git\/matching-refs\/tags\/\$1/);
  assert.match(job, /tags ui-components@;/);
  assert.match(job, /tags fork@ \| sort -V \| tail -n 1/);
  assert.match(job, /sort -V/);
});

test("changesets compares against the integration branch next", () => {
  const config = JSON.parse(
    readFileSync(repo(".changeset/config.json"), "utf8"),
  );
  assert.equal(config.baseBranch, "next");
});
