-- Migration: Mobility Module
-- Date: 2026-04-06

-- 1. Exercises catalog
create table mobility_exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_fr text not null,
  category text not null check (category in ('spine_wakeup', 'hip_mobility', 'multi_joint', 'dynamic_prep', 'static_stretch', 'decompression', 'breathing', 'foam_rolling')),
  routine_type text not null check (routine_type in ('pre', 'post', 'morning')),
  phase_order int not null,
  default_sets int,
  default_reps text,
  default_hold_sec int,
  default_tempo text,
  rest_sec int default 0,
  is_bilateral boolean default false,
  cue_pourquoi text,
  cue_comment text,
  cue_focus text,
  grappling_why text,
  video_search_term text,
  created_at timestamptz default now()
);

-- 2. Sessions
create table mobility_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  session_date date not null default current_date,
  routine_type text not null check (routine_type in ('pre', 'post', 'morning')),
  competition_week int check (competition_week between 1 and 10),
  phase text check (phase in ('accumulation', 'conversion', 'peaking', 'taper')),
  started_at timestamptz,
  completed_at timestamptz,
  total_duration_sec int,
  notes text,
  created_at timestamptz default now()
);

-- 3. Session entries
create table mobility_session_entries (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references mobility_sessions(id) on delete cascade,
  exercise_id uuid references mobility_exercises(id),
  exercise_order int not null,
  sets_completed int,
  reps_or_hold text,
  side text check (side in ('left', 'right', 'both')),
  completed boolean default false,
  skipped boolean default false,
  pain_level int check (pain_level between 0 and 10),
  rom_note text,
  created_at timestamptz default now()
);

-- 4. Streaks
create table mobility_streaks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) unique,
  current_streak int default 0,
  longest_streak int default 0,
  total_sessions int default 0,
  last_session_date date,
  updated_at timestamptz default now()
);

-- RLS policies
alter table mobility_exercises enable row level security;
alter table mobility_sessions enable row level security;
alter table mobility_session_entries enable row level security;
alter table mobility_streaks enable row level security;

-- Exercises: readable by all authenticated users
create policy "Exercises are readable by authenticated users"
  on mobility_exercises for select
  to authenticated
  using (true);

-- Sessions: users own their sessions
create policy "Users can CRUD own sessions"
  on mobility_sessions for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Session entries: accessible via session ownership
create policy "Users can CRUD own session entries"
  on mobility_session_entries for all
  to authenticated
  using (
    exists (
      select 1 from mobility_sessions
      where mobility_sessions.id = mobility_session_entries.session_id
        and mobility_sessions.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from mobility_sessions
      where mobility_sessions.id = mobility_session_entries.session_id
        and mobility_sessions.user_id = auth.uid()
    )
  );

-- Streaks: users own their streaks
create policy "Users can CRUD own streaks"
  on mobility_streaks for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Seed exercises

-- PRE-TRAINING (11 min)
insert into mobility_exercises (name, name_fr, category, routine_type, phase_order, default_sets, default_reps, default_hold_sec, is_bilateral, cue_pourquoi, cue_comment, cue_focus, grappling_why, video_search_term) values
('Cat-Cow', 'Cat-Cow', 'spine_wakeup', 'pre', 1, 1, '5-6 cycles', null, false,
 'Lubrification intervertébrale. Max 7-8 cycles (McGill).',
 'Inspirer en extension, expirer en flexion. Mouvement lent et contrôlé.',
 'Sentir chaque segment vertébral bouger indépendamment.',
 'Prep colonne pour rotations au sol.',
 'cat cow spine mobility'),

('Dead Bugs', 'Dead Bugs', 'spine_wakeup', 'pre', 2, 1, '8 reps', null, true,
 'Anti-extension : transverse + obliques activés.',
 'Dos plaqué au sol. Bras et jambe opposés descendent lentement.',
 'Zéro mouvement lombaire. Le core ne bouge pas.',
 'Simule rétention de guard (core rigide, membres mobiles).',
 'dead bug exercise form'),

('Standing Hip CARs', 'Standing Hip CARs', 'hip_mobility', 'pre', 3, 1, '3-5 cercles', null, true,
 'Maintien ROM, liquide synovial, auto-évaluation.',
 'Debout, un genou levé. Cercle le plus large possible sans compenser.',
 'Chercher le plus grand cercle possible. Noter les points de friction.',
 'Dextérité des jambes en guard.',
 'hip CARs controlled articular rotations'),

('90/90 Hip Switches', '90/90 Hip Switches', 'hip_mobility', 'pre', 4, 1, '8-10 transitions', null, false,
 'Rotation interne + externe simultanée.',
 'Assis, les deux genoux à 90°. Basculer d''un côté à l''autre.',
 'Les genoux touchent le sol à chaque transition.',
 'Guard retention, sweeps, leg locks.',
 '90 90 hip switch mobility'),

('Adductor Rock-Back', 'Adductor Rock-Back', 'hip_mobility', 'pre', 5, 2, '8-10 reps', null, true,
 'Adducteurs souvent négligés mais très chargés.',
 'À quatre pattes, une jambe tendue sur le côté. Reculer les hanches.',
 'Garder le dos neutre. Sentir l''étirement intérieur de cuisse.',
 'Closed guard squeeze, half guard hooks, sprawl.',
 'adductor rock back stretch'),

('Quadruped T-Spine Rotation', 'Rotation T-Spine Quadrupède', 'multi_joint', 'pre', 6, 1, '8-10 reps', null, true,
 'Rotation thoracique décharge les lombaires.',
 'À quatre pattes, main derrière la tête. Rotation vers le ciel.',
 'Rotation uniquement thoracique. Les hanches ne bougent pas.',
 'Framing, underhooks, crossface defense.',
 'quadruped thoracic rotation'),

('World''s Greatest Stretch', 'World''s Greatest Stretch', 'multi_joint', 'pre', 7, 1, '5 reps', null, true,
 '5 zones en 1 mouvement.',
 'Fente avant, coude vers le sol, puis rotation bras vers le ciel.',
 'Chaque rep doit être meilleure que la précédente.',
 'Fléchisseurs, adducteurs, thoracique, ischios, cheville.',
 'worlds greatest stretch exercise'),

('Cossack Squat Transitions', 'Transitions Cossack Squat', 'multi_joint', 'pre', 8, 1, '5-6 reps', null, true,
 'Plan frontal sous-entraîné mais critique.',
 'Squat latéral profond, transition d''un côté à l''autre.',
 'Talon au sol, poitrine haute. Contrôler la descente.',
 'Shrimping, guard passing, scrambles latéraux.',
 'cossack squat transition mobility'),

('Walking Spiderman + Reach', 'Walking Spiderman + Reach', 'dynamic_prep', 'pre', 9, 1, '5-6 reps', null, true,
 'Chaîne cinétique complète, monte le cardio.',
 'Fente avant marchée, rotation thoracique, bras vers le ciel.',
 'Transition fluide. C''est l''échauffement final avant le training.',
 'Transition mobilité → entraînement.',
 'walking spiderman reach exercise');

-- POST-TRAINING (12-15 min)
insert into mobility_exercises (name, name_fr, category, routine_type, phase_order, default_sets, default_reps, default_hold_sec, is_bilateral, cue_pourquoi, cue_comment, cue_focus, grappling_why, video_search_term) values
('Half-Kneeling Hip Flexor + PPT', 'Hip Flexor Half-Kneeling + PPT', 'static_stretch', 'post', 1, 2, null, 45, true,
 'Combat le tilt antérieur (guard, seated).',
 'Genou arrière au sol, serrer le fessier, basculer le bassin (PPT).',
 'Le stretch vient du bassin, pas en poussant vers l''avant.',
 'Combat tilt antérieur (guard, seated).',
 'half kneeling hip flexor stretch PPT'),

('Couch Stretch', 'Couch Stretch', 'static_stretch', 'post', 2, 2, null, 45, true,
 'Rectus femoris spécifique.',
 'Pied arrière contre un mur/canapé, fente avant.',
 'Contracter le fessier. Si c''est trop intense, reculer du mur.',
 'Rectus femoris spécifique.',
 'couch stretch quad hip flexor'),

('90/90 Static Hold', '90/90 Hold Statique', 'static_stretch', 'post', 3, 1, null, 45, true,
 'ER + IR, plus safe que pigeon sous fatigue.',
 'Position 90/90, se pencher vers la jambe avant.',
 'Respirer profondément. Laisser la gravité faire le travail.',
 'ER + IR, plus safe que pigeon sous fatigue.',
 '90 90 static hold hip stretch'),

('Supine Spinal Twist', 'Twist Spinal Couché', 'static_stretch', 'post', 4, 1, null, 50, true,
 'Décompression thoracolombaire.',
 'Sur le dos, genoux d''un côté, bras ouverts.',
 'Épaules au sol. Laisser la gravité tourner le tronc.',
 'Décompression thoracolombaire.',
 'supine spinal twist stretch'),

('Child''s Pose + Lat Stretch', 'Child''s Pose + Stretch Lats', 'static_stretch', 'post', 5, 1, null, 40, true,
 'Lats → fascia thoracolombaire.',
 'Position enfant, mains loin devant, puis décaler vers un côté.',
 'Allonger les bras au maximum. Sentir le stretch latéral.',
 'Lats → fascia thoracolombaire.',
 'childs pose lat stretch'),

('Supine Hamstring PNF', 'PNF Ischios Couché', 'static_stretch', 'post', 6, 1, '3-5 cycles', null, true,
 '+10-15% ROM vs statique. Open guard.',
 'Jambe levée avec sangle. Contract-relax : pousser 5s, relâcher, tirer plus loin.',
 'Le gain se fait sur le relâchement post-contraction.',
 '+10-15% ROM vs statique. Open guard.',
 'PNF hamstring stretch supine'),

('Dead Hang', 'Dead Hang', 'decompression', 'post', 7, 3, null, 45, false,
 'Traction axiale, réhydratation discale, grip no-gi.',
 'Prise pronation, épaules actives (légère dépression scapulaire).',
 'Se laisser aller. Respirer. Sentir la colonne s''allonger.',
 'Traction axiale, réhydratation discale, grip no-gi.',
 'dead hang decompression'),

('90/90 Breathing', 'Respiration 90/90', 'breathing', 'post', 8, 1, '5-10 cycles', null, false,
 'Nerf vague, shift parasympathique.',
 'Sur le dos, jambes sur une chaise (hanches et genoux à 90°). Inspirer 4s, expirer 8s.',
 'Expiration longue. Sentir le rythme cardiaque ralentir.',
 'Nerf vague, shift parasympathique.',
 '90 90 breathing parasympathetic');

-- MORNING (2.5 min)
insert into mobility_exercises (name, name_fr, category, routine_type, phase_order, default_sets, default_reps, default_hold_sec, is_bilateral, cue_pourquoi, cue_comment, cue_focus, grappling_why, video_search_term) values
('Supine Pelvic Tilts', 'Bascules Pelviennes Couchées', 'spine_wakeup', 'morning', 1, 1, '10 reps', null, false,
 'Réveiller le bassin et les lombaires en douceur.',
 'Sur le dos, genoux pliés. Basculer le bassin avant/arrière.',
 'Mouvement minimal, contrôle maximal.',
 'Contrôle pelvien pour le guard.',
 'supine pelvic tilts morning'),

('Single-Leg Knee-to-Chest', 'Genou-Poitrine Unilatéral', 'spine_wakeup', 'morning', 2, 1, '10s', 10, true,
 'Étirement lombaire + fléchisseur de hanche.',
 'Tirer un genou vers la poitrine, l''autre jambe tendue au sol.',
 'Garder le bas du dos au sol.',
 'Flexion de hanche pour guard.',
 'single leg knee to chest stretch'),

('Cat-Cow', 'Cat-Cow', 'spine_wakeup', 'morning', 3, 1, '5-8 cycles', null, false,
 'Lubrification intervertébrale matinale.',
 'Inspirer en extension, expirer en flexion.',
 'Lent et contrôlé. Réveiller la colonne.',
 'Prep colonne pour la journée.',
 'cat cow morning routine'),

('Sidelying Open Books', 'Open Books Latéral', 'multi_joint', 'morning', 4, 1, '5 reps', null, true,
 'Rotation thoracique douce au réveil.',
 'Sur le côté, genoux empilés. Ouvrir le bras du dessus vers l''arrière.',
 'Suivre la main du regard. Ne pas forcer.',
 'Rotation thoracique pour frames et underhooks.',
 'sidelying open book thoracic'),

('Child''s Pose + Breathing', 'Child''s Pose + Respiration', 'breathing', 'morning', 5, 1, null, 30, false,
 'Étirement dos + activation parasympathique.',
 'Position enfant, front au sol, respiration ventrale.',
 '5 respirations profondes. Intention pour la journée.',
 'Calme et focus avant la journée.',
 'childs pose breathing morning');
