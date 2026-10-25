# Founder CRM: Decision Studio

Design decision, 25 October 2026. This replaces the rejected pine/ivory/copper ledger direction. Implementation follows the design review below; a new palette alone does not satisfy the brief.

## Understanding and scope

- A private multi-project workspace for Anshu, Nahush and invited collaborators.
- Help a founder decide who deserves attention, understand the evidence, review a message and keep the next commitment.
- The user wants a distinctive, contemporary interface, with the power of the existing CRM and less visible complexity.
- Real project records drive the experience. No invented revenue, activity, profile photography, conversion rates or AI priorities.
- Every outward message remains individually human-reviewed and sent. Research, drafts, approval and actual sends are separate states.
- Preserve Supabase, project isolation, existing actions, zero paid model calls and the current small-team scale.
- Non-goals: a marketing landing page, a decorative analytics dashboard, a new relationship graph, autonomous sending or a simultaneous feature expansion.

Assumptions: desktop is the main review surface; phones must support a complete single-record review. Existing names and project switcher remain recognizable. The current records contain unknowns and legacy holds, so apparent completeness must never imply readiness. The founder chooses priority; the app may surface the earliest dated open work with its reason. Research pages may remain slow or inaccessible; an empty fact is not a negative finding.

## Alternatives considered

| Direction | Primary object | Advantage | Cost / decision |
| --- | --- | --- | --- |
| Decision Studio | One pending decision or commitment | Matches daily work; useful with sparse real data; clear safety boundaries | Chosen. Needs a restrained focus panel so it does not become another dashboard hero. |
| Relationship Atlas | A person and their dossier | Strong context for meetings and research | Three persistent panes and new navigation state add complexity, especially on phone. Retain dossier ideas inside existing record context. |
| Operations Tape | A chronological stream | Distinctive, easy to scan recent changes | History competes with unfinished work; old activity can look actionable. Keep a small readable history section instead. |

## Flow before screens

```text
Choose project → Today: what needs attention?
  ├─ Open commitment → Review record → Save → Return to list
  ├─ Review drafts → Choose person → Choose purpose → Read message
  │   ├─ Expand evidence / view person → Return to same draft
  │   └─ Review exact message → Human approval → Individual human send
  ├─ People → Filter/search → Review person + linked evidence
  └─ Work → Choose workstream → Open task → Save

Settings / Money / Reports / Knowledge / Automation stay available in the rail.
```

No new navigation layer. Existing drawers retain a visible close/escape path. Primary destinations remain links; modified-click and browser back work. Workflow labels describe the result rather than the internal record type.

## Page compositions

**Today — What should I open next?** Compact split composition: a left-aligned date and daily brief on an open light surface, a sharply bounded focus panel containing one real record and the reason it appears. Default priority is dated open work, not a guessed deal score. Four action queues are a horizontal ruled strip, not repeated metric cards. The working list is dominant; project context and upcoming meetings are secondary. Empty focus says there is no open work. The history below uses readable sentences, never raw imported JSON.

**People — Who is this and what do we know?** Search and meaningful filters first; strong identity column, quieter evidence, qualification and next-follow-up fields. Unknown facts remain explicit. A table is useful here; do not replace it with a wall of cards. Contact detail keeps related drafts, work and sources together.

**Inbox — Which message am I reviewing?** One selectable row per person, one selected message workspace. Channel and purpose have full labels, not ambiguous numbered steps. Connection requests and after-acceptance messages are alternatives with conditions, never a mandatory sequence. Replies and follow-ups must not be mislabeled as first messages. Metadata and safety holds are adjacent to the message; longer evidence lives in a disclosure. On phones show a compact person selector above the message rather than a long directory that pushes the message below many screens.

**Work — What have we committed to?** One actual next item followed by a compact workstream index and its list. Use dates/owners as readable supporting information, not a second layer of navigation. Completed tasks and empty categories must be distinct.

**Pipeline / Reports / Money.** A shared heading, quiet context line and actual records. Opportunity stages use ruled columns and compact cards only where movement/status grouping benefits. Do not manufacture a chart when data is absent. Keep different currencies separate. Money actions name their actual effect: download, issue, record payment.

**Knowledge / Automation / Settings.** Knowledge emphasizes sources and dates. Automation shows stages and verified receipt state, not simulated live execution. Settings uses a local section index and one working section. Codex verification and native OAuth remain distinct even if visual treatment becomes simpler.

## Visual system

- Character: a contemporary working studio, precise and slightly expressive; not a green ledger or a generic SaaS template.
- Canvas `#f5f6f2`, white working surfaces, charcoal `#202522` navigation/ink, desaturated citron `#d4e775` for a small number of selected/primary surfaces. Citron uses dark text; body text does not use pale citron on white.
- Geist Sans for headings and working text; Geist Mono only for dates, counts and short indexes. No serif. Headings around 32–40px on desktop and 28px on phone; working copy 14–16px and message body 16px with a comfortable measure.
- Strong shape and spacing do the creative work: asymmetrical composition, a single cut-line focus surface, deliberate rules, consistent 8px rhythm. Do not repeat ornamental cut corners on every control.
- Named navigation is persistent on desktop. An active selection uses shape/weight as well as color. Keep the logo, current project and current section legible.
- No decorative photography, gradients, glass effects, chart wallpaper, giant greeting or default three-card feature rows. Motion is limited to short hover/press/focus changes and respects reduced motion; nothing reorders itself for effect.

## States and acceptance

- Loading preserves shell and working geometry. A failed lazy view retains navigation with a clear reload action. A server failure has an explicit retry; never automatically retry writes.
- Empty states say what is absent and offer a useful existing action. No-match filters offer reset. Unknown account/fact status never looks connected/verified.
- Keyboard order follows reading order, visible focus on light/dark/citron, labelled controls, dialog Escape and focus return. Phone primary controls target 44px and inputs remain readable at 16px.
- Verify 390px and 1440px layouts; no document-wide horizontal overflow. Tables may scroll within a named surface. The selected draft is reachable without scrolling past all contacts.
- Evaluate real tasks: find a contact, understand why a message exists, switch its purpose, inspect sources, open its review, create/edit a task, return with selection intact. No message is sent during testing.
- Run build/domain/runtime checks and browser tests, inspect actual screenshots, fix review findings, then deploy and verify the production build. Testing a loopback copy is reported separately from a signed-in production test.

## Skills and inspiration

Applied: Design Taste Frontend (visual direction), UX Flow (screen journeys/progressive disclosure), UX Audit (Nielsen heuristics/mobile), UI/UX Pro Max (touch/focus/contrast/recovery), Accessibility Audit (manual checks), and fresh Web Interface Guidelines. Pro Max's generated motion-heavy portfolio/Fredoka recommendation was rejected as inappropriate for this operational product; skill output is guidance, not a substitute for judgment.

Useful reference principles: [folk's person-centered context](https://www.folk.app/), [Linear's structured work surfaces](https://linear.app/features), and [Superhuman's focus on message review](https://superhuman.com/). These inform interaction priorities, not copied branding, unsupported capabilities or outcome claims.

Decision log: reject the traditional ledger; choose decision-first over dossier-first or time-first; preserve named navigation and existing drawers; use actual dated work with a visible reason; treat draft purposes conservatively; establish recovery states before release. Remaining uncertainty is owner preference after seeing the considered implementation, not an unresolved authorization to proceed.
