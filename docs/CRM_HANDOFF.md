# Founder CRM implementation handoff

## Goal

Keep Founder CRM's existing/original visual language: white navigation, cool-grey canvas, charcoal emphasis, coral accent, concise layouts, and the current data model. Do not replace the app with the earlier dark/lime mascot concept.

This handoff describes the changes submitted in pull request #1 to the upstream repository. Deployment remains a separate step.

## Database compatibility and deployment

- The current features use the existing six CRM tables and `crm_snapshot` / `crm_commit` functions; no additional table or data migration is required. Graphs derive from existing records, automation uses typed records, MCP tokens use server-private state, and project updates use the existing JSON project body.
- Project management reuses the existing version-checked update handler, preserving project settings validation and draft approval invalidation.
- The authoritative Supabase project is `lkjzebcnkhucuvzspbip` (Mumbai), as recorded in the upstream cutover documentation. Preserve its current data and Auth setup.
- After merging, deploy the changed frontend and API. If Vercel uses `CRM_EDGE_URL`, deploy the updated Supabase Edge Function as well: Vercel-only frontend deployment will not update the remote backend or MCP handlers. Keep the edge destination on the Mumbai project. If Vercel hosts the Node API directly, preserve its Mumbai Supabase server environment variables. Verify sign-in, project settings and authenticated MCP against the deployed version.

## Local development

- `scripts/dev.ts` fixes the local public origin to `http://127.0.0.1:3460`. Vite proxies `/api` to port 3461, so this explicit origin is required for the API's CSRF/origin validation to allow local sign-in. It only applies outside production.

## Change-log convention

Use this file as the single handoff and change-log document for this CRM. Add each material product, database, integration, deployment, or security change to the relevant section and update the validation result before handing work to another developer.

## Implemented product changes

### Dashboard

- The `Today` navigation label and breadcrumb are now **Dashboard**. The compatible route remains `?view=today`.
- The top bar is sticky.
- Dashboard greeting is live and uses the `Asia/Kolkata` time zone. It changes between Good morning, Good afternoon, Good evening, and Hello, shows a large running IST clock, and addresses the signed-in member by first name. The adjacent plus action opens a new task so the member can set a reminder with its owner and due date.
- Added a project-local transparent greeting mascot asset at `src/client/assets/dashboard/greeting-bunny.png`. It is positioned immediately before the entire three-line Dashboard greeting block (clock, greeting, and dashboard date), matching that block's height. Keep this one understated dashboard-only illustration; do not reintroduce the older lime/mascot redesign across the full product.
- On a new browser session, Dashboard shows the supplied oversized Lottie Hello over a lightly blurred Dashboard. A single renderer travels along a curved, shrinking path into the bunny’s speech bubble, then the exact same SVG container is moved into its permanent slot. It holds a visible frame with no replacement renderer, and a script Hello fallback prevents an empty bubble while loading. The source `src/client/assets/dashboard/dashboard-welcome.lottie.json` is lazy-loaded only for Dashboard; reduced-motion preferences skip the entrance.
- The Hello SVG uses tight artwork bounds and cloned animation data. The bubble contains only Hello; the member’s name appears in the main time-based greeting. The bubble sits to the bunny’s right with a tail pointing toward it, leaves its ears clear, and reserves space before the clock.
- Greeting heading and date align beneath Hello while the clock retains its position to the right. The personalised heading ends with an exclamation mark.
- The speech tail exits the bubble’s left edge toward the bunny’s face, rather than pointing downward at the heading.
- The desktop greeting bunny uses a 132 × 142px display box; mobile retains its compact size.
- The desktop bunny is offset 18px left to balance the divider spacing and clear the greeting heading; the clock and Hello bubble retain their positions.
- Once Hello docks, its completed Web Animations travel effect is cancelled before the canvas returns to normal inline layout; this prevents a retained transform from shrinking/moving the held SVG outside the bubble.
- The bubble stays hidden while the opening Hello is playing and travelling; it becomes visible only when that same SVG has landed.
- After landing, Hello stays still on frame 110. The opening animation still plays once per session; reduced-motion preferences skip it.
- Summary mascots are a kitten with contacts (People), panda with kanban board (Pipeline), dinosaur with calendar/check (Due today), and chick with reply envelope (Needs reply). Their transparent 192px WebP files total about 32 KB under `src/client/assets/dashboard/`.
- Dashboard header uses lightweight CSS copper curves, highlights, and dots over charcoal. Today’s focus opens selected work or the Work section. A compact summary row links to People, Pipeline, Work, and Inbox without removing the daybook workflow.
- All primary CRM views now use compact, data-backed metric rows. Each metric has its own compressed transparent WebP mascot in `src/client/assets/dashboard/`; avoid reusing a character for different metrics within the same row. The same semantic metric may share an asset only when it is genuinely the same concept across views.
- Search is a single fast project-wide combobox in the sticky top bar. It shows recent records and section shortcuts on focus, then scoped related record suggestions while typing. The old sidebar search entry was removed; list-local filters remain.
- The sidebar keeps the original navigation and project controls but uses the white, charcoal, coral, and peach treatment: a peeking project bunny, folder project control, pastel icon tiles, and a peach profile card. The project select and create-project action are unchanged.
- Desktop navigation can be collapsed from its arrow button into a persistent icon rail. It keeps every navigation destination, the project picker, create-project, profile, and sign-out controls available; labels return when expanded. The preference is stored in local browser storage.
- The sidebar includes an animated, Plotview-inspired Light/Dark switch. Light remains Founder’s default theme; Dusk keeps the charcoal/coral identity while updating canvas, cards, controls, text, menus, and form contrast. The choice is stored locally. Sign-out now lives in the profile menu beside the notification bell, rather than in the sidebar.
- Theme motion now follows Plotview's actual implementation: an 800ms circular reveal from the clicked icon using `cubic-bezier(.65,0,.25,1)` and View Transitions, with immediate updates for reduced motion. Dark-mode overrides cover search suggestions, placeholders, headings, menus, table controls, and settings text. Project overlays render above page banners; the compact selector is fully visible.
- Work's next-action panel, Automation's Local Codex runtime banner, and Dashboard's selected-record panel now use matching dark surfaces with readable heading and supporting text colours.
- The expanded dark project picker uses a charcoal card, a transparent label/select, a muted coral add button, and consistent icon spacing; light form styles no longer bleed into its controls.
- Manage project includes a project selector. Changing it updates the editable details and clears deletion confirmation. Save/delete requests target that selected project; deleting another project preserves the currently open workspace.
- The compact sidebar project folder now opens an unclipped styled project menu with project selection, Add project, and Manage project. Manage project can rename/edit the description or delete a project. Deletion is owner/admin-only, blocked for the final remaining project, and requires typing the exact current project name; it removes project-scoped records, activity, provider connections/settings, shares, and MCP tokens before switching to another available project.
- Native scrollbars use the coral/peach treatment. `CuteScrollbars` overlays a non-interactive bunny head at the upper end of each visible scroll thumb; the native rail begins below the face so no rail appears above it.
- A notification bell shows CRM-derived reminders for:
  - overdue work;
  - drafts awaiting review; and
  - unassigned open opportunities.
- Clicking an alert opens the relevant area of the CRM.
- The notification centre is in-app only. It does not send browser, email, or mobile push notifications.

### Pipeline and Work graphs

- Pipeline and Work both have **Board**, **List**, and **Graph** views.
- Graph view has two switchable modes:
  - **Distribution**: current counts by stage/status and by owner;
  - **Trend**: a seven-day, two-line graph.
- Pipeline trend compares new opportunities with opportunity updates.
- Work trend compares completed tasks with new tasks. A day with no completed work is plotted as zero, so the line visibly drops.
- Keep drag-and-drop pipeline stage movement and its accessible/manual alternative intact.

### Insights: Analytics and Reports merged

- Sidebar now has one **Insights** item instead of separate Analytics and Reports items.
- Insights has internal **Analytics** and **Reports** tabs, preserving both feature sets.
- Existing deep links remain compatible:
  - `?view=analytics` opens Insights → Analytics;
  - `?view=reports` opens Insights → Reports.
- Analytics provides CRM-derived counts, recent activity, pipeline distribution, and integration connection state.
- It lists these possible marketing data sources:
  - Google Analytics 4;
  - Google Tag Manager (configuration only, not analytics reporting);
  - Microsoft Clarity;
  - Bing Webmaster Tools; and
  - Vercel Analytics.
- These integration cards do **not** yet fetch third-party data. Do not claim that they are connected until OAuth/API sync and a verified receipt are implemented.

### Automation

- Automation is now organised around safe operational follow-through rather than claiming Codex executes critical workflows.
- Added reviewable rule blueprints:
  - new lead follow-up;
  - reply SLA reminder;
  - pipeline handoff; and
  - meeting brief.
- Selecting a blueprint creates a persisted Automation request in `needs_review` status. It does not activate a background rule or send an external message.
- Automation has summary counts and separate **Rule blueprints** / **Requests & runs** views.
- Preserve human approval for messages, invitations, publication, payments, financial outcomes, and irreversible changes.

## Remote MCP endpoint

### What is included

- Added a remote Streamable HTTP MCP endpoint at `/mcp`.
- Production URL after deployment: `https://founder-crm-rouge.vercel.app/mcp`.
- Settings displays this production endpoint even when the UI runs locally; localhost is not presented as the remote connection URL.
- Vercel is configured to route `/mcp` to the serverless API function.
- Endpoint authenticates only with an existing **project-scoped MCP token** in the `Authorization: Bearer <token>` header.
- It is scoped to the token's one project and exposes only:
  - `crm_overview`;
  - `record_create`;
  - `task_create`;
  - `draft_create`;
  - `evidence_create`;
  - `deal_create`;
  - `record_update`; and
  - `changeset_preview`.
- Safety boundaries remain enforced: it cannot approve, send, invite, share, issue invoices, record payments, spend money, or manage access.

### Important authentication note

The endpoint's existing project-token authentication is appropriate for an online Codex setup or an OpenAI API/Responses integration where the Bearer token is sent server-to-server.

For a direct private **ChatGPT custom MCP app**, add an OAuth 2.1 authorization server and resource-server metadata. Do not put a project token in a URL, browser bundle, ChatGPT message, or log. Keep the existing project token flow for Codex/API use until OAuth is available.

### Database and environment

No new database migration is required for the current changes. Remote MCP uses the CRM's existing private project-token store.

Vercel needs these production environment variables:

```text
APP_ORIGIN=https://founder-crm-rouge.vercel.app
SUPABASE_URL=<existing value>
SUPABASE_PUBLISHABLE_KEY=<existing value>
SUPABASE_SECRET_KEY=<existing value>
BOOTSTRAP_OWNER_EMAIL=<existing owner email>
```

Never paste or commit real credentials in source code, documentation, tickets, prompts, or client-side code.

## Files changed

```text
src/client/App.tsx          Navigation, Dashboard label, notification centre
src/client/views.tsx        Graphs, Insights, Analytics, Automation, MCP settings UI
src/client/models.ts        Automation wording
src/client/styles.css       UI styling for the above
src/server/mcp.ts           Remote, scoped MCP tool server
src/server/app.ts           /mcp HTTP transport and authentication guard
vercel.json                 /mcp serverless routing
```

## Validation completed locally

```text
npm run build
```

The TypeScript check and Vite production build passed. `git diff --check` also passed.

Targeted project-search verification also passed:

```text
npx tsx --test tests/record-search.test.ts
```

All four tests pass, covering project scoping, related-record matching, typo tolerance, and recent-result limits.

## Prompt for the deployment engineer / Codex

```text
Work in the Founder CRM repository and deploy the current local changes to the existing Vercel project serving https://founder-crm-rouge.vercel.app.

Do not reset, replace, or redesign the current CRM UI. Preserve the original white/grey/charcoal/coral visual system and all existing data and routes.

Implement and deploy the local handoff described in docs/CRM_HANDOFF.md. The scope includes:

1. Dashboard rename and sticky navigation
   - Keep the underlying ?view=today route compatible, but label it Dashboard.
   - Keep the in-app notification bell and CRM-derived alerts.

2. Pipeline and Work graphs
   - Preserve Board and List.
   - Add Graph with Distribution and Trend modes.
   - Keep existing drag-and-drop pipeline behaviour and accessibility fallback.

3. Insights
   - Merge Analytics and Reports into one Insights sidebar entry with internal tabs.
   - Preserve ?view=analytics and ?view=reports compatibility.
   - Do not claim external analytics are connected until verified OAuth/API sync is built.

4. Automation
   - Keep the reviewable rule blueprints and requests/runs view.
   - Never activate background automation or external sending just because a blueprint is created.

5. Online MCP
   - Deploy the Streamable HTTP endpoint at https://founder-crm-rouge.vercel.app/mcp.
   - Keep it project-token authenticated and scope every request to that token's project.
   - Verify it exposes only safe tools and denies approvals, sends, invitations, sharing, financial changes, and access management.
   - Verify no token is exposed to the browser, URL, source control, logs, or error output.

Configure/check Vercel environment variables:
APP_ORIGIN=https://founder-crm-rouge.vercel.app
SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY
BOOTSTRAP_OWNER_EMAIL

Run npm run build before deployment. After deployment, verify:
- GET https://founder-crm-rouge.vercel.app/ loads;
- unauthenticated POST https://founder-crm-rouge.vercel.app/mcp is rejected with 401;
- a newly created, short-lived project MCP token can initialize the endpoint and list tools;
- the token cannot access another project;
- the existing CRM sign-in and Supabase data still work.

For direct ChatGPT custom-app use, add a standards-compliant OAuth 2.1 authorization server later. Do not weaken authentication or make the CRM MCP endpoint anonymous to make ChatGPT connect.
```
