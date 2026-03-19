-- Seed data : Principles et Drills pour Side Control
-- Remplacer 'YOUR_USER_ID' par ton UUID utilisateur Supabase
-- Tu peux le trouver dans Supabase > Authentication > Users

-- ========== PRINCIPLES ==========

INSERT INTO public.techniques (user_id, name, position, action_type, maturity, key_points, video_url)
VALUES
  ('YOUR_USER_ID', 'Frames : structures osseuses', 'Side Control', 'principle', 'drilled',
   '- Avant-bras = poutre rigide entre toi et lui
- Frame 1 near-side : cou/epaule, angle diagonal
- Frame 2 far-side : hanche adverse, 10-15cm espace
- Coudes colles au corps
- Si tu trembles = tu pousses, repositionne angle
- Os encaissent, pas muscles',
   'https://www.youtube.com/watch?v=cuXq-k__9lQ'),

  ('YOUR_USER_ID', 'Rotation de hanche : flat vs hip', 'Side Control', 'principle', 'drilled',
   '- Tourner sur hanche cote adversaire (vers lui, jamais en fuyant)
- Reduit surface de contact de 50%
- Reactive les jambes (genou peut s''inserer)
- Cree une direction d''echappee
- Execution : pied a plat, pousse, bascule 30-45 deg
- Toujours APRES les frames',
   NULL),

  ('YOUR_USER_ID', 'Timing explosion : transition windows', 'Side Control', 'principle', 'seen',
   '- Ne jamais exploser quand il est stable
- Attendre sa transition : mount, KOB, changement de grip
- 0.5s de vide = fenetre echappee
- Un pont sans intention = energie gaspillee
- Rate? Reset a frames, pas de panique',
   NULL),

  ('YOUR_USER_ID', 'Gestion energie : banque vs depense', 'Side Control', 'principle', 'seen',
   '- Frames = 0 effort (structurel)
- Hanche = faible effort (ajustement)
- Attente = 0 effort (recuperation)
- Explosion = max effort, 1-2 sec
- Chaque position est soit banque soit depense
- Pression = force / surface (principe physique cle)',
   NULL);

-- ========== DRILLS ==========

INSERT INTO public.techniques (user_id, name, position, action_type, maturity, key_points)
VALUES
  ('YOUR_USER_ID', 'Test frames yeux fermes', 'Side Control', 'drill', 'seen',
   '- Partenaire en side control sur toi
- Pose frames, ferme les yeux
- Tu contractes fort? = tu pousses
- Ajuste angle jusqu''a etre relax dans les bras
- C''est le bon angle quand tu ne trembles plus'),

  ('YOUR_USER_ID', 'Shrimp chain 3 reps', 'Side Control', 'drill', 'seen',
   '- Partenaire suit en top
- 3 shrimps consecutifs sans pause
- Si pas sorti au 3e, reset frames + recommence
- Objectif : fluidite, pas force'),

  ('YOUR_USER_ID', 'Escape chain linking', 'Side Control', 'drill', 'seen',
   '- Partenaire resiste activement
- Shrimp > (bloque) > bridge and roll > (bloque) > underhook
- Enchainer sans temps mort, lire la reaction
- Ref : Lachlan Giles linking 4 side control escapes');
