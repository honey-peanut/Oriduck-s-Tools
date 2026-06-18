import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import CamelCase from './pages/CamelCase'
import Loading from './pages/Loading'
import { useLoadingNavigate } from './hooks/useLoadingNavigate'
import './App.css'

function Home() {
  const navigate = useLoadingNavigate()

  return (
    <div className="app">
      <main className="main">
        <div className="main-content">
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
        <Route path="/loading" element={<Loading />} />
      </Route>
    </Routes>
  )
}

export default App