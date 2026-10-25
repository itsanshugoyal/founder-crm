# CRM schedule evaluation — 25 October 2026

## Current manual stage validation

After the schedule configuration was made team-editable in
[`SCHEDULES.md`](SCHEDULES.md), all four saved Codex schedules were checked as
ACTIVE, pointed to the current CRM workflow, and confirmed to read that file.
Their cadences remain unchanged. The research job had retained an old target
chat; this was corrected as part of the check. A Markdown change now governs
the next run's allowed work and limits, while an authorised scheduler update is
still required for a time, activation, or target-chat change.

The current manual pass ran the stages in their dependency order and stored
both Supabase and ignored local receipts. It was a real scoped CRM operation,
not a claim that a future timer has fired:

| Stage | Result | Evidence and limits |
| --- | --- | --- |
| Draft cleanup before run | 31 unapproved historic drafts archived, not deleted | Atomic preview and readback both covered 31 records; approved/sent/sending work was excluded; zero sends. |
| Research | 2 primary-source checks; 0 draft-eligible | Weight Loss With Tarn is held because the source shows a multi-person coaching context without verified Instagram buyer flow. YogaWithSahithi is held because the source describes a doctor-led clinic context rather than the solo owned-offer hypothesis. |
| Drafts | 3 new source-led Instagram fit questions | The unconsumed three-contact research receipt produced one review-only draft each for `designwithvibhu`, `dhairyadecodes`, and `coachamanshukla`. No approval or send occurred. A repeat gate then returned `alreadyProcessed: true`. |
| Replies | 0 matches; 0 response drafts | The approved Gmail identity was checked; a bounded DealDock Gmail search and upcoming-calendar search returned zero. Instagram/LinkedIn and manual-send totals remain unknown. |
| Weekly learning | 1 human-review experiment | Manually review up to the three new fit questions, record only verified sends and actual enquiry-path replies, and keep ads/pricing/free-term changes closed pending evidence. |

The new manual receipts are `c95548f3…` (research), `48dc010f…` (drafts),
`54499c8b…` (replies), and `e2752031…` (weekly). They record no sends,
approvals, invitations, publishing, payments, or provider authorization.
The current draft gate is correctly blocked by the later research receipt,
which contains no draft-eligible packets; it does not recreate copy just to
fill a queue.

This is a read-only evaluation of the saved Codex schedules and the 25 October manual rehearsals, recorded at about 07:48 IST. The first timed research slot is 09:00 IST today. A saved `ACTIVE` schedule and a manual rehearsal do not establish that a timed wake-up has run. The local machine is set to India Standard Time, all four schedule files are present, and `.local/operations/STOP` was absent during this check.

| Stage | Saved cadence | Rehearsal evidence | What remains unproven |
| --- | --- | --- | --- |
| Research and qualification | Daily 09:00 | Supabase research receipt `80a86d9a…`: three existing contacts checked, three fit-question packets, zero fully qualified, no sends. Four changed records appear in the local structural readback. | First timed execution, continued backlog progression, and full Instagram/team/DM-fit verification. |
| Personal outreach drafts | Daily 10:30 | Draft receipt `601ffd0e…` consumes that research receipt: three concise fit questions, zero approvals and sends. The copy batch also edited 30 historical variants; these are not 30 new qualified leads. | First timed execution, behavior on a new packet, and whether a human finds any draft worth sending. |
| Reply and follow-up review | Daily 12:00 and 17:00 | Manual receipt found zero DealDock-keyword Gmail matches and zero bounded calendar matches. It proposed zero responses and sends. | First timed execution; replies without the keyword, Instagram/LinkedIn replies, and actual manual-send counts remain unknown. A draft timestamp is not proof that a follow-up is due. |
| Weekly pilot and marketing learning | Friday 16:00 | Manual receipt kept held conversations, active pilots, paid partners and revenue unknown, and proposed one enquiry-journey learning experiment. | A Friday timed run and any real pilot outcome. |

The stage receipts are marked `dryRun: true`. The older 24 October daily-operations receipt names Airtable and predates the Supabase cutover; it is not evidence for the current four-stage scheduled pipeline. The local batch files report structural readback for 4 research, 33 copy and 9 final-rehearsal records. The stage receipts themselves do not yet consistently include the documented start/end times and exact changed-record IDs, so those details currently require the separate batch files.

## Output quality and source limits

All three current questions refer to an actual offer and ask about the buyer enquiry path without asserting DM volume, missed revenue or a staffing level. They remain fit questions for human review, not qualified or send-ready outreach. The research packet explicitly leaves Instagram profile/follower count, team size, actual DM usage and unmet need unknown for all three contacts. Legacy fit scores were kept separate from present qualification; the current fully qualified count is zero.

- The Greenroom question refers to a ManyChat lesson and paid membership. A [search-indexed copy of the official Greenroom page](https://www.thegreenroom.ai/) showed both during this audit, but a direct page fetch exceeded the browsing tool's size limit. That is corroboration of the page content, not a fresh direct read of the live page.
- The [official Meera consultation page](https://meeraremani.com/leadership-consultation-hour) was directly readable during this audit and confirms a paid consultation and booking process. It does not establish that buyer questions arrive via Instagram DMs or that this contact fits the solo/one-VA campaign.
- The [Vatsa application page](https://applynow.fitlifewithvatsa.com/) returned HTTP 403 to an independent fetch and was inaccessible through the browsing tool. Its application-flow observation is supported by the earlier saved research receipt, not independently reconfirmed here.

The three questions are distinct, but the surrounding historical LinkedIn connection and follow-up variants for the checked contacts are more generic. Some carry `needsFreshEvidence: false` from the offer-page check even though the current Instagram path and staffing remain unknown. Their `Needs review` status, channel-specific usage notes and individual human send decision must remain decisive. Historical drafts held for fresh evidence should not be counted as ready output.

## Repeat and dependency check

Before the current correction, a live read-only run of `node --import tsx scripts/stage-packet.ts` returned `blocked: false` and the same three eligible contact IDs from research receipt `80a86d9a…`, even though draft receipt `601ffd0e…` had already consumed it. The seven-day freshness test alone therefore allowed tomorrow's run to offer the same work again. The packet also omitted `contactVersion`, making the previous optional version comparison ineffective.

The current code now checks for a completed draft receipt that names the research receipt and returns `alreadyProcessed: true` with zero packets. It also requires a matching `contactVersion`, owned-offer segment and an active contact. The custom research skill directs the run to skip contacts checked within seven days unless a real new interaction or upcoming meeting warrants rechecking. The draft skill calls an already-processed packet a successful no-op and directs stable per-contact/channel/purpose upserts, preserving existing reviewed or sent messages. These are code/instruction checks; the first timed run and live repeat readback must still validate the behavior. The main task will record the result of its post-change live read-only helper run separately.

Suppression, brand-deal exclusion, scope and seven-day expiry had focused tests before this audit. The newly added focused assertions cover consumed receipts and stale contact versions. A scheduled run must also recheck actual replies and opt-outs before proposing follow-ups. With actual send counts unknown, the shared Instagram/LinkedIn capacity is unknown: queue any overflow and never turn draft or copy counts into send counts. The rehearsal did not exercise a real overflow case.

## First timed-run success criteria

Post-fix read-only repeat check: the real helper returned `blocked: true`, `alreadyProcessed: true`, the existing research/draft receipt IDs and an empty packets array. No new draft was created. Focused consumed-receipt and stale-version assertions passed. The human subsequently requested manually triggering the saved stages; their new receipts and output evaluation are recorded separately from these earlier rehearsals and future timer evidence.

The 09:00 research run should leave a scoped receipt with the checked contacts, source observations and times, unknowns, post-readback contact versions, changed IDs and the next backlog position. The 10:30 drafting run should either consume a genuinely new eligible packet once, or record a quiet successful no-op with zero new drafts when the packet was already used. A rerun must retain the existing 31 review drafts rather than create another three from the same receipt. The reply runs should distinguish zero matches from unavailable channels and unknown sends; an actual reply must stop no-reply follow-ups. Friday's review should keep unverified outcome metrics unknown and propose only a reviewable experiment. Each stage should save a start/end receipt, read back exact changes, and make zero sends, approvals, invitations, publications or spend.

## Observed scheduled reply slot

The 25 October 12:00 IST reply-review heartbeat ran and structurally verified receipt `1c675617-5895-4042-ad6f-94094a6d29e8` plus the two existing Codex connection-proof records. The approved Gmail/Calendar identity was checked. A bounded DealDock-keyword Gmail search and 25 October–8 November Calendar search each returned zero matches. No replies, follow-ups, approvals or sends were invented. No known-contact emails were available for a second matching strategy; Instagram/LinkedIn and actual manual-send counts remained unavailable/unknown. CRM-native OAuth was not claimed. This establishes this one slot, not all stages or full inbox coverage. Later manual research records require their own packet/output evaluation; they are not silently counted as timer results.
