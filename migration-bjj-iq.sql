-- Migration BJJ IQ : nouveaux types, maturite, focus, key_points, technique_links
-- A executer dans Supabase SQL Editor

-- 1. Elargir le CHECK constraint sur action_type
ALTER TABLE public.techniques
  DROP CONSTRAINT techniques_action_type_check;

ALTER TABLE public.techniques
  ADD CONSTRAINT techniques_action_type_check
  CHECK (action_type IN (
    'submission', 'sweep', 'pass', 'escape', 'transition', 'takedown',
    'principle', 'drill'
  ));

-- 2. Ajouter le champ maturite (4 niveaux)
ALTER TABLE public.techniques
  ADD COLUMN maturity text DEFAULT 'seen'
  CHECK (maturity IN ('seen', 'drilled', 'sparred', 'reliable'));

-- 3. Ajouter le flag focus (max 5 actifs, controle cote app)
ALTER TABLE public.techniques
  ADD COLUMN is_focus boolean DEFAULT false;

-- 4. Ajouter key_points pour les principes et drills
ALTER TABLE public.techniques
  ADD COLUMN key_points text;

-- 5. Table de liaison technique <-> technique
CREATE TABLE public.technique_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  source_id uuid REFERENCES public.techniques(id) ON DELETE CASCADE NOT NULL,
  target_id uuid REFERENCES public.techniques(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(source_id, target_id)
);

ALTER TABLE public.technique_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own links"
  ON public.technique_links FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own links"
  ON public.technique_links FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own links"
  ON public.technique_links FOR DELETE USING (auth.uid() = user_id);
