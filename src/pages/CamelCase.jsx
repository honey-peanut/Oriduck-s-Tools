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

function CopyField({ prefix, camel, action, copied, onCopy }) {
  const value = camel ? prefix + camel : ''

  const copy = () => {
    if (!value) return
    navigator.clipboard?.writeText(value)
    onCopy()
  }

  return (
    <div className="cc-item">
      <span className="cc-item-prefix">{prefix}</span>
      <button
        type="button"
        className="cc-field"
        onClick={copy}
        disabled={!value}
        title="클릭하여 복사"
      >
        {value || <span className="cc-field-empty">입력을 기다리는 중…</span>}
        {copied && value && <span className="cc-copied">복사됨</span>}
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

  const togglePin = (prefix) => {
    setPinned((prev) =>
      prev.includes(prefix)
        ? prev.filter((p) => p !== prefix)
        : [...prev, prefix]
    )
  }

  const unpin = (prefix) => {
    setPinned((prev) => prev.filter((p) => p !== prefix))
  }

  return (
    <div className="camelcase">
      <button className="back-btn" onClick={() => navigate('/dashboard')}>
        ← 뒤로
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
              pinned.map((prefix) => (
                <CopyField
                  key={prefix}
                  prefix={prefix}
                  camel={camel}
                  copied={copiedId === `pinned-${prefix}`}
                  onCopy={() => setCopiedId(`pinned-${prefix}`)}
                  action={
                    <button
                      type="button"
                      className="cc-btn cc-btn-del"
                      onClick={() => unpin(prefix)}
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