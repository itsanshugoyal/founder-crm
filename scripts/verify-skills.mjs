import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { inventory, localReferences } from "./install-skills.mjs";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(
  fs.readFileSync(path.join(root, "skills-manifest.json"), "utf8"),
);
const globalMode = process.argv.includes("--global");
const destination = globalMode
  ? path.join(os.homedir(), ".codex", "skills")
  : path.join(root, ".agents", "skills");
const sourceRoot = globalMode
  ? path.join(os.homedir(), ".codex", "skill-packages", "founder-crm", "vendor")
  : path.join(root, "vendor");
const errors = [],
  names = [],
  upstreamMissing = [];
const hash = (data) => crypto.createHash("sha256").update(data).digest("hex");
for (const p of manifest.packages) {
  const source = path.join(sourceRoot, p.id);
  if (!fs.existsSync(source)) {
    errors.push(`Missing package ${p.id}`);
    continue;
  }
  const actual = inventory(source);
  if (JSON.stringify(actual) !== JSON.stringify(p.files))
    errors.push(`Package inventory/hash mismatch: ${p.id}`);
  if (hash(JSON.stringify(actual)) !== p.treeSha256)
    errors.push(`Tree checksum mismatch: ${p.id}`);
  const skillCount = actual.filter(
    (f) => f.path.endsWith("/SKILL.md") || f.path === "SKILL.md",
  ).length;
  if (skillCount !== p.expectedSkills || p.skills.length !== p.expectedSkills)
    errors.push(`Skill count mismatch: ${p.id}`);
  const missing = localReferences(source);
  if (
    JSON.stringify(missing) !==
    JSON.stringify(p.upstreamUnresolvedMarkdownLinks)
  )
    errors.push(`Relative reference regression: ${p.id}`);
  upstreamMissing.push({ package: p.id, count: missing.length });
  if (
    !actual.some((f) => /license|copying/i.test(f.path)) &&
    p.id !== "composio"
  )
    errors.push(`License missing: ${p.id}`);
  for (const s of p.skills) {
    const registeredName = globalMode ? (s.globalName ?? s.name) : s.name;
    names.push(registeredName);
    const dest = path.join(destination, registeredName),
      skillSource = path.join(source, s.path);
    if (!fs.existsSync(path.join(dest, "SKILL.md"))) {
      errors.push(`Missing registration: ${s.name}`);
      continue;
    }
    const descriptor = fs
      .readFileSync(path.join(dest, "SKILL.md"), "utf8")
      .replaceAll("\r\n", "\n");
    if (!descriptor.includes(`name: ${registeredName}\n`))
      errors.push(`Descriptor name mismatch: ${s.name}`);
    const canonical = descriptor.match(
      /\[the complete upstream skill\]\(([^)]+)\)/,
    )?.[1];
    if (
      !canonical ||
      path.resolve(dest, canonical) !== path.join(skillSource, "SKILL.md")
    )
      errors.push(`Canonical reference broken: ${s.name}`);
    for (const f of inventory(skillSource)) {
      const target = path.join(
        dest,
        f.path === "SKILL.md" ? "UPSTREAM-SKILL.md" : f.path,
      );
      if (!fs.existsSync(target) || hash(fs.readFileSync(target)) !== f.sha256)
        errors.push(`Copied support file missing/changed: ${s.name}/${f.path}`);
    }
  }
}
if (new Set(names).size !== names.length)
  errors.push("Duplicate registered names");
if (names.length !== manifest.skillCount || names.length !== 112)
  errors.push("Total skill count mismatch");
if (errors.length) {
  console.error(JSON.stringify({ ok: false, errors }, null, 2));
  process.exitCode = 1;
} else
  console.log(
    JSON.stringify(
      {
        ok: true,
        skills: names.length,
        scope: globalMode ? "global" : "repository",
        packages: manifest.packages.map((p) => ({
          id: p.id,
          skills: p.skills.length,
          files: p.fileCount,
          bytes: p.totalBytes,
          treeSha256: p.treeSha256,
        })),
        upstreamUnresolvedMarkdownLinks: upstreamMissing,
        licenseLimitations: [
          "Pinned Composio source supplies no LICENSE or COPYING file.",
        ],
        note: "Upstream missing links are recorded baselines, not repaired or claimed valid. No upstream helper/setup/provider commands executed.",
      },
      null,
      2,
    ),
  );
