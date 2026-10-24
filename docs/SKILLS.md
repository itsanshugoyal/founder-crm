# Installed skill packages

These packages are available as Codex skills in this repository and as namespaced registrations in the user's global Codex skills folder. They provide instructions, references, templates and optional tools; they do not represent live provider connections or executed automations. New registrations are available on the next turn.

| Package | Pinned Git commit | Scope | Skills | Source files | Bytes |
| --- | --- | --- | ---: | ---: | ---: |
| anthropics/knowledge-work-plugins | `33d3dea41a341b341d4f5da2e8801ae0c89be2b8` | Complete small-business package, including shared tree/router, plus all repository root files | 44 | 216 | 1,336,140 |
| coreyhaines31/marketingskills | `e85f3cbc2e4a79bf33b2a12e9bdd9087d414735b` | Entire repository | 52 | 770 | 5,941,058 |
| Jakeschincariol/instagram-agent-skill | `d03c56bb598be770c60b201f94237e5d1a4268a6` | Entire repository, all 13 skills, tools and templates | 13 | 28 | 183,282 |
| ComposioHQ/awesome-claude-skills | `be2a406907dbc61b73e6827ded415c96139d13a2` | lead-research-assistant, meeting-insights-analyzer, invoice-organizer, plus root files | 3 | 5 | 73,810 |

Total: **112 skills; 1,019 preserved source files; 7,534,290 source bytes**. Git metadata is excluded. Root `.gitignore` files and plugin manifests are preserved as source content. No downloaded dependency or upstream setup/test/helper script was executed.

## Layout and installation

- `vendor/{smb,marketing,instagram,composio}/` preserves upstream bytes and layout, including shared references, scripts, templates and all available license notices.
- `.agents/skills/` contains namespaced Codex registration folders (`smb-*`, `marketing-*`, `ig-*`, `composio-*`). Each registration retains the full upstream skill folder, an exact `UPSTREAM-SKILL.md`, and an adapted `SKILL.md` entrypoint pointing to the canonical intact package.
- `skills-manifest.json` records source URLs, pinned commits, complete file inventories, byte counts, SHA-256 hashes, tree hashes, names, paths and unresolved upstream Markdown link baselines.
- Global source packages live under `~/.codex/skill-packages/founder-crm/vendor/`. Global registrations live under `~/.codex/skills/`. A pre-existing skill is preserved. If its usual name collides, the new global registration uses `founder-<repository-name>`; the exact `globalName` mapping is recorded in the manifest.

Run `node scripts/install-skills.mjs` for repository registrations, or append `--global` for global registrations. Re-running validates pinned source inventories and skips identical managed registrations. It refuses differing pre-existing destinations. The official Codex `install-skill-from-github.py` helper performs path/type validation, non-overwrite checks and complete-folder copying. A local-source adapter feeds the already downloaded pinned package to that helper, avoiding 112 redundant network downloads. Pass `--helper=absolute-path` if the official helper is installed elsewhere. Python and Node are required; no third-party package installation is needed.

The vendored source is part of this project: a fresh checkout does not need to download it again. Updating a pinned package is a separate reviewed change; the installer deliberately rejects source drift against an existing manifest.

Two pre-existing global names were preserved: repository `marketing-ideas` maps to global `founder-marketing-ideas`, and `marketing-psychology` maps to `founder-marketing-psychology`. All other global registration names match their repository names. The marketing source archive itself contains `scripts/__pycache__/package_skills.cpython-312.pyc`; this is preserved source content, not evidence that a helper ran. Its upstream ignore rules may require explicitly including that exact file when committing the full vendor snapshot.

Run `node scripts/verify-skills.mjs` and `node scripts/verify-skills.mjs --global` to check package and skill counts, names, canonical references, copied support files, every preserved file hash, license-file presence where upstream supplies one, duplicate names, forbidden Git metadata and relative Markdown link regressions. Verification is structural; it does not execute third-party code or test provider connections.

## Compatibility and known limitations

The canonical upstream instructions remain unedited. Codex entrypoints explicitly defer to repository rules and user authorization. Relative paths must resolve from the canonical upstream SKILL.md directory, which preserves SMB shared references and Instagram templates. Claude slash commands, tool names, plugin configuration, hooks, and `~/.claude` paths are not automatically installed as Codex integrations. Translate workflow intent using available Codex tools; choose an authorized local log path before using optional Instagram logs. Provider accounts, credentials, external writes, publishing, sends and spending require their own explicit authorization. Installation does not grant it.

The link scan records 117 unresolved literal Markdown destinations already present in the selected upstream sources: SMB 13, marketing 4, Instagram 0, Composio 100. Most are root documentation links to excluded sibling packages or placeholder examples. Two SMB examples omit the URL scheme (`design.canva.ai/...`). Marketing includes a missing `conversion-tracking.md` relative to the ads audit checklist and a `tools/PARTNERS.md` link to absent root `REGISTRY.md`, plus two placeholder `link` destinations. These are disclosed upstream issues, not silently patched. The scanner covers Markdown links with literal local targets; it cannot prove every prose path, code example, runtime import, remote link or dynamically generated file resolves. All shipped files themselves are covered by inventory hashes.

SMB, marketing and Instagram license files are retained verbatim. The pinned Composio archive has no root LICENSE or COPYING file; the three requested skills and root documentation were retained as published. No additional license grant is invented.
