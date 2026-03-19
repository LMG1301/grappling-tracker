import { useState } from 'react'
import { Bot, Send, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

const COACH_SYSTEM_PROMPT = `Tu es un coach de BJJ virtuel. Tu analyses les donnees d'entrainement d'un pratiquant et tu donnes des recommandations concretes.

PROFIL DU PRATIQUANT :
- 198cm, 96kg, longs segments (bras et jambes)
- Avantages naturels : guard (triangle, armbar a distance, lasso, DLR), underhook escapes
- Points faibles identifies : entree en clinch, defense wrestling
- Style : analytique, prefere comprendre les principes avant d'executer

REGLES DE RECOMMANDATION :
1. Maximum 3-5 items en focus a la fois. Ne jamais suggerer plus.
2. Si plus de 60% des techniques sont en "seen", recommander d'ancrer avant d'ajouter.
3. Quand une technique passe de "drilled" a "sparred", feliciter et suggerer le principe associe.
4. Quand le journal mentionne un echec repetitif, identifier le principe manquant (pas une nouvelle technique).
5. Adapter au gabarit : privilegier les techniques qui exploitent les longs segments.
6. Reponse courte : 5-8 lignes max, pas de blabla. Format : constat + recommandation + focus suggere.
7. Langue : francais.`

async function buildCoachContext(userId) {
  const { data: techniques } = await supabase
    .from('techniques')
    .select('name, action_type, position, maturity, is_focus, key_points')
    .eq('user_id', userId)

  const { data: journal } = await supabase
    .from('journal_entries')
    .select('entry_date, title, content, mood, techniques_worked')
    .eq('user_id', userId)
    .order('entry_date', { ascending: false })
    .limit(10)

  const techs = techniques || []
  const entries = journal || []

  const maturityStats = {
    seen: techs.filter((t) => t.maturity === 'seen').length,
    drilled: techs.filter((t) => t.maturity === 'drilled').length,
    sparred: techs.filter((t) => t.maturity === 'sparred').length,
    reliable: techs.filter((t) => t.maturity === 'reliable').length,
  }

  const focus = techs.filter((t) => t.is_focus).map((t) => t.name)

  return { techniques: techs, journal: entries, maturityStats, focus }
}

async function askCoach(context, userQuestion = '') {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('Cle API Anthropic non configuree. Ajoute VITE_ANTHROPIC_API_KEY dans ton .env')
  }

  const userContent = `
DONNEES ACTUELLES :
- ${context.techniques.length} techniques au total
- Maturite : ${context.maturityStats.seen} vu, ${context.maturityStats.drilled} drill, ${context.maturityStats.sparred} spar, ${context.maturityStats.reliable} fiable
- Focus actuel : ${context.focus.length > 0 ? context.focus.join(', ') : 'aucun'}

TECHNIQUES PAR POSITION :
${Object.entries(
    context.techniques.reduce((acc, t) => {
      if (!acc[t.position]) acc[t.position] = []
      acc[t.position].push(`${t.name} (${t.action_type}, ${t.maturity || 'seen'})`)
      return acc
    }, {})
  )
    .map(([pos, techs]) => `${pos}: ${techs.join(', ')}`)
    .join('\n')}

JOURNAL RECENT :
${context.journal
    .map(
      (j) =>
        `[${j.entry_date}] ${j.mood || ''} - ${j.title || ''}: ${j.content?.substring(0, 200)}`
    )
    .join('\n') || '(aucune entree)'}

${userQuestion ? `QUESTION : ${userQuestion}` : 'Donne-moi mes recommandations pour cette semaine.'}
`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      system: COACH_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userContent }],
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Erreur API: ${response.status} - ${err}`)
  }

  const data = await response.json()
  return data.content[0].text
}

export default function CoachPage() {
  const { user } = useAuth()
  const [question, setQuestion] = useState('')
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleAsk(customQuestion = '') {
    if (!user) return
    setLoading(true)
    setError('')
    setResponse('')
    try {
      const context = await buildCoachContext(user.id)
      const answer = await askCoach(context, customQuestion)
      setResponse(answer)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!question.trim() && !loading) {
      handleAsk('')
    } else if (question.trim()) {
      handleAsk(question.trim())
    }
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* Header */}
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-dojo-accent/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <Bot className="w-8 h-8 text-dojo-accent" />
          </div>
          <h2 className="text-xl font-bold text-dojo-text">Coach IA</h2>
          <p className="text-sm text-dojo-muted mt-1">Analyse tes donnees et recommande ton focus</p>
        </div>

        {/* Quick action */}
        <button
          onClick={() => handleAsk('')}
          disabled={loading}
          className="w-full bg-dojo-accent hover:bg-dojo-accent-hover disabled:opacity-50 text-white font-medium py-4 rounded-xl transition-colors border-none text-base"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Analyse en cours...
            </span>
          ) : (
            'Recommandations de la semaine'
          )}
        </button>

        {/* Custom question */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Pose une question au coach..."
            className="flex-1 bg-dojo-surface border border-dojo-border rounded-xl px-4 py-3 text-dojo-text focus:outline-none focus:border-dojo-accent transition-colors"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="bg-dojo-accent hover:bg-dojo-accent-hover disabled:opacity-50 text-white px-4 py-3 rounded-xl transition-colors border-none"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Response */}
        {response && (
          <div className="bg-dojo-surface border border-dojo-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Bot className="w-5 h-5 text-dojo-accent" />
              <span className="text-sm font-semibold text-dojo-text">Coach</span>
            </div>
            <div className="text-dojo-text text-sm leading-relaxed whitespace-pre-wrap">
              {response}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
