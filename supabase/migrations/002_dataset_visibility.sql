-- Status visibilitas untuk dataset yang berasal dari portal eksternal.
-- Data portal tidak diubah; dashboard memakai tabel ini sebagai sumber status global.
create table if not exists public.dataset_visibility (
  dataset_uuid text primary key,
  is_active boolean not null default true,
  deleted_at timestamptz,
  permanently_deleted boolean not null default false,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.dataset_visibility enable row level security;

drop policy if exists "public reads dataset visibility" on public.dataset_visibility;
drop policy if exists "authenticated admins manage dataset visibility" on public.dataset_visibility;

create policy "public reads dataset visibility" on public.dataset_visibility
  for select using (true);

create policy "authenticated admins manage dataset visibility" on public.dataset_visibility
  for all to authenticated
  using (true)
  with check (updated_by = auth.uid());

create or replace function public.set_dataset_visibility_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists dataset_visibility_updated_at on public.dataset_visibility;
create trigger dataset_visibility_updated_at
  before update on public.dataset_visibility
  for each row execute function public.set_dataset_visibility_updated_at();
