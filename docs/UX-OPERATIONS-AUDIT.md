# Operations UX audit — 27 October 2026

## What made the workspace slow to operate

1. Status and assignment were generally read-only in the main tables. A routine
   change meant opening a full edit dialog, finding two fields, saving, and
   returning to the list.
2. Work opened as a category index and then a table. The next action was not
   visible as a flow of work, which made the list feel like record storage
   rather than an operating surface.
3. Existing tasks use historical status variants (`Todo`, `In-Progress`, and
   `Blocked`) alongside current labels. A board that assumes only new labels
   would silently hide useful work.
4. Drag-only controls would exclude keyboard and touch users.

## Implemented operating improvements

- **Direct changes in lists:** Every regular record list now contains compact
  status and assignee controls. They save the individual record immediately
  and retain the existing stale-version and server authorization checks.
- **Kanban-first Work:** Tasks now open in a board by default with To do, In
  progress, Waiting, Blocked, and Done lanes. The list remains one click away.
- **Safe movement:** Cards can be dragged between lanes, but each card also
  has a labelled native status control. This is the keyboard-safe alternative
  and works when drag/drop is unavailable.
- **Assignment without a drawer:** A compact assignee control supports either
  founder, both founders, or unassigned. Moving away from Both clears the
  explicit joint assignment rather than displaying a misleading owner.
- **Legacy-safe status matching:** Status comparisons ignore spacing,
  underscores, and hyphens. Existing `Todo` and `In-Progress` records remain
  visible in their expected lanes without rewriting historical records.
- **Password recovery path:** Sign-in now offers a deliberate password-reset
  request after an email is supplied. A valid Supabase recovery redirect opens
  a focused confirmation form requiring a 14-character password; it cannot
  change memberships or access roles.

## Retained boundaries

- No message, invitation, approval, event, advertisement, payment, or provider
  action is triggered by board movement or inline editing.
- The server remains the source of truth. Browser controls do not claim a save
  until the API succeeds.
- No animation communicates status; drag is cosmetic convenience, not the only
  way to perform an action.

## Verification performed

- Production TypeScript and Vite build passed.
- Full low-memory automated suite passed: 64 assertions across 41 top-level
  checks, including project boundaries, access, stale edits, manual-send
  safeguards, and the Vercel adapter.
- The compiled Vercel Node adapter check passed.
- Isolated QA server started with a non-production workspace copy.

## Remaining validation limitation

The locally installed Playwright package has no downloaded browser binary. A
headless launch through the available Chrome channel did not complete, and a
subsequent live browser session received user input, so no automated visual
pass is claimed. Complete a two-minute manual check after the next deployment:

1. Open Work and move one non-sensitive task through the status menu, then
   verify the card moves and persists after refresh.
2. Assign that same task to each founder and Both, verifying the owner label.
3. Switch to list view and update status/assignee there.
4. At 390px width, ensure the board scrolls horizontally inside its surface
   and the document itself does not overflow.
5. Use Tab/Enter to change a card's status without dragging.
