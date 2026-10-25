# Founder CRM: three Today-page concepts

25 October 2026. These are standalone design prototypes for an owner decision before any live redesign. The current application is untouched by these files.

## What is being compared

The previous pine/ivory ledger and the subsequent charcoal/citron sidebar direction were rejected. A new accent alone would repeat the same mistake. These concepts change the first object you choose, how the page is composed, and where relationship/message context lives.

| | A · Focus Desk | B · Daybook | C · Relationship Room |
| --- | --- | --- | --- |
| The question | What should I open? | What have we committed to, and when? | Who needs attention? |
| First object | Work item | Dated commitment | Person or founder team |
| Navigation | Full-width top navigation | Light, narrow named index; top row on phones | Compact top navigation with project context |
| Work organization | Selectable queue, filtered by work kind | Today/tomorrow timeline, filtered by owner | Relationship roster, searchable by name/company/task |
| Context | Large adjacent review surface | Compact notebook in the margin | Shared room: working note plus relationship context |
| Geometry | Bounded asymmetric two-pane desk | Dark day-header band, grouped white timeline, geometric context panel | Horizontal roster over a broad person workspace |
| Palette | Cool mist, white, muted cobalt | High-contrast ink, clean white, restrained rust | Neutral blush, white, muted burgundy |
| Tradeoff | Efficient review; less whole-day visibility | Makes promises visible; long days need grouping | Strong human context; internal work needs an explicit team identity |

No preferred direction is preselected. Choose the working structure first; a specific detail from another concept can be borrowed afterward.

B deliberately supplies the most expressive visual option: a dark horizontal day header, a large date, precise rust time markers, sculpted white day groups, and a geometric context panel. This avoids repeating the rejected warm-paper ledger. Its narrow navigation stays light, and the accent marks work rather than decoration. A and C remain calmer alternatives.

## Flows before screens

```text
A: Today → choose queue → choose work → inspect context/evidence → preview review → return
B: Today → choose owner → choose dated commitment → read notebook → preview brief → return
C: Today → choose relationship → read open loop and notes → preview review → return
```

Each option is a single Today page plus a reversible local preview dialog. The comparison page is an index, not an application screen. Other product destinations are visible for evaluating navigation; their buttons explain that they are outside the prototype. Project controls explain the illustrative project scope. Dialogs have a close control and Escape support through native HTML dialog behavior.

## Shared illustrative content

All options contain exactly the same four sample tasks and relationships:

- Mira Sethi / Luma Learning: review a pilot introduction, owned by Anshu, due today.
- Inez Rao / Common Ground: prepare for a 16:30 discovery call, owned by Both, today.
- Founder team / DealDock: confirm the pilot checklist, owned by Anshu, due today.
- Kabir Mehta / Northline Studio: keep a follow-up promise, owned by Nahush, tomorrow.

Names, organizations, messages, notes, dates, and tasks are illustrative. They are not production records or claims. Unknown budget, timing, and fit stay unknown. No customer outcome, revenue, or AI priority is invented. Work counts describe this fixed sample, and all options keep human review, approval, and individual send distinct.

## Implementation boundaries

- Only `design/mockups/` is used. No application imports, production styles, routes, data, credentials, or APIs.
- Static HTML/CSS/JavaScript and local Geist font files. No CDN, external images, analytics, libraries, or network API calls.
- Local interactions select work, filter, search, expand sample evidence, and open a preview dialog. Selection/filters use local URL query state. No local storage, sending, approval, saved mutation, or account connection.
- Three local font weights and their license are copied from the already installed `@fontsource/geist` package. No remote font request.
- There is no asynchronous data path, so no fake loading or server-error state. Filters have a resettable empty state. If this direction is later implemented, real loading, permission, empty, conflict, and failure states must follow application contracts.

## Responsive and interaction intent

Desktop target: 1440px. Phone target: 390px. Navigation becomes a named top row on phones. A stacks queue then selected context; selecting work scrolls to the context. B stacks agenda then notebook; selecting a commitment moves to the notebook. C keeps a two-column person roster, then places the open loop ahead of the context notes. No meaning relies on hover or color alone.

Native buttons, labelled inputs, skip links, visible keyboard focus, minimum 44px primary phone controls, and native modal dialogs support keyboard/touch use. Reduced motion disables transitions. Long text wraps; data surfaces avoid page-wide horizontal scrolling.

Browser checks at 1440px and 390px covered the three rendered layouts, A's draft dialog/Escape and phone meeting selection, B's owner filter with matching selected context, and C's person selection, no-match state and reset. All three phone pages measured within the viewport. A stale filtered-context bug was fixed and retested before review. These are static prototypes with representative interaction checks, not full CRM functionality or an accessibility certification. Private screenshots are under .local/verification/design-option-*.png. No production data, Auth account, approval, send or saved mutation was used.

## Design guidance applied

Read Design Taste Frontend, UX Flow, UI/UX Pro Max, and the freshly fetched [Web Interface Guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md). Their useful typography, flow, contrast, focus, progressive-disclosure, and responsive guidance is applied. The operational brief takes precedence over suggestions for perpetual animation, simulated live activity, decorative cards, multi-accent palettes, or serif typography.

UI/UX Pro Max design-system search ran under Python 3.14 with UTF-8 output. Its broad marketing-style/serif recommendation was not suitable for this working CRM; it is guidance, not a design decision.

## Review checklist

1. Open each full-size page at 1440px and 390px.
2. Compare the default state, not only the colors: queue versus time versus person.
3. Select all four sample records and check that context changes with the selected record.
4. Exercise owner/queue filters and search, including no matches and reset.
5. Open the preview, close with its button and Escape, and check focus return.
6. Verify no page-wide overflow, no external resource requests, and no production data use.
7. Choose the structure before authorizing any live implementation.
