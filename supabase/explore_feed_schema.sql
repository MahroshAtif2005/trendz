create extension if not exists pgcrypto;

create table if not exists public.explore_posts (
  id text primary key default gen_random_uuid()::text,
  created_at timestamptz not null default timezone('utc', now()),
  owner_user_id text not null,
  owner_display_name text,
  owner_avatar_uri text,
  title text not null,
  vibe text not null,
  caption text,
  image_url text not null,
  fallback_image_urls text[] not null default '{}',
  height integer not null default 300,
  categories text[] not null default '{}',
  source text not null default 'user_upload' check (source in ('user_upload')),
  posted_at timestamptz not null default timezone('utc', now()),
  review_session_id text not null unique,
  feed_reason text not null default '',
  ai_tags text[] not null default '{}',
  overall_score numeric not null default 0,
  occasion_fit numeric not null default 0,
  trend_score numeric not null default 0,
  confidence_score numeric not null default 0,
  image_quality_score numeric not null default 0,
  aesthetic_score numeric not null default 0,
  save_count integer not null default 0 check (save_count >= 0),
  is_published boolean not null default true
);

create table if not exists public.explore_post_saves (
  post_id text not null references public.explore_posts(id) on delete cascade,
  user_id text not null,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (post_id, user_id)
);

create index if not exists explore_posts_posted_at_idx on public.explore_posts (posted_at desc);
create index if not exists explore_posts_created_at_idx on public.explore_posts (created_at desc);
create index if not exists explore_posts_owner_user_id_idx on public.explore_posts (owner_user_id);
create index if not exists explore_posts_review_session_id_idx on public.explore_posts (review_session_id);
create unique index if not exists explore_posts_review_session_id_unique_idx on public.explore_posts (review_session_id);
create index if not exists explore_posts_is_published_idx on public.explore_posts (is_published);
create index if not exists explore_posts_categories_gin_idx on public.explore_posts using gin (categories);
create index if not exists explore_post_saves_user_id_idx on public.explore_post_saves (user_id);

create or replace function public.sync_explore_post_save_count()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    update public.explore_posts
    set save_count = save_count + 1
    where id = new.post_id;

    return new;
  end if;

  if tg_op = 'DELETE' then
    update public.explore_posts
    set save_count = greatest(save_count - 1, 0)
    where id = old.post_id;

    return old;
  end if;

  return null;
end;
$$;

drop trigger if exists explore_post_saves_sync_insert on public.explore_post_saves;
create trigger explore_post_saves_sync_insert
after insert on public.explore_post_saves
for each row
execute function public.sync_explore_post_save_count();

drop trigger if exists explore_post_saves_sync_delete on public.explore_post_saves;
create trigger explore_post_saves_sync_delete
after delete on public.explore_post_saves
for each row
execute function public.sync_explore_post_save_count();

alter table public.explore_posts enable row level security;
alter table public.explore_post_saves enable row level security;

drop policy if exists "explore posts are publicly readable" on public.explore_posts;
create policy "explore posts are publicly readable"
on public.explore_posts
for select
using (is_published = true);

drop policy if exists "authenticated users can publish explore posts" on public.explore_posts;
create policy "authenticated users can publish explore posts"
on public.explore_posts
for insert
to authenticated
with check (auth.uid()::text = owner_user_id);

drop policy if exists "owners can update their explore posts" on public.explore_posts;
create policy "owners can update their explore posts"
on public.explore_posts
for update
to authenticated
using (auth.uid()::text = owner_user_id)
with check (auth.uid()::text = owner_user_id);

drop policy if exists "owners can delete their explore posts" on public.explore_posts;
create policy "owners can delete their explore posts"
on public.explore_posts
for delete
to authenticated
using (auth.uid()::text = owner_user_id);

drop policy if exists "users can read their own explore saves" on public.explore_post_saves;
create policy "users can read their own explore saves"
on public.explore_post_saves
for select
to authenticated
using (auth.uid()::text = user_id);

drop policy if exists "users can create their own explore saves" on public.explore_post_saves;
create policy "users can create their own explore saves"
on public.explore_post_saves
for insert
to authenticated
with check (auth.uid()::text = user_id);

drop policy if exists "users can remove their own explore saves" on public.explore_post_saves;
create policy "users can remove their own explore saves"
on public.explore_post_saves
for delete
to authenticated
using (auth.uid()::text = user_id);
