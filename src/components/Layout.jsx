import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import './Layout.css'

const VERSION = '0.1.01.01'

function Layout() {
  const [theme, setTheme] = useState('dark')
  const [settingsOpen, setSettingsOpen] = useState(false)

  const toggleTheme = (mode) => {
    setTheme(mode)
  }

  return (
    <div className={`layout theme-${theme}`}>
      <Outlet context={{ theme }} />

      <div
        className="settings-wrapper"
        onMouseEnter={() => setSettingsOpen(true)}
        onMouseLeave={() => setSettingsOpen(false)}
      >
        {settingsOpen && (
          <div className="settings-popup">
            <button
              className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
              onClick={() => toggleTheme('light')}
            >
              ☀️ 라이트 모드
            </button>
            <button
              className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
              onClick={() => toggleTheme('dark')}
            >
              🌙 다크 모드
            </button>
            <div className="settings-divider" />
            <div className="settings-version">버전: {VERSION}</div>
          </div>
        )}
        <button className="settings-btn" title="Settings">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default Layout
