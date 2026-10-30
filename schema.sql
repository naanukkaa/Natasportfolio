-- Run in Supabase SQL editor. Disable public sign-ups in Auth settings first.
create table public.admins(user_id uuid primary key references auth.users on delete cascade);
create function public.is_admin() returns boolean language sql security definer stable
 as $$ select exists(select 1 from public.admins where user_id=auth.uid()) $$;
create type club as enum('stem','robotics','general');
create table public.news(
 id uuid primary key default gen_random_uuid(),
 original_lang text not null check(original_lang in('ka','en')),
 title_ka text, title_en text, description_ka text, description_en text, content_ka text, content_en text,
 ka_edited boolean default false, en_edited boolean default false,
 category club not null default 'general', location text, main_image text, gallery text[] default '{}',
 status text not null default 'draft' check(status in('draft','published')),
 published_at timestamptz default now(), created_at timestamptz default now(), updated_at timestamptz default now());
create table public.projects(
 id uuid primary key default gen_random_uuid(), original_lang text not null check(original_lang in('ka','en')),
 title_ka text, title_en text, description_ka text, description_en text,
 category club not null, year int, main_image text, featured boolean default false,
 created_at timestamptz default now(), updated_at timestamptz default now());
create table public.project_images(
 id uuid primary key default gen_random_uuid(), project_id uuid not null references public.projects on delete cascade,
 image_url text not null, caption_ka text, caption_en text, sort_order int default 0);
create table public.gallery(
 id uuid primary key default gen_random_uuid(), image_url text not null, caption_ka text, caption_en text,
 category club not null default 'general', created_at timestamptz default now());
create table public.site_settings(setting_key text primary key, value_ka text, value_en text, updated_at timestamptz default now());
create table public.messages(
 id uuid primary key default gen_random_uuid(), name text not null check(length(name)<=120),
 email text not null check(email ~* '^[^@]+@[^@]+\.[^@]+$'), subject text check(length(subject)<=200),
 body text not null check(length(body)<=5000), created_at timestamptz default now());
create index on public.news(status,published_at desc); create index on public.news(category);
create index on public.projects(category,featured); create index on public.project_images(project_id);

alter table public.admins enable row level security;
do $$ declare t text; begin
 foreach t in array array['news','projects','project_images','gallery','site_settings'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('create policy "admin all" on public.%I for all using(public.is_admin()) with check(public.is_admin())',t);
 end loop; end $$;
create policy "read published" on public.news for select using(status='published');
create policy "read" on public.projects for select using(true);
create policy "read" on public.project_images for select using(true);
create policy "read" on public.gallery for select using(true);
create policy "read" on public.site_settings for select using(true);
alter table public.messages enable row level security;
create policy "anyone can send" on public.messages for insert with check(true);
create policy "admin reads" on public.messages for select using(public.is_admin());
insert into storage.buckets(id,name,public) values('media','media',true) on conflict do nothing;
create policy "public read media" on storage.objects for select using(bucket_id='media');
create policy "admin write media" on storage.objects for all using(bucket_id='media' and public.is_admin()) with check(bucket_id='media' and public.is_admin());
-- After creating Natalia's user in Auth > Users: insert into public.admins values('<her-user-uuid>');
