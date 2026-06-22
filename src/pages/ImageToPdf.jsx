import { useState, useRef, useEffect } from 'react'
import { jsPDF } from 'jspdf'
import { useLoadingNavigate } from '../hooks/useLoadingNavigate'
import './ImageToPdf.css'

let uid = 0

// 이미지를 캔버스로 그려 균일한 JPEG dataURL + 크기로 변환 (webp/png/gif 등 모두 처리)
function loadImage(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('not an image'))
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        const ctx = canvas.getContext('2d')
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0)
        resolve({
          id: ++uid,
          name: file.name,
          dataUrl: canvas.toDataURL('image/jpeg', 0.92),
          w: canvas.width,
          h: canvas.height,
        })
      }
      img.onerror = reject
      img.src = reader.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function stripExt(name) {
  return name.replace(/\.[^.]+$/, '')
}

// 여백 비율(페이지 짧은 변 기준)
const MARGIN_RATIO = { none: 0, narrow: 0.06, wide: 0.13 }

const ORIENTATION_OPTS = [
  { value: 'auto', label: '자동' },
  { value: 'portrait', label: '세로' },
  { value: 'landscape', label: '가로' },
]
const PAGE_SIZE_OPTS = [
  { value: 'fit', label: '원본' },
  { value: 'a4', label: 'A4' },
  { value: 'letter', label: 'Letter' },
]
const MARGIN_OPTS = [
  { value: 'none', label: '없음' },
  { value: 'narrow', label: '좁게' },
  { value: 'wide', label: '넓게' },
]
const OUTPUT_OPTS = [
  { value: 'single', label: '한 파일' },
  { value: 'separate', label: '각각' },
]

// 분절형(세그먼트) 선택 버튼
function Segmented({ label, value, onChange, options, disabled, hint }) {
  return (
    <div className={`i2p-opt ${disabled ? 'is-disabled' : ''}`}>
      <span className="i2p-opt-label">{label}</span>
      <div className="i2p-seg">
        {options.map((o) => (
          <button
            type="button"
            key={o.value}
            className={`i2p-seg-btn ${value === o.value ? 'is-active' : ''}`}
            onClick={() => onChange(o.value)}
            disabled={disabled}
          >
            {o.label}
          </button>
        ))}
      </div>
      {hint && <span className="i2p-opt-hint">{hint}</span>}
    </div>
  )
}

function GripIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="9" cy="6" r="1.7" />
      <circle cx="9" cy="12" r="1.7" />
      <circle cx="9" cy="18" r="1.7" />
      <circle cx="15" cy="6" r="1.7" />
      <circle cx="15" cy="12" r="1.7" />
      <circle cx="15" cy="18" r="1.7" />
    </svg>
  )
}

export default function ImageToPdf() {
  const navigate = useLoadingNavigate()
  const [images, setImages] = useState([])
  const [title, setTitle] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [drag, setDrag] = useState(null) // 순서 변경: { index, dy, pitch }
  const [preview, setPreview] = useState(null) // 미리보기 이미지
  const [zoom, setZoom] = useState(1) // 미리보기 확대 배율
  const [orientation, setOrientation] = useState('auto') // 페이지 방향
  const [pageSize, setPageSize] = useState('fit') // 페이지 크기(원본/A4/Letter)
  const [margin, setMargin] = useState('none') // 여백
  const [output, setOutput] = useState('single') // 출력 방식(한 파일/각각)
  const fileInputRef = useRef(null)
  const previewRef = useRef(null)

  // 목록 항목 드래그로 순서 변경 (실시간 미리보기)
  const startReorder = (e, index) => {
    e.preventDefault()
    const row = e.currentTarget.closest('.i2p-thumb')
    const pitch = (row?.offsetHeight ?? 60) + 8 // 항목 높이 + 목록 gap
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
      setImages((prev) => {
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

  // 미리보기 모달: 배경 스크롤 잠금 + Esc 닫기 + zoom 초기화
  useEffect(() => {
    if (!preview) return
    setZoom(1)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => {
      if (e.key === 'Escape') setPreview(null)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [preview])

  // 미리보기 안에서 휠 스크롤 → 이미지 확대/축소 (배경 스크롤 차단)
  useEffect(() => {
    if (!preview) return
    const el = previewRef.current
    if (!el) return
    const onWheel = (e) => {
      e.preventDefault()
      setZoom((z) => {
        const next = z * (e.deltaY < 0 ? 1.12 : 0.89)
        return Math.min(6, Math.max(0.4, next))
      })
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [preview])

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

  const addFiles = async (fileList) => {
    const files = Array.from(fileList).filter((f) => f.type.startsWith('image/'))
    if (files.length === 0) return
    const loaded = await Promise.all(files.map((f) => loadImage(f).catch(() => null)))
    setImages((prev) => [...prev, ...loaded.filter(Boolean)])
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    addFiles(e.dataTransfer.files)
  }

  const removeImage = (id) => {
    setImages((prev) => prev.filter((img) => img.id !== id))
  }

  const clearAll = () => setImages([])

  const generatePdf = () => {
    if (images.length === 0) return

    const trimmed = title.trim()

    // 이미지 1장에 대한 페이지 크기·방향 결정
    const pageArgs = (img) => {
      if (pageSize === 'fit') {
        // 원본: 페이지 = 이미지 크기, 방향은 이미지에 따름
        const orient = img.w >= img.h ? 'landscape' : 'portrait'
        return { format: [img.w, img.h], orient }
      }
      const orient =
        orientation === 'auto'
          ? img.w >= img.h
            ? 'landscape'
            : 'portrait'
          : orientation
      return { format: pageSize, orient }
    }

    // 페이지 안에 비율 유지하며 여백만큼 들여 가운데 배치
    const placeImage = (doc, img) => {
      const pw = doc.internal.pageSize.getWidth()
      const ph = doc.internal.pageSize.getHeight()
      const m = MARGIN_RATIO[margin] * Math.min(pw, ph)
      const cw = pw - m * 2
      const ch = ph - m * 2
      const scale = Math.min(cw / img.w, ch / img.h)
      const w = img.w * scale
      const h = img.h * scale
      doc.addImage(img.dataUrl, 'JPEG', (pw - w) / 2, (ph - h) / 2, w, h)
    }

    // 각각 따로: 이미지마다 PDF 하나씩 저장
    if (output === 'separate') {
      images.forEach((img, idx) => {
        const { format, orient } = pageArgs(img)
        const doc = new jsPDF({ orientation: orient, unit: 'px', format })
        placeImage(doc, img)
        const name = trimmed
          ? `${trimmed}_${String(idx + 1).padStart(2, '0')}`
          : stripExt(img.name) || `image_${idx + 1}`
        doc.setProperties({ title: name })
        doc.save(`${name}.pdf`)
      })
      return
    }

    // 한 파일로 통합
    let doc
    images.forEach((img, i) => {
      const { format, orient } = pageArgs(img)
      if (i === 0) {
        doc = new jsPDF({ orientation: orient, unit: 'px', format })
      } else {
        doc.addPage(format, orient)
      }
      placeImage(doc, img)
    })

    // 제목: 입력값(공백 제거) 우선, 비어있으면 마지막 이미지 파일명
    const name = trimmed || stripExt(images[images.length - 1].name)
    doc.setProperties({ title: name })
    doc.save(`${name}.pdf`)
  }

  return (
    <div className="i2p">
      <button className="back-btn" onClick={() => navigate('/dashboard')} title="뒤로">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M9 14 4 9l5-5" />
          <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H9" />
        </svg>
        <span className="btn-label">뒤로</span>
      </button>

      <h1 className="i2p-title">PDF 변환기</h1>

      <div className="i2p-body">
      <div className="i2p-cards">
        <section className="i2p-card">
          <h2 className="i2p-card-title">이미지</h2>

          <div
            className={`i2p-drop ${dragOver ? 'is-over' : ''}`}
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <p className="i2p-drop-text">
              이미지를 여기로 드래그하거나 클릭해서 선택하세요
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => {
                addFiles(e.target.files)
                e.target.value = ''
              }}
            />
          </div>

          {images.length > 0 && (
            <>
              <div className="i2p-list">
                {images.map((img, i) => (
                  <div
                    className={`i2p-thumb ${drag?.index === i ? 'is-dragging' : ''}`}
                    key={img.id}
                    style={rowDragStyle(i, images.length)}
                  >
                    <span
                      className="i2p-handle"
                      onPointerDown={(e) => startReorder(e, i)}
                      title="드래그하여 순서 변경"
                    >
                      <GripIcon />
                    </span>
                    <span className="i2p-thumb-no">{i + 1}</span>
                    <img
                      src={img.dataUrl}
                      alt={img.name}
                      onClick={() => setPreview(img)}
                      title="클릭하여 크게 보기"
                    />
                    <span className="i2p-thumb-name" title={img.name}>
                      {img.name}
                    </span>
                    <button
                      className="i2p-thumb-del"
                      onClick={() => removeImage(img.id)}
                      title="제거"
                      aria-label="제거"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
              <button className="i2p-clear" onClick={clearAll}>
                모두 비우기
              </button>
            </>
          )}
        </section>

        <section className="i2p-card">
          <h2 className="i2p-card-title">PDF 제목</h2>
          <input
            type="text"
            className="i2p-input"
            placeholder="비워두면 마지막 이미지 파일명이 제목이 됩니다"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            spellCheck={false}
          />
        </section>

        <button
          className="i2p-generate"
          onClick={generatePdf}
          disabled={images.length === 0}
        >
          PDF 만들기 ({images.length}장)
        </button>
        </div>

        <aside className="i2p-options i2p-card">
          <h2 className="i2p-card-title">PDF 옵션</h2>
          <Segmented
            label="페이지 방향"
            value={orientation}
            onChange={setOrientation}
            options={ORIENTATION_OPTS}
            disabled={pageSize === 'fit'}
            hint={pageSize === 'fit' ? '원본 크기에선 이미지 방향을 따릅니다' : undefined}
          />
          <Segmented
            label="페이지 크기"
            value={pageSize}
            onChange={setPageSize}
            options={PAGE_SIZE_OPTS}
          />
          <Segmented
            label="여백"
            value={margin}
            onChange={setMargin}
            options={MARGIN_OPTS}
          />
          <Segmented
            label="출력 방식"
            value={output}
            onChange={setOutput}
            options={OUTPUT_OPTS}
            hint={output === 'separate' ? '이미지마다 PDF가 따로 저장됩니다' : undefined}
          />
        </aside>
      </div>

      {preview && (
        <div className="i2p-preview" ref={previewRef} onClick={() => setPreview(null)}>
          <button
            className="i2p-preview-close"
            onClick={() => setPreview(null)}
            aria-label="닫기"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <img
            className="i2p-preview-img"
            src={preview.dataUrl}
            alt={preview.name}
            style={{ transform: `scale(${zoom})` }}
            onClick={(e) => e.stopPropagation()}
          />
          <span className="i2p-preview-name">
            {preview.name} · {Math.round(zoom * 100)}%
          </span>
        </div>
      )}
    </div>
  )
}