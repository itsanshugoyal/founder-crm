-- Apply in the Supabase SQL editor. Browser clients have no direct table access.
create table if not exists public.crm_revision (id integer primary key check(id=1), revision bigint not null default 0, private jsonb not null default '{}');
insert into public.crm_revision(id) values(1) on conflict do nothing;
create table if not exists public.crm_projects (id text primary key, body jsonb not null);
create table if not exists public.crm_members (id text primary key, body jsonb not null);
create table if not exists public.crm_memberships (id text primary key, member_id text not null references public.crm_members(id), project_id text not null references public.crm_projects(id), unique(member_id,project_id));
create table if not exists public.crm_records (id text primary key, body jsonb not null, project_id text generated always as (body->>'projectId') stored references public.crm_projects(id));
create table if not exists public.crm_activities (id text primary key, body jsonb not null, project_id text generated always as (body->>'projectId') stored references public.crm_projects(id));
create index if not exists crm_records_project on public.crm_records(project_id);
create index if not exists crm_activities_project on public.crm_activities(project_id);
alter table public.crm_revision enable row level security;
alter table public.crm_projects enable row level security;
alter table public.crm_members enable row level security;
alter table public.crm_memberships enable row level security;
alter table public.crm_records enable row level security;
alter table public.crm_activities enable row level security;

create or replace function public.crm_snapshot() returns jsonb language sql security invoker set search_path=public as $$
select jsonb_build_object('revision', r.revision, 'private', r.private,
 'projects',coalesce((select jsonb_agg(body) from crm_projects),'[]'::jsonb),
 'members',coalesce((select jsonb_agg(body) from crm_members),'[]'::jsonb),
 'records',coalesce((select jsonb_agg(body) from crm_records),'[]'::jsonb),
 'activities',coalesce((select jsonb_agg(body) from crm_activities),'[]'::jsonb)) from crm_revision r where id=1;
$$;
-- A revision compare and transaction-wide lock serialize all approval, send, and audit writes.
create or replace function public.crm_commit(expected_revision bigint, next_state jsonb) returns boolean language plpgsql security invoker set search_path=public as $$
declare current_revision bigint;
begin
 select revision into current_revision from crm_revision where id=1 for update;
 if current_revision <> expected_revision then return false; end if;
 insert into crm_projects select x->>'id',x from jsonb_array_elements(next_state->'projects') x
 on conflict(id) do update set body=excluded.body where crm_projects.body is distinct from excluded.body;
 insert into crm_members select x->>'id',x from jsonb_array_elements(next_state->'members') x
 on conflict(id) do update set body=excluded.body where crm_members.body is distinct from excluded.body;
 insert into crm_memberships select (x->>'id')||':'||p, x->>'id',p from jsonb_array_elements(next_state->'members') x cross join lateral jsonb_array_elements_text(x->'projectIds') p
 on conflict(id) do nothing;
 insert into crm_records(id,body) select x->>'id',x from jsonb_array_elements(next_state->'records') x
 on conflict(id) do update set body=excluded.body where crm_records.body is distinct from excluded.body;
 insert into crm_activities(id,body) select x->>'id',x from jsonb_array_elements(next_state->'activities') x
 on conflict(id) do update set body=excluded.body where crm_activities.body is distinct from excluded.body;
 delete from crm_activities a where not exists(select 1 from jsonb_array_elements(next_state->'activities') x where x->>'id'=a.id);
 delete from crm_records a where not exists(select 1 from jsonb_array_elements(next_state->'records') x where x->>'id'=a.id);
 delete from crm_memberships a where not exists(select 1 from jsonb_array_elements(next_state->'members') x cross join lateral jsonb_array_elements_text(x->'projectIds') p where (x->>'id')=a.member_id and p=a.project_id);
 delete from crm_members a where not exists(select 1 from jsonb_array_elements(next_state->'members') x where x->>'id'=a.id);
 delete from crm_projects a where not exists(select 1 from jsonb_array_elements(next_state->'projects') x where x->>'id'=a.id);
 update crm_revision set revision=revision+1, private=next_state->'private' where id=1;
 return true;
end; $$;
revoke all on function public.crm_snapshot() from public;
revoke all on function public.crm_commit(bigint,jsonb) from public;
-- Standalone PGlite has no Supabase roles; the same migration works in both environments.
do $$ begin
 if exists(select 1 from pg_roles where rolname='anon') then
  revoke all on public.crm_revision,public.crm_projects,public.crm_members,public.crm_memberships,public.crm_records,public.crm_activities from anon,authenticated;
  revoke all on function public.crm_snapshot() from anon,authenticated;
  revoke all on function public.crm_commit(bigint,jsonb) from anon,authenticated;
  grant usage on schema public to service_role;
  grant select,insert,update,delete on public.crm_revision,public.crm_projects,public.crm_members,public.crm_memberships,public.crm_records,public.crm_activities to service_role;
  grant execute on function public.crm_snapshot() to service_role;
  grant execute on function public.crm_commit(bigint,jsonb) to service_role;
 end if;
end $$;
