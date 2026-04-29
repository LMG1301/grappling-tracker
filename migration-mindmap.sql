-- =====================================================================
-- Migration : Skill Tree -> Mindmap
-- =====================================================================
-- Transforme le module Skill Tree en arbre :
--   1. Ajoute positions.parent_position_id pour la hierarchie
--   2. Renomme la categorie "Transitions" en "Scrambles & Other"
--   3. Cree la table technique_transitions (graphe technique -> position)
--   4. Peuple technique_transitions depuis les techniques existantes
--   5. Supprime la table position_library (devenue inutile)
-- =====================================================================

-- 1. Hierarchie des positions ------------------------------------------
alter table public.positions
  add column if not exists parent_position_id uuid
  references public.positions(id) on delete set null;

create index if not exists idx_positions_parent on public.positions(parent_position_id);

-- 2. Renommage de la categorie -----------------------------------------
update public.position_categories
  set name = 'Scrambles & Other'
  where name = 'Transitions';

-- 3. Table technique_transitions ---------------------------------------
create table if not exists public.technique_transitions (
  id uuid primary key default gen_random_uuid(),
  technique_id uuid not null references public.techniques(id) on delete cascade,
  from_position_id uuid not null references public.positions(id) on delete cascade,
  to_position_id uuid references public.positions(id) on delete set null,
  is_terminal boolean default false,
  created_at timestamptz default now(),
  unique (technique_id)
);

create index if not exists idx_technique_transitions_from on public.technique_transitions(from_position_id);
create index if not exists idx_technique_transitions_to on public.technique_transitions(to_position_id);

alter table public.technique_transitions enable row level security;

drop policy if exists "Users CRUD own technique transitions" on public.technique_transitions;
create policy "Users CRUD own technique transitions"
  on public.technique_transitions
  for all to authenticated
  using (
    exists (
      select 1 from public.techniques t
      where t.id = technique_transitions.technique_id and t.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.techniques t
      where t.id = technique_transitions.technique_id and t.user_id = auth.uid()
    )
  );

-- 4. Peuplement initial depuis les techniques existantes ---------------
-- Les positions sont scopees par user (positions.user_id), donc on
-- match per-user en JOIN.
--
-- Defaults par action_type :
--   submission       -> is_terminal = true, to = NULL
--   sweep            -> to = mount_top
--   pass / takedown  -> to = side_control_top
--   escape           -> to = seated_open_guard
--   transition       -> to = NULL (a completer par l'utilisateur)
--   defense          -> to = NULL (a completer par l'utilisateur)
--   control / drill / principle -> AUCUNE entree (concepts, pas des aretes)

insert into public.technique_transitions (technique_id, from_position_id, to_position_id, is_terminal)
select
  t.id as technique_id,
  p_from.id as from_position_id,
  case
    when t.action_type = 'submission' then null
    when t.action_type = 'sweep' then (
      select p.id from public.positions p
      where p.user_id = t.user_id and p.slug = 'mount_top'
      limit 1
    )
    when t.action_type in ('pass', 'takedown') then (
      select p.id from public.positions p
      where p.user_id = t.user_id and p.slug = 'side_control_top'
      limit 1
    )
    when t.action_type = 'escape' then (
      select p.id from public.positions p
      where p.user_id = t.user_id and p.slug = 'seated_open_guard'
      limit 1
    )
    else null
  end as to_position_id,
  (t.action_type = 'submission') as is_terminal
from public.techniques t
join public.positions p_from
  on p_from.user_id = t.user_id
  and (p_from.slug = t.position or p_from.name = t.position)
where t.action_type not in ('control', 'drill', 'principle')
on conflict (technique_id) do nothing;

-- 5. Suppression de position_library -----------------------------------
drop table if exists public.position_library;
