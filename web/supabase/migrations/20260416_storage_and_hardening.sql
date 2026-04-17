create extension if not exists "pgcrypto";

insert into storage.buckets (id, name, public)
values ('wishes', 'wishes', true)
on conflict (id) do nothing;

create or replace function public.storage_couple_access(object_name text)
returns boolean
language sql
stable
as $$
  select
    object_name ~* '^[0-9a-f-]{36}/'
    and public.is_couple_member(split_part(object_name, '/', 1)::uuid);
$$;

alter table storage.objects enable row level security;

drop policy if exists "wishes_bucket_select" on storage.objects;
create policy "wishes_bucket_select"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'wishes'
  and public.storage_couple_access(name)
);

drop policy if exists "wishes_bucket_insert" on storage.objects;
create policy "wishes_bucket_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'wishes'
  and public.storage_couple_access(name)
);

drop policy if exists "wishes_bucket_update" on storage.objects;
create policy "wishes_bucket_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'wishes'
  and public.storage_couple_access(name)
)
with check (
  bucket_id = 'wishes'
  and public.storage_couple_access(name)
);

drop policy if exists "wishes_bucket_delete" on storage.objects;
create policy "wishes_bucket_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'wishes'
  and public.storage_couple_access(name)
);
