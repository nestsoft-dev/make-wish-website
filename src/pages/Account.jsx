import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Header } from '../components/Header'
import { EditProfileModal } from '../components/EditProfileModal'
import { apiFetch } from '../utils/api'
import '../styles/Account.css'

function formatDate(dateString) {
  if (!dateString) return '--'

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString))
}

function formatRole(role) {
  if (!role) return '--'

  return role
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function formatAddress(address) {
  if (!address) return '--'
  if (typeof address === 'string') return address

  return [
    address.line1,
    address.line2,
    address.city,
    address.state,
    address.postalCode,
    address.country,
  ]
    .filter(Boolean)
    .join(', ') || '--'
}

export function Account() {
  const navigate = useNavigate()
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [profile, setProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let isCancelled = false

    const loadProfile = async () => {
      const adminToken = localStorage.getItem('adminToken')

      if (!adminToken) {
        navigate('/')
        return
      }

      setIsLoading(true)
      setError('')

      try {
        const response = await apiFetch('/api/auth/admin/profile', {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        })

        const result = await response.json()

        if (response.status === 401) {
          localStorage.removeItem('adminToken')
          localStorage.removeItem('adminUser')
          throw new Error('Invalid token. Please log in again.')
        }

        if (response.status === 403) {
          throw new Error('Admin access required.')
        }

        if (!response.ok || !result?.success) {
          throw new Error(result?.message || 'Unable to fetch admin profile.')
        }

        if (!isCancelled) {
          setProfile(result?.data?.admin || null)
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err.message || 'Unable to fetch admin profile.')

          if ((err.message || '') === 'Invalid token. Please log in again.') {
            navigate('/')
          }
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    loadProfile()

    return () => {
      isCancelled = true
    }
  }, [navigate])

  const fullName = useMemo(() => {
    if (!profile) return '--'
    return [profile.firstName, profile.lastName].filter(Boolean).join(' ') || '--'
  }, [profile])

  const initials = useMemo(() => {
    return fullName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('') || 'A'
  }, [fullName])

  const addressText = useMemo(() => {
    return formatAddress(profile?.address)
  }, [profile])

  const modalInitialData = useMemo(() => ({
    firstName: profile?.firstName || '',
    lastName: profile?.lastName || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
    avatarUrl: profile?.avatarUrl || '',
    jobTitle: profile?.jobTitle || '',
    line1: typeof profile?.address === 'string' ? profile.address : (profile?.address?.line1 || ''),
    line2: profile?.address?.line2 || '',
    city: profile?.address?.city || '',
    state: profile?.address?.state || '',
    postalCode: profile?.address?.postalCode || '',
    country: profile?.address?.country || 'NG',
  }), [profile])

  const handleProfileUpdated = (admin) => {
    setProfile(admin)
    setShowEditProfile(false)
  }

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminUser')
    navigate('/')
  }

  return (
    <div className="dashboard-main">
      <Header title="Admin Profile" />
      <div className="dashboard-content acct-content">
        <div className="acct-area">
          <span className="acct-area-title">Account Area</span>
          <button type="button" className="acct-logout" onClick={handleLogout}>
            Log Out
          </button>
        </div>

        {error ? <p className="acct-message acct-message-error">{error}</p> : null}

        <div className="acct-card">
          <div className="acct-profile-row">
            <div className="acct-profile">
              <div className="acct-avatar" aria-hidden="true">{isLoading ? '...' : initials}</div>
              <div>
                <div className="acct-name">{isLoading ? 'Loading...' : fullName}</div>
                <div className="acct-role">{isLoading ? 'Loading...' : formatRole(profile?.role)}</div>
              </div>
            </div>

            <div className="acct-actions">
              <button type="button" className="acct-btn">
                Replace Image
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </button>
              <button type="button" className="acct-btn" onClick={() => setShowEditProfile(true)}>
                Edit Profile
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
                </svg>
              </button>
            </div>
          </div>

          <div className="acct-divider" />

          <div className="acct-sections">
            <div>
              <h3 className="acct-section-title">Personal Information</h3>
              <div className="acct-grid">
                <div className="acct-field">
                  <div className="acct-label">First Name</div>
                  <div className="acct-value">{isLoading ? 'Loading...' : (profile?.firstName || '--')}</div>
                </div>
                <div className="acct-field">
                  <div className="acct-label">Last Name</div>
                  <div className="acct-value">{isLoading ? 'Loading...' : (profile?.lastName || '--')}</div>
                </div>
                <div className="acct-field">
                  <div className="acct-label">Email Address</div>
                  <div className="acct-value">{isLoading ? 'Loading...' : (profile?.email || '--')}</div>
                </div>
                <div className="acct-field">
                  <div className="acct-label">Phone Number</div>
                  <div className="acct-value">{isLoading ? 'Loading...' : (profile?.phone || '--')}</div>
                </div>
                <div className="acct-field">
                  <div className="acct-label">Status</div>
                  <div className="acct-value">{isLoading ? 'Loading...' : (profile?.status || '--')}</div>
                </div>
                <div className="acct-field">
                  <div className="acct-label">Last Login</div>
                  <div className="acct-value">{isLoading ? 'Loading...' : formatDate(profile?.lastLoginAt)}</div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="acct-section-title">Account Details</h3>
              <div className="acct-grid">
                <div className="acct-field">
                  <div className="acct-label">Address</div>
                  <div className="acct-value">{isLoading ? 'Loading...' : addressText}</div>
                </div>
                <div className="acct-field">
                  <div className="acct-label">Job Title</div>
                  <div className="acct-value">{isLoading ? 'Loading...' : (profile?.jobTitle || '--')}</div>
                </div>
                <div className="acct-field">
                  <div className="acct-label">Email Verified</div>
                  <div className="acct-value">{isLoading ? 'Loading...' : formatDate(profile?.emailVerifiedAt)}</div>
                </div>
                <div className="acct-field">
                  <div className="acct-label">Two Factor Auth</div>
                  <div className="acct-value">{isLoading ? 'Loading...' : (profile?.twoFactorEnabled ? 'Enabled' : 'Disabled')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <EditProfileModal
          isOpen={showEditProfile}
          onClose={() => setShowEditProfile(false)}
          initialData={modalInitialData}
          onSaved={handleProfileUpdated}
        />
      </div>
    </div>
  )
}

