import './App.css'
import{ useEffect, useState } from 'react'

type Option = { id: string; label: string; emoji: string }

const OPTIONS: Option[] = [
  { id: 'cat', label: 'Cat', emoji: '🐱' },
  { id: 'dog', label: 'Dog', emoji: '🐶' },
]

// API base URL - update this to match your backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

function App() {
  const [selected, setSelected] = useState<string>(OPTIONS[0].id)
  const [counts, setCounts] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('votes')
      return saved ? JSON.parse(saved) : OPTIONS.reduce((a, o) => ({ ...a, [o.id]: 0 }), {})
    } catch {
      return OPTIONS.reduce((a, o) => ({ ...a, [o.id]: 0 }), {})
    }
  })
  const [voted, setVoted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      localStorage.setItem('votes', JSON.stringify(counts))
    } catch {}
  }, [counts])

  const handleVote = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/votes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ choice: selected }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to record vote')
      }

      // Update local counts after successful vote
      setCounts((prev) => ({ ...prev, [selected]: (prev[selected] || 0) + 1 }))
      setVoted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record vote')
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    localStorage.removeItem('votes')
    setCounts(OPTIONS.reduce((a, o) => ({ ...a, [o.id]: 0 }), {}))
    setVoted(false)
  }

  return (
    <div className="app">
      <header className="hero">
        <div className="hero-inner">
          <h1>Voting Client</h1>
          <p className="subtitle">Choose your favorite and make it count.</p>
        </div>
      </header>

      <main className="container">
        <section className="card vote-card" aria-labelledby="vote-heading">
          <h2 id="vote-heading">Cast your vote</h2>
          <p className="help">Tap an option to select it, then press <strong>Vote</strong>.</p>
          <div className="vote-inner">
            <div className="options" role="list">
            {OPTIONS.map((opt) => (
              <button
                key={opt.id}
                className={`option-btn ${selected === opt.id ? 'selected' : ''}`}
                onClick={() => setSelected(opt.id)}
                role="listitem"
                aria-pressed={selected === opt.id}
                title={opt.label}
                disabled={loading}
              >
                <span className="emoji" aria-hidden>{opt.emoji}</span>
                <span className="label">{opt.label}</span>
              </button>
            ))}
            </div>

            <div className="actions">
              <button 
                className="vote-btn" 
                onClick={handleVote} 
                disabled={loading}
                aria-label={`Vote for ${selected}`}
              >
                {loading ? 'Voting...' : 'Vote'}
              </button>
              <button className="reset-btn" onClick={reset} aria-hidden={!voted}>
                Reset
              </button>
            </div>

            {error && <div className="error" role="alert" aria-live="assertive">{error}</div>}
            {voted && <div className="confirm" role="status" aria-live="polite">Thanks — your vote was recorded.</div>}
          </div>
        </section>

        {/* Results intentionally omitted here — only voting UI is shown */}
      </main>
    </div>
  )
}

export default App
