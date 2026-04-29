-- =====================================================================
-- Migration : positions.image_path
-- =====================================================================
-- Permet a l'utilisateur de remplacer l'image GrappleMap par defaut
-- par une image personnalisee uploadee dans le bucket Supabase
-- "technique-images" (sous le prefixe "positions/").
-- =====================================================================

alter table public.positions
  add column if not exists image_path text;

-- Les positions sont globales (pas de user_id). On autorise les
-- utilisateurs authentifies a updater le champ image_path. Si une
-- politique d'update existe deja, on la conserve. Sinon on en cree une.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'positions'
      and cmd = 'UPDATE'
  ) then
    execute $p$
      create policy positions_update_authenticated
        on public.positions
        for update
        to authenticated
        using (true)
        with check (true)
    $p$;
  end if;
end $$;
