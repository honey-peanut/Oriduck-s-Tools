import { useState, useRef, useEffect } from 'react'
import { useLoadingNavigate } from '../hooks/useLoadingNavigate'
import './Dashboard.css'

const TOOLS = [
  { id: 1,  title: '카멜 케이스 변환', desc: '언더바 대문자 조합으로 된 단어를 카멜 케이스로 변환합니다.', path: '/tools/camel-case' },
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
const RUBBER_LIMIT = 0.45 // 끝단을 넘어 드래그할 때 최대로 밀리는 양(스텝 단위)
const GLIDE_PER_CARD = 55 // 한 칸 지나가는 데 걸리는 시간(ms)
const GLIDE_MIN = 145 // 최소 이동 시간(ms)
const GLIDE_MAX = 560 // 최대 이동 시간(ms)

// 스마트폰식 고무줄: 경계를 넘는 만큼 점점 저항이 커져 아주 조금만 움직임
function rubberBand(desired, max) {
  if (desired < 0) {
    const x = -desired
    return -(RUBBER_LIMIT * x) / (x + RUBBER_LIMIT)
  }
  if (desired > max) {
    const x = desired - max
    return max + (RUBBER_LIMIT * x) / (x + RUBBER_LIMIT)
  }
  return desired
}

export default function Dashboard() {
  const navigate = useLoadingNavigate()
  const [pos, setPos] = useState(0) // 연속 위치(정수일 때 그 카드가 정중앙)
  const [isDragging, setIsDragging] = useState(false)
  const [dragDelta, setDragDelta] = useState(0)
  const [settled, setSettled] = useState(true) // 카드 이동 완료 여부

  const dragStartX = useRef(null)
  const startPos = useRef(0)
  const velocityTracker = useRef([])
  const hasDragged = useRef(false)
  const rafRef = useRef(null)
  const posRef = useRef(0)
  useEffect(() => {
    posRef.current = pos
  }, [pos])

  // 카드 "위로 뽑힘" 후 페이지 이동
  const [launchId, setLaunchId] = useState(null)

  // 진입 시: 중앙에 모여있던 카드들이 좌→우로 펼쳐짐 (spread 0 → 1)
  const [spread, setSpread] = useState(0)
  useEffect(() => {
    const DUR = 1100
    const start = performance.now()
    let raf
    const tick = (now) => {
      const t = Math.min((now - start) / DUR, 1)
      setSpread(1 - Math.pow(1 - t, 3)) // easeOutCubic
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  // 위치를 연속으로 애니메이션 → 거쳐가는 카드가 중앙에 올 때마다 선택됨
  const animateTo = (from, toRaw) => {
    const to = Math.max(0, Math.min(TOOLS.length - 1, toRaw))
    cancelAnimationFrame(rafRef.current)
    const dist = Math.abs(to - from)
    if (dist < 0.001) {
      setPos(to)
      setSettled(true)
      rafRef.current = null
      return
    }
    setSettled(false)
    setPos(from)
    const duration = Math.max(GLIDE_MIN, Math.min(GLIDE_MAX, dist * GLIDE_PER_CARD))
    const startT = performance.now()
    const tick = (now) => {
      const t = Math.min((now - startT) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3) // easeOutCubic
      setPos(from + (to - from) * eased)
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        setPos(to)
        setSettled(true)
        rafRef.current = null
      }
    }
    rafRef.current = requestAnimationFrame(tick)
  }

  useEffect(() => () => cancelAnimationFrame(rafRef.current), [])

  const onMouseDown = (e) => {
    cancelAnimationFrame(rafRef.current)
    rafRef.current = null
    dragStartX.current = e.clientX
    startPos.current = posRef.current
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

    const max = TOOLS.length - 1
    const desired = startPos.current + (-dragDelta / STEP)
    const fromPos = rubberBand(desired, max) // 손을 뗀 실제 위치(고무줄 포함)
    const target = Math.round(desired) + momentumSteps
    setIsDragging(false)
    setDragDelta(0)
    dragStartX.current = null
    animateTo(fromPos, target)
  }

  const onCardClick = (i) => {
    if (hasDragged.current) return
    animateTo(posRef.current, i)
  }

  const max = TOOLS.length - 1
  const desired = startPos.current + (-dragDelta / STEP)
  // 드래그 중엔 손가락을 따라(고무줄), 그 외엔 애니메이션되는 연속 위치
  const livePos = isDragging ? rubberBand(desired, max) : pos
  // 선택 강조 = 실제 위치에서 가장 가까운(=중앙) 카드
  const activeIndex = Math.max(0, Math.min(max, Math.round(livePos)))

  return (
    <div className="dashboard">
      <button className="home-btn" onClick={() => navigate('/')} title="홈">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
          <polyline points="9 21 9 12 15 12 15 21" />
        </svg>
        <span className="btn-label">홈</span>
      </button>
      <div className="dashboard-main">
        <h1 className="dashboard-title">어떤 기능이 필요하신가요?</h1>

        <div
          className="carousel"
          onMouseMove={onMouseMove}
          onMouseUp={commit}
          onMouseLeave={commit}
          style={{ userSelect: 'none' }}
        >
          {TOOLS.map((tool, i) => {
            const offset = i - livePos
            const abs = Math.abs(offset)
            const x = offset * STEP * spread
            const isActiveCard = i === activeIndex
            // 이동이 모두 끝난 뒤 선택된 카드만 살짝 앞으로 나오듯 커짐
            const popped = isActiveCard && settled && !isDragging
            const scale = 1 - abs * 0.06 + (popped ? 0.06 : 0)

            return (
              <div
                key={tool.id}
                className={`card ${isActiveCard ? 'card-active' : ''}${
                  popped ? ' is-settled' : ''
                }${launchId === tool.id ? ' card-launch' : ''}`}
                onMouseDown={onMouseDown}
                onClick={() => onCardClick(i)}
                onAnimationEnd={(e) => {
                  if (launchId === tool.id && e.animationName === 'cardLaunch') {
                    navigate(tool.path)
                  }
                }}
                style={{
                  transform: `translateY(-50%) translateX(${x}px) scale(${scale})`,
                  zIndex: launchId === tool.id ? 100 : TOOLS.length - Math.round(abs),
                  transition: popped
                    ? 'transform 0.32s cubic-bezier(0.34, 1.35, 0.64, 1)'
                    : 'none',
                  cursor: isDragging ? 'grabbing' : 'grab',
                }}
              >
                <h2 className="card-title">{tool.title}</h2>
                <p className="card-desc">{tool.desc}</p>
                <button
                  className="card-btn"
                  disabled={!isActiveCard}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (tool.path && !launchId) setLaunchId(tool.id)
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