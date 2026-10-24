export interface Playbook {
  id: string;
  title: string;
  description: string;
  steps: string[];
}
export const PLAYBOOKS: Playbook[] = [
  {
    id: "discovery",
    title: "Discovery interview",
    description: "Understand the real workflow before pitching.",
    steps: [
      "Confirm their owned offer, buyer journey, team, and current inbox tools.",
      "Ask for a recent buyer enquiry they struggled to handle; use a redacted example.",
      "Measure enquiry volume and response delays from their records, not follower count.",
      "Ask how they identify high-value enquiries and who follows up.",
      "Understand the consequence of missed replies and what they have already tried.",
      "Check willingness to review every suggested reply.",
      "Agree a specific next step; record objections and exact quotes with permission.",
    ],
  },
  {
    id: "pilot",
    title: "14-day design-partner pilot",
    description: "Agree an observable result and review it together.",
    steps: [
      "Record pilot scope, owner, start/end dates, and explicit success criteria.",
      "Agree approved data access and redaction; never request a password in chat.",
      "Capture the baseline: response time, unresolved buyer enquiries, and follow-up process.",
      "Complete a first session using actual eligible enquiries and human-approved replies.",
      "Check activation within the first three days and unblock setup issues.",
      "Review progress at day seven; record evidence and requested improvements.",
      "At day fourteen compare results against the baseline and discuss a priced continuation.",
      "Record the payment decision; request permission separately before publishing any outcome.",
    ],
  },
  {
    id: "launch",
    title: "Launch readiness",
    description: "From a working product to ten learning-focused partners.",
    steps: [
      "Choose and buy a domain manually within an approved budget; verify HTTPS.",
      "Verify application/booking flow, support contact, privacy information, and pilot terms.",
      "Confirm honest positioning and remove unsupported customer/revenue claims.",
      "Connect analytics and campaign attribution with explicit consent settings.",
      "Verify Search Console ownership, sitemap, canonical URLs, and indexing status.",
      "Prepare useful founder content and a focused owned-offer outreach batch.",
      "Activate the first three design partners and record observable outcomes.",
      "Validate two paid continuations before considering paid acquisition.",
      "Collect one credible consented outcome story.",
      "Review the first ten partners by activation, learning, and paid conversion, not lead volume.",
    ],
  },
  {
    id: "onboarding",
    title: "Client onboarding",
    description: "Give both sides a clear path to first value.",
    steps: [
      "Confirm scope, commercial terms, primary contact, and responsibilities.",
      "Capture success criteria and baseline measures.",
      "Request only the access needed for the agreed work.",
      "Complete setup and verify the first real workflow together.",
      "Record the first useful outcome and any blockers.",
      "Schedule the next check-in and confirm outstanding commitments.",
    ],
  },
  {
    id: "seo",
    title: "SEO experiment",
    description: "Track a useful page and its measured results.",
    steps: [
      "Choose a customer question supported by interview or search evidence.",
      "Record the page, intended audience, and baseline impressions/conversions.",
      "Write original useful content with verifiable claims.",
      "Review metadata, internal links, canonical URL, sitemap, and accessibility.",
      "Publish manually and verify indexing status without promising rankings.",
      "Review qualified visits and booked conversations after a defined observation period.",
    ],
  },
  {
    id: "renewal",
    title: "Client check-in and renewal",
    description: "Keep the relationship tied to demonstrated value.",
    steps: [
      "Review agreed outcomes, recent usage, and unresolved support issues.",
      "Ask what is working, what is missing, and whether their priorities changed.",
      "Record risks and commitments without inventing a health score.",
      "Agree the next period, scope, and price explicitly.",
      "Prepare the renewal invoice and review it before sharing.",
      "Request a referral or case study only when appropriate and with permission.",
    ],
  },
];
export function buildUtmUrl(
  input: string,
  campaign: string,
  source: string,
  medium: string,
) {
  const url = new URL(input);
  if (!["https:", "http:"].includes(url.protocol))
    throw new Error("Use an HTTP or HTTPS destination.");
  for (const [k, v] of Object.entries({
    utm_campaign: campaign,
    utm_source: source,
    utm_medium: medium,
  })) {
    if (!v.trim())
      throw new Error("Campaign, source, and medium are required.");
    url.searchParams.set(k, v.trim());
  }
  return url.toString();
}
