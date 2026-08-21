-- ============================================================================
-- 0001 — Shared identity layer + ALT tracker application schema
--
-- Layout rationale:
--   public.*      Identity shared by EVERY app hosted in this project. A user
--                 signs in once and their profile follows them between apps.
--   altracker.*   Tables owned solely by the ALT class tracker. A future app
--                 gets its own schema and reuses public.profiles.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $fn$
begin
  new.updated_at = now();
  return new;
end;
$fn$;


-- ---------------------------------------------------------------------------
-- public.profiles — the shared identity record
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  email        text,
  display_name text,
  avatar_url   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- (select auth.uid()) rather than a bare auth.uid() call so Postgres caches it
-- as an initplan instead of re-evaluating it once per row.
create policy profiles_select_own on public.profiles
  for select to authenticated
  using ((select auth.uid()) = id);

create policy profiles_insert_own on public.profiles
  for insert to authenticated
  with check ((select auth.uid()) = id);

create policy profiles_update_own on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();


-- Auto-provision a profile the moment a user signs up, so that no individual
-- app has to remember to create one.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $fn$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name'
    ),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$fn$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ---------------------------------------------------------------------------
-- altracker schema
-- ---------------------------------------------------------------------------

create schema if not exists altracker;
grant usage on schema altracker to authenticated;

create type altracker.school_type  as enum ('Elementary', 'Junior High', 'High School');
create type altracker.teacher_role as enum ('HRT', 'JTE', 'Other');


create table altracker.schools (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null default auth.uid()
                             references auth.users (id) on delete cascade,
  name                     text not null check (char_length(name) between 1 and 200),
  name_jp                  text,
  type                     altracker.school_type not null,
  color_tag                text not null default 'indigo',
  default_duration_minutes int  not null default 45
                             check (default_duration_minutes between 1 and 480),
  address                  text,
  contact_number           text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);


create table altracker.teachers (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid()
               references auth.users (id) on delete cascade,
  school_id  uuid not null references altracker.schools (id) on delete cascade,
  name       text not null check (char_length(name) between 1 and 200),
  name_jp    text,
  role       altracker.teacher_role not null default 'Other',
  email      text,
  notes      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


create table altracker.classes (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null default auth.uid()
                     references auth.users (id) on delete cascade,
  school_id        uuid not null references altracker.schools (id) on delete cascade,
  grade_level      text not null,
  class_identifier text not null,
  student_count    int check (student_count >= 0),
  room             text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);


-- teacher_id / class_id use ON DELETE SET NULL rather than CASCADE: removing a
-- teacher from the roster must not erase the lesson history you report on.
create table altracker.lessons (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null default auth.uid()
                           references auth.users (id) on delete cascade,
  school_id              uuid not null references altracker.schools (id) on delete cascade,
  teacher_id             uuid references altracker.teachers (id) on delete set null,
  class_id               uuid references altracker.classes (id) on delete set null,
  date                   date not null,
  start_time             time not null,
  duration_minutes       int  not null default 45
                           check (duration_minutes between 1 and 480),
  period                 smallint check (period between 1 and 8),
  is_recurring           boolean not null default false,
  recurrence_day_of_week smallint check (recurrence_day_of_week between 0 and 6),
  notes                  text not null default '' check (char_length(notes) <= 280),
  completed              boolean not null default false,
  target_unit            text,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);


-- ---------------------------------------------------------------------------
-- Indexes — every read is scoped by user_id, so it leads each one.
-- ---------------------------------------------------------------------------

create index schools_user_idx         on altracker.schools  (user_id);
create index teachers_user_school_idx on altracker.teachers (user_id, school_id);
create index classes_user_school_idx  on altracker.classes  (user_id, school_id);
create index lessons_user_date_idx    on altracker.lessons  (user_id, date desc);
create index lessons_user_school_idx  on altracker.lessons  (user_id, school_id);
create index lessons_teacher_idx      on altracker.lessons  (teacher_id);
create index lessons_class_idx        on altracker.lessons  (class_id);


-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------

create trigger schools_set_updated_at  before update on altracker.schools
  for each row execute function public.set_updated_at();
create trigger teachers_set_updated_at before update on altracker.teachers
  for each row execute function public.set_updated_at();
create trigger classes_set_updated_at  before update on altracker.classes
  for each row execute function public.set_updated_at();
create trigger lessons_set_updated_at  before update on altracker.lessons
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------------
-- Row Level Security — a user reaches their own rows and nothing else.
-- FOR ALL covers select / insert / update / delete in one policy.
-- ---------------------------------------------------------------------------

alter table altracker.schools  enable row level security;
alter table altracker.teachers enable row level security;
alter table altracker.classes  enable row level security;
alter table altracker.lessons  enable row level security;

create policy schools_own on altracker.schools
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy teachers_own on altracker.teachers
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy classes_own on altracker.classes
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy lessons_own on altracker.lessons
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);


-- Table-level grants. RLS still gates which rows are visible; without these
-- grants PostgREST cannot reach the tables at all.
grant select, insert, update, delete on all tables in schema altracker to authenticated;

alter default privileges in schema altracker
  grant select, insert, update, delete on tables to authenticated;
