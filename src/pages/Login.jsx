import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/Login.css'

const ADMIN_LOGIN_BODY = {
  email: 'admin@mwo.com',
  password: '12345678',
}

export function Login() {
  const [email, setEmail] = useState(ADMIN_LOGIN_BODY.email)
  const [password, setPassword] = useState(ADMIN_LOGIN_BODY.password)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/auth/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: ADMIN_LOGIN_BODY.email,
          password: ADMIN_LOGIN_BODY.password,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result?.success || !result?.data?.token) {
        throw new Error(result?.message || 'Login failed. Please try again.')
      }

      localStorage.setItem('adminToken', result.data.token)
      localStorage.setItem('adminUser', JSON.stringify(result.data.user || {}))
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Unable to login. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-left">
        <h1>Admin Portal</h1>
        <p>
          Effortlessly manage predictions, monitor live prediction activity,
          oversee daily operations, and gain actionable performance insights—keeping
          your prediction platform accurate, organized, and fully in control.
        </p>
      </div>

      <div className="login-right">
        <div className="login-form-container">
          <h2>Login as an Admin</h2>
          <p className="signup-prompt">
            Not an Admin? <a href="#">Sign up</a>
          </p>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <div className="input-wrapper">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <input
                  id="email"
                  type="email"
                  placeholder="e.g name@gmail.com"
                  value={email}
                  required
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-wrapper">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  required
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <a href="#" className="forgot-link">Forgot password?</a>
            </div>

            {error ? <p className="login-error">{error}</p> : null}

            <button type="submit" className="btn-login" disabled={isSubmitting}>
              {isSubmitting ? 'Logging in...' : 'Login'}
            </button>

            <div className="divider">
              <span>or</span>
            </div>

            <button type="button" className="btn-google">
              <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign In with Google
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
