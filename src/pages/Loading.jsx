import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import './Loading.css'

function Duck() {
  return (
    <svg className="duck-svg" viewBox="0 0 100 84" aria-hidden="true">
      <g fill="#ffffff">
        <ellipse cx="44" cy="54" rx="32" ry="22" />
        <path d="M16 50 L2 41 L20 60 Z" />
        <circle cx="70" cy="28" r="16" />
        <path d="M84 23 L100 30 L84 38 Z" />
      </g>
      <circle cx="73" cy="24" r="2.6" fill="#003194" />
    </svg>
  )
}

export default function Loading() {
  const navigate = useNavigate()
  const { state } = useLocation()

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate(state?.to ?? '/', { replace: true })
    }, 900)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="loading-page">
      <div className="loading-grid">
        {Array.from({ length: 27 }, (_, i) => {
          const n = i + 1
          return (
            <div key={i} className={`loading-piece piece-${n}`}>
              {n === 14 && <Duck />}
            </div>
          )
        })}
      </div>
    </div>
  )
}