# Founder CRM design

## Direction: quiet precision
A calm, crafted workspace for founders who need to move conversations forward. The visual anchor is a dark forest navigation rail, warm near-white working surface, fine grid rules, and an understated green active state. The purpose is operational clarity, not a decorative metrics dashboard.

Design evaluation: impact 4, context fit 5, implementation feasibility 4, performance 4, consistency risk 3: DFII 14. Taste settings are deliberately adapted to the user's usability request: variance 3, motion 2, density 6. No perpetual animation, magnetic controls, huge rounded cards, gradient headings, fake avatars, fabricated revenue, or example contacts mixed into live data.

## Navigation and hierarchy
Five primary sections: Today, People, Pipeline, Inbox, Work. More contains Reports, Money, Knowledge, Automation and Settings. A project selector remains visible; account and project context appears beside outbound actions. One contact panel reuses overview, evidence, messages/drafts, linked work and history. Contextual tabs progressively reveal capability rather than presenting every module in one screen.

Today prioritizes replies and commitments, then overdue work and meetings. People defaults to a useful table with owner, fit, evidence age, stage and next action; saved views expose research/draft backlog. Pipeline separates prospects from genuine opportunities. Inbox distinguishes waiting-on-us, waiting-on-them, review and future. Work groups tasks, marketing, meetings, onboarding and experiments. Money separates currencies and does not present draft invoices as received revenue.

## System
- Geist for UI and Geist Mono/tabular numerals for figures. Use a deliberate compact heading scale, readable body text and consistent labels.
- Base surfaces: warm off-white, forest/graphite text, muted neutral rules. One accent for action; semantic status labels carry meaning in text as well as colour.
- Spacing uses a 4px rhythm. Most content sits in tables, split panels and lists rather than a wall of cards.
- Use Phosphor icons consistently. Icon-only buttons have accessible names. Native form controls and Base UI primitives provide reliable keyboard/focus behaviour.
- No unsolicited animation. Respect reduced motion. Avoid layout shifts, fixed-height overflow, and hover-only actions.

## Interaction requirements
Every visible action must work or explicitly explain the missing connection. Forms have labels, validation next to inputs, submission progress, success feedback and safe stale-edit handling. Confirm irreversible actions with an accessible dialog. Preserve unsaved work or warn before discard. Loading states match structure; errors are actionable; empty states offer a clear first step. Global search and bookmarked views should preserve project context.

Contact forms capture real evidence separately from suggested personalization. Draft panels show source context and exact approval status. Copy, approve, open conversation, send and confirm manually sent are visibly different actions. Never label a copied draft as sent. External connection readiness is explicit; unknown/untested connections are never marked live.

Desktop: a stable rail, generous working canvas, optional detail panel. Mobile: compact navigation, stacked forms and scrollable tables; review/approve/update tasks remain practical. Minimum touch targets, visible focus, sufficient contrast, screen-reader labels and no page-wide horizontal overflow.

## Design verification
Verify local setup/login, empty workspace, creating a project/contact, evidence and drafts, pipeline, a reply/call, tasks/onboarding, invoice PDF and payment record. Check keyboard dialog use, narrow/mobile widths, error states, missing-provider states, persistent reload and access denial. Synthetic QA records are labelled and isolated from actual Airtable leads.
