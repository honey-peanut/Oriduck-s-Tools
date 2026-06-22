import { useState, useRef, useEffect, Fragment } from 'react'
import { useLoadingNavigate } from '../hooks/useLoadingNavigate'
import './Dashboard.css'

const TOOLS = [
  { id: 1,  title: '카멜 케이스 변환', desc: '대문자 언더바 조합으로 구성된 컬럼명을 컴포넌트 명으로 사용하기 위한 카멜 케이스로 변환합니다.', path: '/tools/camel-case' },
  { id: 2,  title: '이미지 PDF 변환', desc: '여러 이미지를 합쳐 하나의 PDF파일로 변환합니다.', path: '/tools/image-to-pdf' },
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
const CARD_HEIGHT = 320
const HOVER_LIFT = 64 // 호버 시 카드가 위로 떠오르는 양(px)
const STEP = CARD_WIDTH * 0.33 // 카드 간격(작을수록 더 뭉쳐 보임)
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
  const [dragBase, setDragBase] = useState(0) // 드래그 시작 시점의 위치(렌더가 의존하므로 state)

  const dragStartX = useRef(null)
  const velocityTracker = useRef([])
  const hasDragged = useRef(false)
  const pointerDown = useRef(false) // 눌린 상태(아직 드래그로 확정 안 됨)
  const rafRef = useRef(null)
  const posRef = useRef(0)
  useEffect(() => {
    posRef.current = pos
  }, [pos])

  // 카드 "위로 뽑힘" 후 페이지 이동
  const [launchId, setLaunchId] = useState(null)
  // 선택되지 않은 카드 호버 시 살짝 떠오름
  const [hovered, setHovered] = useState(null)

  // 진입 시: 첫 카드만 중앙에 보이다가(hold) → 우측으로 주르륵 흩어짐 (spread 0 → 1)
  const [spread, setSpread] = useState(0)
  useEffect(() => {
    const HOLD = 650 // 첫 카드만 보이며 머무는 시간(ms)
    const DUR = 1150 // 흩어지는 시간(ms)
    const start = performance.now()
    let raf
    const tick = (now) => {
      const elapsed = now - start - HOLD
      if (elapsed < 0) {
        raf = requestAnimationFrame(tick)
        return
      }
      const t = Math.min(elapsed / DUR, 1)
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
    setDragBase(posRef.current)
    // 아직 isDragging/hovered를 건드리지 않는다: 움직이지 않으면 클릭으로 처리되어
    // 카드가 떠 있는 상태 그대로 클릭이 카드(zone)에 잡혀 페이지 이동된다.
    pointerDown.current = true
    setDragDelta(0)
    velocityTracker.current = [{ x: e.clientX, t: Date.now() }]
    hasDragged.current = false
  }

  const onMouseMove = (e) => {
    if (!pointerDown.current) return
    const delta = e.clientX - dragStartX.current
    // 5px 넘게 움직여야 비로소 '드래그'로 확정 → 그때 카드 떠오름 해제
    if (Math.abs(delta) > 5 && !hasDragged.current) {
      hasDragged.current = true
      setIsDragging(true)
      setHovered(null)
    }
    if (!hasDragged.current) return
    setDragDelta(delta)
    const now = Date.now()
    velocityTracker.current.push({ x: e.clientX, t: now })
    velocityTracker.current = velocityTracker.current.filter(p => now - p.t < MOMENTUM_WINDOW_MS)
  }

  const commit = () => {
    if (!pointerDown.current) return
    pointerDown.current = false

    // 움직이지 않았으면 단순 클릭 → 캐러셀 이동 없이 종료(네비게이션은 onClick)
    if (!hasDragged.current) {
      setIsDragging(false)
      dragStartX.current = null
      return
    }

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
    const desired = dragBase + (-dragDelta / STEP)
    const fromPos = rubberBand(desired, max) // 손을 뗀 실제 위치(고무줄 포함)
    const target = Math.round(desired) + momentumSteps
    setIsDragging(false)
    setDragDelta(0)
    dragStartX.current = null
    animateTo(fromPos, target)
  }

  const onCardClick = (i) => {
    if (hasDragged.current) return
    const centered = Math.round(posRef.current) // 현재 가운데(선택된) 카드
    if (i === centered) {
      // 이미 가운데 카드 → 페이지 이동(카드 뽑기 애니메이션)
      const tool = TOOLS[i]
      if (tool.path && !launchId) setLaunchId(tool.id)
    } else {
      // 멀리 있는 카드 → 가운데로 이동
      animateTo(posRef.current, i)
    }
  }

  const max = TOOLS.length - 1
  const desired = dragBase + (-dragDelta / STEP)
  // 드래그 중엔 손가락을 따라(고무줄), 그 외엔 애니메이션되는 연속 위치
  const livePos = isDragging ? rubberBand(desired, max) : pos
  // 선택 강조 = 실제 위치에서 가장 가까운(=중앙) 카드
  const activeIndex = Math.max(0, Math.min(max, Math.round(livePos)))
  // 카드 내용(제목·설명) 페이드인.
  // spread는 easeOutCubic이라 시간상 일찍 1에 근접 → spread 기준으로 하면 글자가
  // 너무 빨리 다 보임. easeOutCubic을 역산해 '실제 진행 시간(t)'을 구하고,
  // 그 마지막 40% 시간 구간에만 나타나 펼침이 끝나는 순간 딱 완전히 보이게 한다.
  const spreadT = spread >= 1 ? 1 : 1 - Math.cbrt(1 - spread)
  const contentReveal = Math.max(0, Math.min(1, (spreadT - 0.6) / 0.4))

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
          // 처음 카드가 펼쳐지는 동안(spread<1)은 호버·클릭·드래그를 막아
          // 저사양에서의 렉을 줄인다. 펼침이 끝나면(spread===1) 다시 활성화.
          style={{ userSelect: 'none', pointerEvents: spread < 1 ? 'none' : undefined }}
        >
          {TOOLS.map((tool, i) => {
            const offset = i - livePos
            const abs = Math.abs(offset)
            const x = offset * STEP * spread
            const isActiveCard = i === activeIndex
            // 이동이 모두 끝난 뒤 선택된 카드만 살짝 앞으로 나오듯 커짐
            const popped = isActiveCard && settled && !isDragging
            // 선택 안 된 카드에 호버 → 위로 살짝 떠올라 제목 노출
            const hoverLift = hovered === i && !isActiveCard && settled && !isDragging
            const scale = 1 - abs * 0.04 + (popped ? 0.06 : 0)
            const liftY = hoverLift ? -HOVER_LIFT : 0

            // 인트로 펼침(spread<1) 동안엔 rAF가 매 프레임 transform을 직접 그리므로
            // CSS 트랜지션을 끈다(기본 'none'). 둘이 겹치면 끝부분에서 끊겨 보임(훅훅).
            let cardTransition = 'none'
            if (spread >= 1 && !isDragging && popped) {
              cardTransition =
                'transform 0.32s cubic-bezier(0.34, 1.35, 0.64, 1), background 0.2s ease, border-color 0.2s ease'
            } else if (spread >= 1 && !isDragging && settled) {
              cardTransition =
                'transform 0.28s ease, background 0.2s ease, border-color 0.2s ease'
            }

            const baseZ = TOOLS.length - Math.round(abs)

            return (
              <Fragment key={tool.id}>
                <div
                  className={`card ${isActiveCard ? 'card-active' : ''}${
                    popped ? ' is-settled' : ''
                  }${hoverLift ? ' card-hover' : ''}${launchId === tool.id ? ' card-launch' : ''}`}
                  onMouseDown={onMouseDown}
                  onClick={() => onCardClick(i)}
                  onAnimationEnd={(e) => {
                    if (launchId === tool.id && e.animationName === 'cardLaunch') {
                      navigate(tool.path)
                    }
                  }}
                  style={{
                    transform: `translateY(-50%) translateY(${liftY}px) translateX(${x}px) scale(${scale})`,
                    '--card-x': `${x}px`,
                    zIndex: launchId === tool.id ? 100 : baseZ * 2,
                    transition: cardTransition,
                    cursor: isDragging ? 'grabbing' : 'grab',
                    // 떠오르는 카드는 클릭만 받고 호버는 zone이 담당 → 카드가 움직여도 깜빡임 없음
                    pointerEvents: isActiveCard ? 'auto' : 'none',
                  }}
                >
                  <h2 className="card-title" style={{ opacity: contentReveal }}>{tool.title}</h2>
                  <p className="card-desc" style={{ opacity: contentReveal }}>{tool.desc}</p>
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
                {!isActiveCard && (
                  // 카드의 "내려와 있는 원래 위치"에 고정된 호버/클릭 감지용 투명 div.
                  // 카드가 떠올라도 이 zone은 그대로 있어 호버가 유지되고, 더 앞쪽
                  // 카드의 zone(z-index ↑)이 뒤 카드의 zone을 덮어 간섭을 막는다.
                  // 호버 중에는 bottom은 그대로 두고 top만 카드가 올라간 만큼 위로
                  // 늘여(높이 ↑) 떠오른 카드 부분까지 덮어 클릭이 되게 한다.
                  <div
                    className="card-zone"
                    onMouseDown={onMouseDown}
                    onClick={() => onCardClick(i)}
                    onMouseEnter={() => setHovered(i)}
                    onMouseLeave={() => setHovered((h) => (h === i ? null : h))}
                    style={{
                      transform: hoverLift
                        ? `translateY(-50%) translateY(${-HOVER_LIFT / 2}px) translateX(${x}px) scale(${scale})`
                        : `translateY(-50%) translateX(${x}px) scale(${scale})`,
                      height: hoverLift ? `${CARD_HEIGHT + HOVER_LIFT / scale}px` : undefined,
                      zIndex: baseZ * 2 + 1,
                      cursor: isDragging ? 'grabbing' : 'grab',
                    }}
                  />
                )}
              </Fragment>
            )
          })}
        </div>

      </div>
    </div>
  )
}