# Founder CRM Daybook redesign

The supplied Daybook reference is the visual and interaction baseline for the
CRM. Use a white navigation rail, cool light-grey canvas, charcoal masthead,
terracotta highlights, thin borders, restrained rounding and generous spacing.
The masthead has a single purpose: orient the founder. Large dark panels are
reserved for headers; useful context sits in a white surface beneath a compact
dark title bar. Avoid dashboards filled with counters or repeated controls.

## Navigation and shared behavior

- The rail shows the project name and the primary destinations Today, People,
  Pipeline, Inbox and Work. Operations contains secondary screens. Preserve
  search, project switching, project creation and sign-out with accessible
  names; the active destination has a charcoal background and warm marker.
- Use the same typography, rules, borders, labels and selection treatment on
  every page. Page-specific controls stay near their records. Selections must be
  clear without relying on color alone. Mobile navigation remains a dialog.
- Empty, loading and error states must describe actual conditions. All actions
  must be keyboard accessible, with a select alternative to dragging.

## Today

Match the reference: a wide charcoal date masthead, founder filter strip, two
stacked timeline panels to the left and a selected-record context panel to the
right. Show unfinished tasks, promises and onboarding work dated at or before
the end of today, and meetings starting by the end of today; tomorrow contains
only records dated tomorrow. Overdue work is labelled overdue. No date means
unscheduled and stays in Work. Items after tomorrow stay in Work. Drafts and
conversations appear only when they have a due date; their full queues remain
in Inbox. These rules avoid presenting all undated items as due today.

Select a timeline item to read its actual status, owner, linked person and next
step in context; the button opens the real record. Assignments and statuses are
editable without a drawer where allowed. Founder filters cover all members and
the stored Both assignment. Counts reflect the displayed items. When nothing is
due, show a quiet empty state and a link to Work.

## People

Use the shared masthead and a clearly labelled directory with search, filters,
evidence, status and owner. Keep inline assignment/status and duplicate review.
A row leads to the full relationship record; do not invent research or contact
details. Compact tables are appropriate for scanning many people.

## Pipeline

Show the actual stages as a horizontal board with compact opportunity cards,
subtle selected treatment and a white context panel. Keep the list alternative,
inline owner/stage selectors, drag/drop and an accessible keyboard alternative.
Potential values remain separated by currency and are not called revenue.

## Inbox

Use a person list and selected-message workspace with the same surfaces and
selection cues. Show purpose, channel, status and source context. Keep approval
and individual send distinct; a visual state must never imply a message was
sent. Preserve honest provider connection states.

## Work

Make the task Kanban and list easy to scan, with clear status columns, owner and
due date, inline changes and drag/drop. Work holds unscheduled and later items.
Keep workstream navigation, playbooks and the record drawer discoverable.

## Reports, Money, Knowledge, Automation and Settings

Use the common rail, typographic hierarchy, quiet surfaces and controls while
preserving the task-specific information: actual metrics with unknowns,
currency-separated finance, sourced research, truthful automation receipts,
and explicit connection/member settings. Avoid decorative metrics and never
make a provider appear connected through styling.

## Verification

Check desktop and narrow layouts, founder filters, overdue/today/tomorrow and
unscheduled boundaries, selection context, keyboard controls, pipeline movement,
and human message-review boundaries. Check real data through a safe sandbox;
do not perform outbound actions as part of a visual test.
