create extension if not exists "pgcrypto";

create or replace function public.is_couple_member(target_couple_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.couple_members cm
    where cm.couple_id = target_couple_id
      and cm.user_id = auth.uid()
  );
$$;

create or replace function public.current_user_couple_id()
returns uuid
language sql
stable
as $$
  select cm.couple_id
  from public.couple_members cm
  where cm.user_id = auth.uid()
  limit 1;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  display_name text,
  avatar_path text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint profiles_email_format check (position('@' in email) > 1)
);

create table if not exists public.couples (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles(id) on delete restrict,
  status text not null default 'pending',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint couples_status_check check (status in ('pending', 'active'))
);

create table if not exists public.couple_members (
  couple_id uuid not null references public.couples(id) on delete cascade,
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  role text not null default 'partner',
  joined_at timestamptz not null default timezone('utc', now()),
  primary key (couple_id, user_id),
  constraint couple_members_role_check check (role in ('owner', 'partner'))
);

create table if not exists public.couple_invites (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  token_hash text not null unique,
  created_by uuid not null references public.profiles(id) on delete cascade,
  expires_at timestamptz not null,
  accepted_by uuid references public.profiles(id) on delete set null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  constraint couple_invites_hash_length check (char_length(token_hash) >= 32),
  constraint couple_invites_expiry_check check (expires_at > created_at)
);

create table if not exists public.wishes (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  title text not null,
  description text,
  category text not null,
  external_link text,
  status text not null default 'planned',
  location_name text,
  latitude numeric(9,6),
  longitude numeric(9,6),
  created_by uuid not null references public.profiles(id) on delete restrict,
  done_at timestamptz,
  how_it_went text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint wishes_title_length check (char_length(trim(title)) between 2 and 160),
  constraint wishes_category_check check (category in ('wish', 'place', 'trip')),
  constraint wishes_status_check check (status in ('planned', 'done')),
  constraint wishes_external_link_protocol_check check (
    external_link is null
    or external_link ~* '^https://'
    or external_link ~* '^http://'
  ),
  constraint wishes_location_presence_check check (
    (
      location_name is null
      and latitude is null
      and longitude is null
    )
    or (
      location_name is not null
      and latitude is not null
      and longitude is not null
    )
  ),
  constraint wishes_done_state_check check (
    (status = 'planned' and done_at is null)
    or (status = 'done' and done_at is not null)
  )
);

create table if not exists public.wish_images (
  id uuid primary key default gen_random_uuid(),
  wish_id uuid not null references public.wishes(id) on delete cascade,
  storage_path text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  constraint wish_images_storage_path_length check (char_length(storage_path) > 4)
);

create table if not exists public.wish_reactions (
  id uuid primary key default gen_random_uuid(),
  wish_id uuid not null references public.wishes(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reaction_type text not null default 'like',
  created_at timestamptz not null default timezone('utc', now()),
  constraint wish_reactions_type_check check (reaction_type in ('like')),
  constraint wish_reactions_unique unique (wish_id, user_id, reaction_type)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  type text not null,
  message text,
  from_user uuid not null references public.profiles(id) on delete cascade,
  to_user uuid not null references public.profiles(id) on delete cascade,
  read_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  constraint notifications_type_check check (
    type in ('miss_you', 'thinking', 'hug', 'custom', 'wish_liked', 'wish_done')
  ),
  constraint notifications_message_length check (
    message is null or char_length(message) <= 300
  ),
  constraint notifications_direction_check check (from_user <> to_user)
);

create index if not exists idx_couple_members_user_id
  on public.couple_members (user_id);

create index if not exists idx_couple_members_couple_id
  on public.couple_members (couple_id);

create index if not exists idx_couple_invites_lookup
  on public.couple_invites (couple_id, expires_at desc);

create index if not exists idx_wishes_filtering
  on public.wishes (couple_id, status, category, created_at desc);

create index if not exists idx_notifications_feed
  on public.notifications (to_user, read_at, created_at desc);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.enforce_couple_member_limit()
returns trigger
language plpgsql
as $$
declare
  member_count integer;
begin
  select count(*)
  into member_count
  from public.couple_members
  where couple_id = new.couple_id
    and (tg_op = 'INSERT' or user_id <> old.user_id);

  if member_count >= 2 then
    raise exception 'A couple can only contain two members';
  end if;

  return new;
end;
$$;

create or replace function public.validate_wish_reaction_member()
returns trigger
language plpgsql
as $$
declare
  target_couple_id uuid;
begin
  select couple_id into target_couple_id
  from public.wishes
  where id = new.wish_id;

  if target_couple_id is null then
    raise exception 'Wish not found';
  end if;

  if not exists (
    select 1
    from public.couple_members cm
    where cm.couple_id = target_couple_id
      and cm.user_id = new.user_id
  ) then
    raise exception 'Reaction user must be a member of the same couple';
  end if;

  return new;
end;
$$;

create or replace function public.validate_notification_membership()
returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1
    from public.couple_members cm
    where cm.couple_id = new.couple_id
      and cm.user_id = new.from_user
  ) then
    raise exception 'Sender must belong to the target couple';
  end if;

  if not exists (
    select 1
    from public.couple_members cm
    where cm.couple_id = new.couple_id
      and cm.user_id = new.to_user
  ) then
    raise exception 'Recipient must belong to the target couple';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

drop trigger if exists couples_touch_updated_at on public.couples;
create trigger couples_touch_updated_at
before update on public.couples
for each row execute function public.touch_updated_at();

drop trigger if exists wishes_touch_updated_at on public.wishes;
create trigger wishes_touch_updated_at
before update on public.wishes
for each row execute function public.touch_updated_at();

drop trigger if exists couple_members_limit on public.couple_members;
create trigger couple_members_limit
before insert or update on public.couple_members
for each row execute function public.enforce_couple_member_limit();

drop trigger if exists wish_reactions_membership on public.wish_reactions;
create trigger wish_reactions_membership
before insert or update on public.wish_reactions
for each row execute function public.validate_wish_reaction_member();

drop trigger if exists notifications_membership on public.notifications;
create trigger notifications_membership
before insert or update on public.notifications
for each row execute function public.validate_notification_membership();

alter table public.profiles enable row level security;
alter table public.couples enable row level security;
alter table public.couple_members enable row level security;
alter table public.couple_invites enable row level security;
alter table public.wishes enable row level security;
alter table public.wish_images enable row level security;
alter table public.wish_reactions enable row level security;
alter table public.notifications enable row level security;

create policy "profiles_select_self_or_partner"
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or exists (
    select 1
    from public.couple_members self_member
    join public.couple_members other_member
      on other_member.couple_id = self_member.couple_id
    where self_member.user_id = auth.uid()
      and other_member.user_id = profiles.id
  )
);

create policy "profiles_insert_self"
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

create policy "profiles_update_self"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "couples_select_member"
on public.couples
for select
to authenticated
using (public.is_couple_member(id));

create policy "couples_insert_creator"
on public.couples
for insert
to authenticated
with check (created_by = auth.uid());

create policy "couples_update_member"
on public.couples
for update
to authenticated
using (public.is_couple_member(id))
with check (public.is_couple_member(id));

create policy "couple_members_select_member"
on public.couple_members
for select
to authenticated
using (public.is_couple_member(couple_id));

create policy "couple_members_insert_member"
on public.couple_members
for insert
to authenticated
with check (
  user_id = auth.uid()
  or public.is_couple_member(couple_id)
);

create policy "couple_members_update_self_or_member"
on public.couple_members
for update
to authenticated
using (
  user_id = auth.uid()
  or public.is_couple_member(couple_id)
)
with check (
  user_id = auth.uid()
  or public.is_couple_member(couple_id)
);

create policy "couple_invites_select_member"
on public.couple_invites
for select
to authenticated
using (public.is_couple_member(couple_id));

create policy "couple_invites_insert_member"
on public.couple_invites
for insert
to authenticated
with check (
  created_by = auth.uid()
  and public.is_couple_member(couple_id)
);

create policy "couple_invites_update_member"
on public.couple_invites
for update
to authenticated
using (public.is_couple_member(couple_id))
with check (public.is_couple_member(couple_id));

create policy "wishes_select_member"
on public.wishes
for select
to authenticated
using (public.is_couple_member(couple_id));

create policy "wishes_insert_member"
on public.wishes
for insert
to authenticated
with check (
  created_by = auth.uid()
  and public.is_couple_member(couple_id)
);

create policy "wishes_update_member"
on public.wishes
for update
to authenticated
using (public.is_couple_member(couple_id))
with check (public.is_couple_member(couple_id));

create policy "wishes_delete_member"
on public.wishes
for delete
to authenticated
using (public.is_couple_member(couple_id));

create policy "wish_images_select_member"
on public.wish_images
for select
to authenticated
using (
  exists (
    select 1
    from public.wishes w
    where w.id = wish_images.wish_id
      and public.is_couple_member(w.couple_id)
  )
);

create policy "wish_images_insert_member"
on public.wish_images
for insert
to authenticated
with check (
  exists (
    select 1
    from public.wishes w
    where w.id = wish_images.wish_id
      and public.is_couple_member(w.couple_id)
  )
);

create policy "wish_images_update_member"
on public.wish_images
for update
to authenticated
using (
  exists (
    select 1
    from public.wishes w
    where w.id = wish_images.wish_id
      and public.is_couple_member(w.couple_id)
  )
)
with check (
  exists (
    select 1
    from public.wishes w
    where w.id = wish_images.wish_id
      and public.is_couple_member(w.couple_id)
  )
);

create policy "wish_images_delete_member"
on public.wish_images
for delete
to authenticated
using (
  exists (
    select 1
    from public.wishes w
    where w.id = wish_images.wish_id
      and public.is_couple_member(w.couple_id)
  )
);

create policy "wish_reactions_select_member"
on public.wish_reactions
for select
to authenticated
using (
  exists (
    select 1
    from public.wishes w
    where w.id = wish_reactions.wish_id
      and public.is_couple_member(w.couple_id)
  )
);

create policy "wish_reactions_insert_self"
on public.wish_reactions
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.wishes w
    where w.id = wish_reactions.wish_id
      and public.is_couple_member(w.couple_id)
  )
);

create policy "wish_reactions_delete_self"
on public.wish_reactions
for delete
to authenticated
using (user_id = auth.uid());

create policy "notifications_select_recipient_or_sender"
on public.notifications
for select
to authenticated
using (
  to_user = auth.uid()
  or from_user = auth.uid()
);

create policy "notifications_insert_sender"
on public.notifications
for insert
to authenticated
with check (
  from_user = auth.uid()
  and public.is_couple_member(couple_id)
);

create policy "notifications_update_recipient"
on public.notifications
for update
to authenticated
using (to_user = auth.uid())
with check (to_user = auth.uid());
