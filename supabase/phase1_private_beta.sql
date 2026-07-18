-- Atlas Archive private beta Phase 1
-- Paste this into the Supabase SQL editor for your project.
-- Do not put the service-role key in the browser or GitHub repository.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.characters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  visibility text not null default 'private' check (visibility in ('private', 'unlisted', 'public')),
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  app_version text default 'private-beta-phase-1',
  last_successful_save timestamptz,
  save_error_status text
);

create table if not exists public.worlds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  visibility text not null default 'private' check (visibility in ('private', 'unlisted', 'public')),
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  app_version text default 'private-beta-phase-1',
  last_successful_save timestamptz,
  save_error_status text
);

create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  visibility text not null default 'private' check (visibility in ('private', 'unlisted', 'public')),
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  app_version text default 'private-beta-phase-1',
  last_successful_save timestamptz,
  save_error_status text
);

create table if not exists public.timelines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  visibility text not null default 'private' check (visibility in ('private', 'unlisted', 'public')),
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  app_version text default 'private-beta-phase-1',
  last_successful_save timestamptz,
  save_error_status text
);

create table if not exists public.inspiration_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  visibility text not null default 'private' check (visibility in ('private', 'unlisted', 'public')),
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  app_version text default 'private-beta-phase-1',
  last_successful_save timestamptz,
  save_error_status text
);

create table if not exists public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'requested' check (status in ('requested', 'reviewing', 'completed', 'cancelled')),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger characters_set_updated_at before update on public.characters for each row execute function public.set_updated_at();
create trigger worlds_set_updated_at before update on public.worlds for each row execute function public.set_updated_at();
create trigger stories_set_updated_at before update on public.stories for each row execute function public.set_updated_at();
create trigger timelines_set_updated_at before update on public.timelines for each row execute function public.set_updated_at();
create trigger inspiration_items_set_updated_at before update on public.inspiration_items for each row execute function public.set_updated_at();
create trigger account_deletion_requests_set_updated_at before update on public.account_deletion_requests for each row execute function public.set_updated_at();

alter table public.characters enable row level security;
alter table public.worlds enable row level security;
alter table public.stories enable row level security;
alter table public.timelines enable row level security;
alter table public.inspiration_items enable row level security;
alter table public.account_deletion_requests enable row level security;

create policy "characters owner select" on public.characters for select using (auth.uid() = user_id);
create policy "characters owner insert" on public.characters for insert with check (auth.uid() = user_id and visibility = 'private');
create policy "characters owner update" on public.characters for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "characters owner delete" on public.characters for delete using (auth.uid() = user_id);

create policy "worlds owner select" on public.worlds for select using (auth.uid() = user_id);
create policy "worlds owner insert" on public.worlds for insert with check (auth.uid() = user_id and visibility = 'private');
create policy "worlds owner update" on public.worlds for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "worlds owner delete" on public.worlds for delete using (auth.uid() = user_id);

create policy "stories owner select" on public.stories for select using (auth.uid() = user_id);
create policy "stories owner insert" on public.stories for insert with check (auth.uid() = user_id and visibility = 'private');
create policy "stories owner update" on public.stories for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "stories owner delete" on public.stories for delete using (auth.uid() = user_id);

create policy "timelines owner select" on public.timelines for select using (auth.uid() = user_id);
create policy "timelines owner insert" on public.timelines for insert with check (auth.uid() = user_id and visibility = 'private');
create policy "timelines owner update" on public.timelines for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "timelines owner delete" on public.timelines for delete using (auth.uid() = user_id);

create policy "inspiration owner select" on public.inspiration_items for select using (auth.uid() = user_id);
create policy "inspiration owner insert" on public.inspiration_items for insert with check (auth.uid() = user_id and visibility = 'private');
create policy "inspiration owner update" on public.inspiration_items for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "inspiration owner delete" on public.inspiration_items for delete using (auth.uid() = user_id);

create policy "deletion requests owner select" on public.account_deletion_requests for select using (auth.uid() = user_id);
create policy "deletion requests owner insert" on public.account_deletion_requests for insert with check (auth.uid() = user_id);
create policy "deletion requests owner update" on public.account_deletion_requests for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "deletion requests owner delete" on public.account_deletion_requests for delete using (auth.uid() = user_id);
