import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import CamelCase from './pages/CamelCase'
import ImageToPdf from './pages/ImageToPdf'
import Loading from './pages/Loading'
import { useLoadingNavigate } from './hooks/useLoadingNavigate'
import './App.css'

function HomeDuck() {
  const [revealed, setRevealed] = useState(false)
  const [grabbed, setGrabbed] = useState(false)
  return (
    <div className="home-duck-wrap">
      {grabbed && <span className="home-duck-mark">!</span>}
      <svg
        className={`home-duck ${revealed ? 'is-revealed' : ''} ${grabbed ? 'is-grabbed' : ''}`}
        viewBox="0 0 100 84"
        aria-hidden="true"
        onAnimationEnd={() => setRevealed(true)}
        onMouseDown={() => {
          if (revealed) setGrabbed(true)
        }}
        onMouseUp={() => setGrabbed(false)}
        onMouseLeave={() => setGrabbed(false)}
      >
        <g fill="currentColor">
          <ellipse cx="44" cy="54" rx="32" ry="22" />
          <path d="M16 50 L2 41 L20 60 Z" />
          <circle cx="70" cy="28" r="16" />
          <path d="M84 23 L100 30 L84 38 Z" />
        </g>
        <circle className="home-duck-eye" cx="73" cy="24" r="2.6" />
      </svg>
    </div>
  )
}

function Home() {
  const navigate = useLoadingNavigate()

  return (
    <div className="app">
      <main className="main">
        <div className="main-content">
          <HomeDuck />
          <h1 className="welcome-text">Welcome to Oriduck's Tools!</h1>
          <button className="btn-login" onClick={() => navigate('/dashboard')}>
            사용해보기
          </button>
        </div>
      </main>
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/tools/camel-case" element={<CamelCase />} />
        <Route path="/tools/image-to-pdf" element={<ImageToPdf />} />
        <Route path="/loading" element={<Loading />} />
      </Route>
    </Routes>
  )
}

export default App