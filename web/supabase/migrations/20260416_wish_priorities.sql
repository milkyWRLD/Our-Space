alter table public.wishes
add column if not exists is_pinned boolean not null default false;

alter table public.wishes
add column if not exists planned_for date;

create index if not exists idx_wishes_pinned_planned_for
  on public.wishes (couple_id, is_pinned desc, planned_for asc nulls last, created_at desc);
