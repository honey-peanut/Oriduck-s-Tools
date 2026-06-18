import { useState } from 'react'
import { useLoadingNavigate } from '../hooks/useLoadingNavigate'
import './CamelCase.css'

function toCamelCase(input) {
  return input
    .split('_')
    .filter(Boolean)
    .map((word, i) => {
      const lower = word.toLowerCase()
      return i === 0 ? lower : lower[0].toUpperCase() + lower.slice(1)
    })
    .join('')
}

function PinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="12" y1="17" x2="12" y2="22" />
      <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

const ALL_PREFIXES = [
  'btn_', 'cal_', 'chk_', 'cmb_', 'div_', 'edt_', 'grd_',
  'met_', 'rdo_', 'sch_', 'spn_', 'tar_', 'tit_',
]

function GripIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="9" cy="6" r="1.8" />
      <circle cx="9" cy="12" r="1.8" />
      <circle cx="9" cy="18" r="1.8" />
      <circle cx="15" cy="6" r="1.8" />
      <circle cx="15" cy="12" r="1.8" />
      <circle cx="15" cy="18" r="1.8" />
    </svg>
  )
}

function CopyField({ prefix, camel, action, copied, onCopy, leading, rowProps, dragging, extraClass }) {
  const value = camel ? prefix + camel : ''

  const copy = () => {
    if (!value) return
    navigator.clipboard?.writeText(value)
    onCopy()
  }

  return (
    <div className={`cc-item ${dragging ? 'is-dragging' : ''} ${extraClass || ''}`} {...rowProps}>
      {leading}
      <span className="cc-item-prefix">{prefix}</span>
      <button
        type="button"
        className="cc-field"
        onClick={copy}
        disabled={!value}
        title="클릭하여 복사"
      >
        {value || <span className="cc-field-empty">입력을 기다리는 중…</span>}
        {copied && value && <span className="cc-copied">Copied !</span>}
      </button>
      {action}
    </div>
  )
}

export default function CamelCase() {
  const navigate = useLoadingNavigate()
  const [input, setInput] = useState('')
  const [pinned, setPinned] = useState([])
  const [showAll, setShowAll] = useState(false)
  const [panelMounted, setPanelMounted] = useState(false)
  const [copiedId, setCopiedId] = useState(null)

  const togglePanel = () => {
    if (showAll) {
      setShowAll(false) // 닫힘: 퇴장 애니메이션 후 언마운트
    } else {
      setPanelMounted(true)
      setShowAll(true)
    }
  }

  const onPanelAnimEnd = () => {
    if (!showAll) setPanelMounted(false)
  }

  const camel = toCamelCase(input.trim())

  // 제거는 축소 애니메이션 후 실제 삭제 (exiting에 잠시 보관)
  const [exiting, setExiting] = useState([])

  const requestRemove = (prefix) => {
    setExiting((prev) => (prev.includes(prefix) ? prev : [...prev, prefix]))
  }

  const finalizeRemove = (prefix) => {
    setPinned((prev) => prev.filter((p) => p !== prefix))
    setExiting((prev) => prev.filter((p) => p !== prefix))
  }

  const togglePin = (prefix) => {
    if (pinned.includes(prefix)) {
      requestRemove(prefix) // 축소 애니메이션 후 제거
    } else {
      setPinned((prev) => [...prev, prefix]) // 마운트 시 확장 애니메이션
    }
  }

  // 고정 컴포넌트 드래그 순서 변경 (포인터 기반, 실시간 미리보기)
  const [drag, setDrag] = useState(null) // { index, dy, pitch }

  const startReorder = (e, index) => {
    e.preventDefault()
    const row = e.currentTarget.closest('.cc-item')
    const pitch = (row?.offsetHeight ?? 40) + 10 // 항목 높이 + 카드 gap
    const startY = e.clientY
    let dy = 0
    setDrag({ index, dy: 0, pitch })

    const move = (ev) => {
      dy = ev.clientY - startY
      setDrag({ index, dy, pitch })
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      setPinned((prev) => {
        const target = Math.max(0, Math.min(prev.length - 1, index + Math.round(dy / pitch)))
        if (target === index) return prev
        const next = [...prev]
        const [moved] = next.splice(index, 1)
        next.splice(target, 0, moved)
        return next
      })
      setDrag(null)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  const rowDragStyle = (i, count) => {
    if (!drag) return undefined
    const { index, dy, pitch } = drag
    if (i === index) {
      return { transform: `translateY(${dy}px)`, transition: 'none', zIndex: 5, position: 'relative' }
    }
    const target = Math.max(0, Math.min(count - 1, index + Math.round(dy / pitch)))
    let shift = 0
    if (index < target && i > index && i <= target) shift = -pitch
    else if (index > target && i < index && i >= target) shift = pitch
    return { transform: `translateY(${shift}px)`, transition: 'transform 0.18s ease' }
  }

  return (
    <div className="camelcase">
      <button className="back-btn" onClick={() => navigate('/dashboard')} title="뒤로">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M9 14 4 9l5-5" />
          <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H9" />
        </svg>
        <span className="btn-label">뒤로</span>
      </button>

      <h1 className="camelcase-title">카멜 케이스 변환기</h1>

      <div className={`cc-layout ${showAll ? 'cc-layout-open' : ''}`}>
        <div className="cc-cards">
          <section className="cc-card">
            <h2 className="cc-card-title">입력</h2>
            <input
              type="text"
              className="cc-input"
              placeholder="여기에 컬럼명을 입력하세요."
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
                setCopiedId(null)
              }}
              spellCheck={false}
            />
          </section>

          <section className="cc-card">
            <h2 className="cc-card-title">기본 컴포넌트</h2>
            <CopyField
              prefix="stt_"
              camel={camel}
              copied={copiedId === 'basic-stt_'}
              onCopy={() => setCopiedId('basic-stt_')}
            />
          </section>

          <section className="cc-card">
            <button
              type="button"
              className="cc-toggle"
              onClick={togglePanel}
              title={showAll ? '전체 컴포넌트 닫기' : '전체 컴포넌트 열기'}
              aria-label={showAll ? '전체 컴포넌트 닫기' : '전체 컴포넌트 열기'}
            >
              {showAll ? '−' : '+'}
            </button>
            <h2 className="cc-card-title">고정 컴포넌트</h2>
            {pinned.length === 0 ? (
              <p className="cc-empty">전체 컴포넌트에서 “고정”한 항목이 여기에 표시됩니다.</p>
            ) : (
              pinned.map((prefix, idx) => (
                <CopyField
                  key={prefix}
                  prefix={prefix}
                  camel={camel}
                  copied={copiedId === `pinned-${prefix}`}
                  onCopy={() => setCopiedId(`pinned-${prefix}`)}
                  dragging={drag?.index === idx}
                  extraClass={`cc-row ${exiting.includes(prefix) ? 'is-removing' : ''}`}
                  rowProps={{
                    style: rowDragStyle(idx, pinned.length),
                    onAnimationEnd: (e) => {
                      if (e.animationName === 'ccRowOut') finalizeRemove(prefix)
                    },
                  }}
                  leading={
                    <span
                      className="cc-drag-handle"
                      onPointerDown={(e) => startReorder(e, idx)}
                      title="드래그하여 순서 변경"
                    >
                      <GripIcon />
                    </span>
                  }
                  action={
                    <button
                      type="button"
                      className="cc-btn cc-btn-del"
                      onClick={() => requestRemove(prefix)}
                      title="고정 해제"
                      aria-label="삭제"
                    >
                      <XIcon />
                    </button>
                  }
                />
              ))
            )}
          </section>
        </div>

        {panelMounted && (
          <div
            className={`cc-panel ${showAll ? 'is-open' : 'is-closing'}`}
            onAnimationEnd={onPanelAnimEnd}
          >
            <div className="cc-cards cc-cards-right">
              <section className="cc-card">
                <h2 className="cc-card-title">전체 컴포넌트</h2>
              {ALL_PREFIXES.map((prefix) => {
                const isPinned = pinned.includes(prefix)
                return (
                  <CopyField
                    key={prefix}
                    prefix={prefix}
                    camel={camel}
                    copied={copiedId === `all-${prefix}`}
                    onCopy={() => setCopiedId(`all-${prefix}`)}
                    action={
                      <button
                        type="button"
                        className={`cc-btn cc-btn-pin ${isPinned ? 'cc-btn-pin-active' : ''}`}
                        onClick={() => togglePin(prefix)}
                        title={isPinned ? '고정됨 (클릭하여 해제)' : '고정 컴포넌트에 추가'}
                        aria-label={isPinned ? '고정 해제' : '고정'}
                      >
                        <PinIcon />
                      </button>
                    }
                  />
                )
              })}
              </section>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}