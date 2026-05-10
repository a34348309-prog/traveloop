-- Run this entire script in the Supabase SQL Editor
-- https://app.supabase.com → SQL Editor → New Query

-- ── Tables ──────────────────────────────────────────────────────────────────
create table if not exists users (
  id uuid primary key default auth.uid(),
  name text not null,
  email text unique not null,
  phone text,
  city text,
  country text default 'India',
  avatar_url text,
  role text default 'user',
  additional_info text,
  created_at timestamptz default now()
);

create table if not exists trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  name text not null,
  place text,
  lat float,
  lng float,
  start_date date,
  end_date date,
  status text default 'upcoming',
  created_at timestamptz default now()
);

create table if not exists itinerary_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade,
  day_number int,
  activity_name text,
  category text,
  budget numeric default 0,
  expense numeric default 0,
  notes text,
  created_at timestamptz default now()
);

create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade,
  category text,
  description text,
  qty int default 1,
  unit_cost numeric default 0,
  amount numeric default 0,
  paid boolean default false,
  created_at timestamptz default now()
);

create table if not exists packing_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade,
  category text,
  label text,
  checked boolean default false
);

create table if not exists community_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  trip_id uuid references trips(id) on delete set null,
  content text,
  created_at timestamptz default now()
);

create table if not exists trip_notes (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade,
  day_number int,
  hotel_name text,
  room_type text,
  breakfast_included boolean default false,
  date_from date,
  date_to date,
  content text,
  created_at timestamptz default now()
);

-- ── Row Level Security ────────────────────────────────────────────────────────
alter table users enable row level security;
alter table trips enable row level security;
alter table itinerary_items enable row level security;
alter table expenses enable row level security;
alter table packing_items enable row level security;
alter table community_posts enable row level security;
alter table trip_notes enable row level security;

-- ── Policies ─────────────────────────────────────────────────────────────────
-- Users
create policy "Users own data" on users for all using (auth.uid() = id);

-- Trips
create policy "Users manage own trips" on trips for all using (auth.uid() = user_id);

-- Itinerary items (via trip ownership)
create policy "Users manage itinerary" on itinerary_items for all
  using (exists (select 1 from trips where trips.id = itinerary_items.trip_id and trips.user_id = auth.uid()));

-- Expenses
create policy "Users manage expenses" on expenses for all
  using (exists (select 1 from trips where trips.id = expenses.trip_id and trips.user_id = auth.uid()));

-- Packing items
create policy "Users manage packing" on packing_items for all
  using (exists (select 1 from trips where trips.id = packing_items.trip_id and trips.user_id = auth.uid()));

-- Community: all can read, only author can write
create policy "Community public read" on community_posts for select using (true);
create policy "Authors manage posts" on community_posts for insert with check (auth.uid() = user_id);
create policy "Authors delete posts" on community_posts for delete using (auth.uid() = user_id);

-- Trip notes
create policy "Users manage notes" on trip_notes for all
  using (exists (select 1 from trips where trips.id = trip_notes.trip_id and trips.user_id = auth.uid()));

-- ── Storage bucket for avatars ─────────────────────────────────────────────
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict do nothing;

create policy "Avatar upload" on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.role() = 'authenticated');

create policy "Avatar public read" on storage.objects for select
  using (bucket_id = 'avatars');
