import { AuthProvider, useAuth } from './hooks/useAuth'
import AuthForm from './components/AuthForm'
import Layout from './components/Layout'

function AppContent() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-dojo-bg">
        <div className="w-8 h-8 border-2 border-dojo-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return <AuthForm />

  return <Layout />
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
