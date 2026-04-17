drop policy if exists "couple_members_insert_member" on public.couple_members;

create policy "couple_members_insert_member"
on public.couple_members
for insert
to authenticated
with check (
  (
    user_id = auth.uid()
    and exists (
      select 1
      from public.couples c
      where c.id = couple_id
        and c.created_by = auth.uid()
    )
  )
  or public.is_couple_member(couple_id)
);

create or replace function public.consume_couple_invite(invite_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  invite_hash text;
  target_couple_id uuid;
begin
  if current_user_id is null then
    raise exception 'Auth required';
  end if;

  if invite_token is null or char_length(trim(invite_token)) < 16 then
    raise exception 'Invalid invite token';
  end if;

  select cm.couple_id
  into target_couple_id
  from public.couple_members cm
  where cm.user_id = current_user_id
  limit 1;

  if target_couple_id is not null then
    return target_couple_id;
  end if;

  invite_hash := encode(digest(trim(invite_token), 'sha256'), 'hex');

  select ci.couple_id
  into target_couple_id
  from public.couple_invites ci
  where ci.token_hash = invite_hash
    and ci.accepted_at is null
    and ci.revoked_at is null
    and ci.expires_at > timezone('utc', now())
  order by ci.created_at desc
  limit 1;

  if target_couple_id is null then
    raise exception 'Invite is invalid or expired';
  end if;

  insert into public.couple_members (couple_id, user_id, role)
  values (target_couple_id, current_user_id, 'partner')
  on conflict (couple_id, user_id) do nothing;

  update public.couple_invites
  set accepted_by = current_user_id,
      accepted_at = timezone('utc', now())
  where token_hash = invite_hash
    and accepted_at is null
    and revoked_at is null
    and expires_at > timezone('utc', now());

  update public.couples
  set status = 'active'
  where id = target_couple_id;

  return target_couple_id;
end;
$$;

grant execute on function public.consume_couple_invite(text) to authenticated;
