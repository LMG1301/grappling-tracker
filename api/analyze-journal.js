// Vercel serverless function : POST /api/analyze-journal
// Recoit un tableau d'entrees du journal et renvoie une synthese
// reflexive generee par Claude Opus 4.7. La cle API reste cote serveur
// (variable d'env ANTHROPIC_API_KEY) et n'est jamais exposee au client.

import Anthropic from '@anthropic-ai/sdk'

export const config = {
  // Les appels Claude peuvent prendre 10-30s, on releve le timeout par defaut.
  maxDuration: 60,
}

const SYSTEM_PROMPT = `Tu es un miroir reflexif pour un pratiquant de grappling et MMA qui tient un journal d'entrainement. Tu lis les entrees qu'il a selectionnees et tu lui renvoies une synthese qui l'aide a voir ce qu'il ne peut pas voir lui-meme.

Posture stricte :

Tu n'es PAS un coach. Pas de conseils techniques, pas de "tu devrais", pas de plan d'action.
Tu es un observateur exterieur qui repere les patterns invisibles a l'auteur.
Tu identifies : les repetitions, les contradictions, les evitements (sujets mentionnes de loin mais jamais frontalement), les angles morts, les obsessions.
Tu poses des questions ouvertes plutot que des affirmations directives.
Tu refletes sans juger.

Format :

Texte libre, structure naturelle adaptee au contenu lu.
Pas de listes a puces sauf si vraiment necessaire.
Ton neutre, soutenu, jamais familier.
Longueur : 300-500 mots maximum.
Francais.

Ce que tu cherches en priorite :

Les patterns recurrents que l'auteur n'a probablement pas conscience de repeter
Les contradictions internes (dire une chose, decrire un comportement qui va dans l'autre sens)
Les evitements (sujets effleures sans jamais etre traites frontalement)
Les evolutions silencieuses (ce qui change progressivement sans etre remarque)
Les zones aveugles (ce dont l'auteur ne parle jamais alors que ca semble pertinent)

Tu commences directement par tes observations, sans formule de politesse, sans preambule.`

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({
      error:
        'ANTHROPIC_API_KEY non configuree. Ajoute-la dans Vercel > Settings > Environment Variables.',
    })
  }

  try {
    const body = req.body || {}
    const entries = Array.isArray(body.entries) ? body.entries : null
    if (!entries || entries.length === 0) {
      return res.status(400).json({ error: 'entries (tableau) est requis' })
    }
    if (entries.length > 100) {
      return res
        .status(400)
        .json({ error: 'Trop d\'entrees (max 100 par appel)' })
    }

    const userContent = entries
      .map((e) => `[${e.date || 'date inconnue'}]\n${(e.content || '').trim()}`)
      .join('\n\n---\n\n')

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const message = await client.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 2000,
      thinking: { type: 'adaptive' },
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userContent }],
    })

    const text = (message.content || [])
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim()

    if (!text) {
      return res.status(502).json({ error: 'Reponse vide du modele' })
    }

    const tokens =
      (message.usage?.input_tokens || 0) +
      (message.usage?.output_tokens || 0) +
      (message.usage?.cache_read_input_tokens || 0)

    return res.status(200).json({
      synthesis: text,
      tokens,
      model: message.model || 'claude-opus-4-7',
    })
  } catch (err) {
    console.error('analyze-journal error:', err)
    const status = err?.status || 500
    const message = err?.message || 'Erreur interne'
    return res.status(status).json({ error: message })
  }
}
