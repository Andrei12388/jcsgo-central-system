import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './App.css'

const WEB_APP_URL =
  'https://script.google.com/macros/s/AKfycbxOGv2Dz4LF8g2HodyKYvtE7lJ_6tkIPZKVEL4QUYfNhYk7GwucSUTKuANHooKwtyrO/exec'

const LANDING_OPTIONS = [
  { label: '8AM', celebration: '8am Central', title: '8AM Celebration' },
  { label: '10:30AM', celebration: '10:30am Central', title: '10:30AM Celebration' },
  { label: '3PM', celebration: '3pm Central', title: '3PM Celebration' },
]

function App() {
  const navigate = useNavigate()
  const [loginUser, setLoginUser] = useState('')
  const [loginPass, setLoginPass] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loggedIn, setLoggedIn] = useState(() => sessionStorage.getItem('jcsgo-logged-in') === 'true')

  const handleLogin = (event) => {
    event.preventDefault()

    const AUTH_USER = 'admin'
    const AUTH_PASS = '12345'

    if (loginUser === AUTH_USER && loginPass === AUTH_PASS) {
      setLoggedIn(true)
      sessionStorage.setItem('jcsgo-logged-in', 'true')
      setLoginError('')
      setLoginUser('')
      setLoginPass('')
    } else {
      setLoginError('Invalid username or password.')
    }
  }

  const handleLandingSelect = async (option) => {
    try {
      await fetch(WEB_APP_URL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'landingSelection',
          celebration: option.celebration,
          title: option.title,
        }),
      })
    } catch (error) {
      console.error('Landing selection error', error)
    } finally {
      navigate(
        `/dashboard?time=${encodeURIComponent(option.celebration)}&title=${encodeURIComponent(option.title)}`
      )
    }
  }

  if (!loggedIn) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 24,
          padding: 20,
          textAlign: 'center',
        }}
      >
        <img
          src='logonotitle.png'
          alt='Logo'
          width={140}
          height={70}
          style={{ objectFit: 'contain' }}
        />
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 'bold' }}>JCSGO CENTRAL Login</h1>
          <p style={{ margin: 0, opacity: 0.75 }}>
            Enter your username and password to continue.
          </p>
        </div>
        <form
          onSubmit={handleLogin}
          style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 300 }}
        >
          <input
            type='text'
            value={loginUser}
            onChange={(e) => setLoginUser(e.target.value)}
            placeholder='Username'
            style={{ padding: 12, borderRadius: 8, border: '1px solid #ccc' }}
          />
          <input
            type='password'
            value={loginPass}
            onChange={(e) => setLoginPass(e.target.value)}
            placeholder='Password'
            style={{ padding: 12, borderRadius: 8, border: '1px solid #ccc' }}
          />
          {loginError && (
            <div style={{ color: '#b00020', fontWeight: 700 }}>{loginError}</div>
          )}
          <button
            type='submit'
            style={{
              padding: '12px 20px',
              borderRadius: 10,
              border: 'none',
              background: '#071141',
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            Login
          </button>
        </form>
      </div>
    )
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
        padding: 20,
        textAlign: 'center',
      }}
    >
      <img
        src='logonotitle.png'
        alt='Logo'
        width={140}
        height={70}
        style={{ objectFit: 'contain' }}
      />
      <div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 'bold' }}>JCSGO CENTRAL</h1>
        <p style={{ margin: 0, opacity: 0.75 }}>
          Select your celebration time below
        </p>
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
        {LANDING_OPTIONS.map((option) => (
          <button
            key={option.label}
            onClick={() => handleLandingSelect(option)}
            style={{
              minWidth: 140,
              padding: '16px 20px',
              borderRadius: 12,
              border: '1px solid #071141',
              background: '#071141',
              color: '#fff',
              cursor: 'pointer',
              fontSize: 16,
              fontWeight: 700,
            }}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default App