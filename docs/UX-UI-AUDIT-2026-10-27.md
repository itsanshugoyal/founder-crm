# UX and UI audit — 27 October 2026

## Aim

Make Founder CRM easier for two founders to operate during a working day. The
interface should make the next decision obvious without hiding the source
record, creating fake activity, or weakening the human-review boundary for
outreach.

## Implemented in this pass

| Surface                              | Friction observed                                                                                                | Change                                                                                                                                                           | Why it is safer/faster                                                                      |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Today                                | A mixed review table forced people to open drawers to understand priority.                                       | Replaced the table with a date-aware Daybook: owner chips, selected-record state, Today/Later grouping, contextual side panel, and inline owner/status controls. | Selection reveals context first; opening the full record remains available for deeper work. |
| Pipeline                             | Stage movement and ownership required separate controls, and the selected opportunity had no persistent context. | Added a drag-and-drop board with visible drop state, inline stage/assignee controls as a keyboard fallback, selection, and a shared contextual panel.            | Moving is direct, while keyboard and touch fallback remain explicit native controls.        |
| People, Money, Knowledge, Automation | Detail edits previously began with a drawer for routine ownership/status changes.                                | Retained the earlier inline status and assignee controls in their standard record views.                                                                         | Routine triage stays in the list; complex fields stay in the full record.                   |
| Work                                 | A task board was already the best interaction for status changes.                                                | Kept Kanban as the default and its native status selector fallback.                                                                                              | Avoids duplicating controls just to make every screen look alike.                           |
| Inbox                                | Messages require a reviewable history, not arbitrary card movement.                                              | Preserved the Inbox's person/message workspace and separate human approval/send controls.                                                                        | A drag action must never imply or trigger a message send.                                   |

## Shared visual redesign

The supplied Daybook reference is now the base for the whole CRM rather than a
single Today mockup. The adapted system uses a light project rail, a charcoal
selected destination, warm coral action/context accents, a quiet grey canvas,
and a dark contextual header for each principal workspace. It is deliberately
an operational adaptation rather than a literal copy: the rail retains project
switching and keyboard search, headers keep real actions, and dense record
tables remain readable when they are the fastest way to work.

People, Pipeline, Work, Money, Knowledge, Automation, Reports, and Settings
now inherit the same header, navigation, surfaces, and controls. Individual
screen-specific information—finance, provider connection state, reviewed
drafts, and task status—still uses real stored data and remains visually
distinct from the decorative structure.

## Applied interaction standards

- Every drag action has a native select fallback. Dragging never triggers a
  message, approval, external event, payment, or invitation.
- Assignee and status updates are immediate but remain ordinary audited CRM
  record updates. The `Both` option represents the two named founders only.
- Selected cards are distinguishable without relying on color alone; all
  interactive controls retain labels and focus visibility.
- The Daybook uses only current stored records and dates. It does not invent
  priority, meetings, revenue, or connection status.
- Narrow layouts collapse the contextual rail below the working list/board;
  no action is hidden behind hover alone.

## Deliberately not changed

- Outreach approval and individual sending remain separate, review-only
  controls.
- Inbox provider setup still displays honest connected/not-connected state; it
  is not made to look connected from a Codex connector check.
- Finance totals remain currency-separated potential/observed amounts. No
  conversion or revenue inference was added.
- Reports remain a reporting surface rather than another operational board.

## Next evidence to collect

1. Use Today and Pipeline with both founders for one working day.
2. Note whether the owner chips match the way work is actually divided and
   whether “Both” is used often enough to merit a saved view.
3. Test drag/drop and the select fallback on an actual laptop and phone; the
   browser verification pass will record any device-specific adjustment.
4. Keep additions evidence-led: add a new interaction only when it removes a
   repeated decision or navigation step.
