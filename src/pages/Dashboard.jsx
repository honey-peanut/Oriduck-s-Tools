import { useState, useRef } from 'react'
import { useLoadingNavigate } from '../hooks/useLoadingNavigate'
import './Dashboard.css'

const TOOLS = [
  { id: 1,  title: '카멜 케이스 변환기', desc: '언더바 대문자 조합으로 된 단어를 카멜 케이스로 변환합니다.', path: '/tools/camel-case' },
  { id: 2,  title: '예시',              desc: '개발중입니다...', path: null },
  { id: 3,  title: '예시',              desc: '개발중입니다...', path: null },
  { id: 4,  title: '예시',              desc: '개발중입니다...', path: null },
  { id: 5,  title: '예시',              desc: '개발중입니다...', path: null },
  { id: 6,  title: '예시',              desc: '개발중입니다...', path: null },
  { id: 7,  title: '예시',              desc: '개발중입니다...', path: null },
  { id: 8,  title: '예시',              desc: '개발중입니다...', path: null },
  { id: 9,  title: '예시',              desc: '개발중입니다...', path: null },
  { id: 10, title: '예시',              desc: '개발중입니다...', path: null },
]

const CARD_WIDTH = 280
const STEP = CARD_WIDTH * 0.5
const MOMENTUM_WINDOW_MS = 120
const MOMENTUM_FACTOR = 180
const MAX_MOMENTUM_STEPS = 4

export default function Dashboard() {
  const navigate = useLoadingNavigate()
  const [active, setActive] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [dragDelta, setDragDelta] = useState(0)
  const dragStartX = useRef(null)
  const startActive = useRef(0)
  const velocityTracker = useRef([])
  const hasDragged = useRef(false)

  const onMouseDown = (e) => {
    dragStartX.current = e.clientX
    startActive.current = active
    setIsDragging(true)
    setDragDelta(0)
    velocityTracker.current = [{ x: e.clientX, t: Date.now() }]
    hasDragged.current = false
  }

  const onMouseMove = (e) => {
    if (!isDragging) return
    const delta = e.clientX - dragStartX.current
    if (Math.abs(delta) > 5) hasDragged.current = true
    setDragDelta(delta)
    const now = Date.now()
    velocityTracker.current.push({ x: e.clientX, t: now })
    velocityTracker.current = velocityTracker.current.filter(p => now - p.t < MOMENTUM_WINDOW_MS)
  }

  const commit = () => {
    if (!isDragging) return

    const tracker = velocityTracker.current
    let momentumSteps = 0
    if (hasDragged.current && tracker.length >= 2) {
      const last = tracker[tracker.length - 1]
      const first = tracker[0]
      const dt = last.t - first.t
      if (dt > 0) {
        const velocity = (last.x - first.x) / dt
        momentumSteps = Math.round(-velocity * MOMENTUM_FACTOR / STEP)
        momentumSteps = Math.max(-MAX_MOMENTUM_STEPS, Math.min(MAX_MOMENTUM_STEPS, momentumSteps))
      }
    }

    const baseSteps = -Math.round(dragDelta / STEP)
    const totalSteps = baseSteps + momentumSteps
    setActive(Math.max(0, Math.min(TOOLS.length - 1, startActive.current + totalSteps)))
    setIsDragging(false)
    setDragDelta(0)
    dragStartX.current = null
  }

  const onCardClick = (i) => {
    if (hasDragged.current) return
    setActive(i)
  }

  const liveSteps = isDragging ? -Math.round(dragDelta / STEP) : 0
  const liveActive = isDragging
    ? Math.max(0, Math.min(TOOLS.length - 1, startActive.current + liveSteps))
    : active
  const remainder = isDragging ? dragDelta + liveSteps * STEP : 0

  return (
    <div className="dashboard">
      <button className="home-btn" onClick={() => navigate('/')} title="홈">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
          <polyline points="9 21 9 12 15 12 15 21" />
        </svg>
      </button>
      <div className="dashboard-main">
        <h1 className="dashboard-title">어떤 도구를 사용하시나요?</h1>

        <div
          className="carousel"
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={commit}
          onMouseLeave={commit}
          style={{ userSelect: 'none' }}
        >
          {TOOLS.map((tool, i) => {
            const offset = i - liveActive
            const abs = Math.abs(offset)
            const x = offset * STEP + remainder
            const scale = 1 - abs * 0.06

            return (
              <div
                key={tool.id}
                className={`card ${offset === 0 ? 'card-active' : ''}`}
                onClick={() => onCardClick(i)}
                style={{
                  transform: `translateY(-50%) translateX(${x}px) scale(${scale})`,
                  zIndex: TOOLS.length - abs,
                  transition: isDragging ? 'none' : 'transform 0.45s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: offset !== 0 ? 'pointer' : 'default',
                }}
              >
                <span className="card-number">{String(tool.id).padStart(2, '0')}</span>
                <h2 className="card-title">{tool.title}</h2>
                <p className="card-desc">{tool.desc}</p>
                <button
                  className={`card-btn ${offset === 0 ? 'card-btn-active' : ''}`}
                  disabled={offset !== 0}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (tool.path) navigate(tool.path)
                  }}
                >
                  이 도구 사용해보기
                </button>
              </div>
            )
          })}
        </div>

      </div>
    </div>
  )
}