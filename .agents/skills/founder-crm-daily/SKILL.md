---
name: founder-crm-daily
description: Find the correct focused Founder CRM stage; do not run the entire pipeline in one turn.
---
Read docs/AUTOMATION-STAGES.md. Use founder-crm-research, founder-crm-drafts or founder-crm-replies for the requested stage, and founder-crm-weekly for learning review. The previous combined job is retired. Do not independently re-run all stages or create duplicate schedules. Each stage reads its own downloaded skills, saves a receipt and enforces dependencies. Supabase is authoritative; no Airtable operations, paid LLM APIs, n8n or automatic sends.
