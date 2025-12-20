import './App.css'
import React, { useEffect, useState } from 'react'

type Option = { id: string; label: string; emoji: string }

const OPTIONS: Option[] = [
  { id: 'cat', label: 'Cat', emoji: '🐱' },
  { id: 'dog', label: 'Dog', emoji: '🐶' },
]

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

  useEffect(() => {
    try {
      localStorage.setItem('votes', JSON.stringify(counts))
    } catch {}
  }, [counts])

  const total = Object.values(counts).reduce((a, b) => a + b, 0)

  const vote = () => {
    setCounts((prev) => ({ ...prev, [selected]: (prev[selected] || 0) + 1 }))
    setVoted(true)
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
              >
                <span className="emoji" aria-hidden>{opt.emoji}</span>
                <span className="label">{opt.label}</span>
              </button>
            ))}
            </div>

            <div className="actions">
              <button className="vote-btn" onClick={vote} aria-label={`Vote for ${selected}`}>
                Vote
              </button>
              <button className="reset-btn" onClick={reset} aria-hidden={!voted}>
                Reset
              </button>
            </div>

            {voted && <div className="confirm" role="status" aria-live="polite">Thanks — your vote was recorded.</div>}
          </div>
        </section>

        {/* Results intentionally omitted here — only voting UI is shown */}
      </main>
    </div>
  )
}

export default App
