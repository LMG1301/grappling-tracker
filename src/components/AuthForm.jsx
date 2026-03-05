import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { Shield } from 'lucide-react'

export default function AuthForm() {
  const { signIn, signUp } = useAuth()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    try {
      if (isSignUp) {
        await signUp(email, password)
        setMessage('Compte cree ! Verifie ton email pour confirmer.')
      } else {
        await signIn(email, password)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center px-4 bg-dojo-bg">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="text-5xl mb-4">🥋</div>
          <h1 className="text-2xl font-bold text-dojo-text">Grappling Tracker</h1>
          <p className="text-dojo-muted text-sm mt-1">Suivi de techniques BJJ</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-dojo-surface rounded-2xl p-6 space-y-4 border border-dojo-border">
          <h2 className="text-lg font-semibold text-center">
            {isSignUp ? 'Creer un compte' : 'Se connecter'}
          </h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
              {error}
            </div>
          )}
          {message && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-green-400 text-sm">
              {message}
            </div>
          )}

          <div>
            <label className="block text-sm text-dojo-muted mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-dojo-bg border border-dojo-border rounded-lg px-4 py-3 text-dojo-text focus:outline-none focus:border-dojo-accent transition-colors"
              placeholder="ton@email.com"
            />
          </div>

          <div>
            <label className="block text-sm text-dojo-muted mb-1">Mot de passe</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-dojo-bg border border-dojo-border rounded-lg px-4 py-3 text-dojo-text focus:outline-none focus:border-dojo-accent transition-colors"
              placeholder="Min. 6 caracteres"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-dojo-accent hover:bg-dojo-accent-hover disabled:opacity-50 text-white font-medium py-3 rounded-lg transition-colors"
          >
            {loading ? '...' : isSignUp ? "S'inscrire" : 'Se connecter'}
          </button>

          <p className="text-center text-sm text-dojo-muted">
            {isSignUp ? 'Deja un compte ?' : 'Pas de compte ?'}{' '}
            <button
              type="button"
              onClick={() => { setIsSignUp(!isSignUp); setError(''); setMessage('') }}
              className="text-dojo-accent hover:text-dojo-accent-hover transition-colors bg-transparent border-none p-0 font-medium"
            >
              {isSignUp ? 'Se connecter' : "S'inscrire"}
            </button>
          </p>
        </form>
      </div>
    </div>
  )
}
