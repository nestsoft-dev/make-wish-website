import { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../utils/api'

const DEFAULT_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  avatarUrl: '',
  jobTitle: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'NG',
}

export function EditProfileModal({ isOpen, onClose, initialData, onSaved }) {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    ...DEFAULT_FORM,
    ...initialData,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    setForm({
      ...DEFAULT_FORM,
      ...initialData,
    })
    setStep(1)
    setError('')
    setSuccess('')
  }, [initialData, isOpen])

  const update = (key, value) => setForm((p) => ({ ...p, [key]: value }))

  const canContinue = useMemo(() => {
    if (step === 1) {
      return Boolean(form.firstName.trim() && form.lastName.trim())
    }

    return true
  }, [form.firstName, form.lastName, step])

  if (!isOpen) return null

  const close = () => {
    setStep(1)
    setError('')
    setSuccess('')
    onClose?.()
  }

  const handleSave = async () => {
    setError('')
    setSuccess('')

    const adminToken = localStorage.getItem('adminToken')

    if (!adminToken) {
      setError('Invalid token. Please log in again.')
      return
    }

    const body = {}

    if (form.firstName.trim()) body.firstName = form.firstName.trim()
    if (form.lastName.trim()) body.lastName = form.lastName.trim()
    if (form.phone.trim()) body.phone = form.phone.trim()
    if (form.avatarUrl.trim()) body.avatarUrl = form.avatarUrl.trim()
    if (form.jobTitle.trim()) body.jobTitle = form.jobTitle.trim()

    const hasAddress = [form.line1, form.line2, form.city, form.state, form.postalCode, form.country]
      .some((value) => value.trim())

    if (hasAddress) {
      body.address = {
        line1: form.line1.trim(),
        line2: form.line2.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        postalCode: form.postalCode.trim(),
        country: form.country.trim() || 'NG',
      }
    }

    setIsSubmitting(true)

    try {
      const response = await apiFetch('/api/auth/admin/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(body),
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
        throw new Error(result?.message || 'Unable to update profile.')
      }

      setSuccess(result?.message || 'Profile updated successfully.')
      onSaved?.(result?.data?.admin)
    } catch (err) {
      setError(err.message || 'Unable to update profile.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="ep-overlay" onClick={close}>
      <div className="ep-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ep-header">
          <h2>Edit Profile</h2>
          <button type="button" className="ep-close" onClick={close} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="ep-card">
          <div className="ep-stepper">
            <div className={`ep-step ${step === 1 ? 'active' : step > 1 ? 'done' : ''}`}>
              <div className="ep-line left" />
              <div className="ep-dot">1</div>
              <div className="ep-line right" />
              <div className="ep-step-title">Personal Information</div>
              <div className="ep-step-sub">Step 1</div>
            </div>

            <div className={`ep-step ${step === 2 ? 'active' : ''}`}>
              <div className="ep-line left" />
              <div className="ep-dot">2</div>
              <div className="ep-line right" />
              <div className="ep-step-title muted">Address</div>
              <div className="ep-step-sub muted">Step 2</div>
            </div>
          </div>

          <div className="ep-divider" />

          {error ? <p className="ep-message ep-message-error">{error}</p> : null}
          {success ? <p className="ep-message ep-message-success">{success}</p> : null}

          {step === 1 ? (
            <div className="ep-body">
              <div className="ep-label-row">
                <span className="ep-label">Profile Image</span>
              </div>

              <div className="ep-image-actions">
                <div className="ep-field ep-field-full">
                  <label>Avatar URL</label>
                  <input value={form.avatarUrl} onChange={(e) => update('avatarUrl', e.target.value)} placeholder="https://example.com/avatar.png" />
                </div>
              </div>

              <div className="ep-form">
                <div className="ep-field">
                  <label>First Name</label>
                  <input value={form.firstName} onChange={(e) => update('firstName', e.target.value)} />
                </div>
                <div className="ep-field">
                  <label>Last Name</label>
                  <input value={form.lastName} onChange={(e) => update('lastName', e.target.value)} />
                </div>
                <div className="ep-field">
                  <label>Email</label>
                  <input value={form.email} readOnly />
                </div>
                <div className="ep-field">
                  <label>Phone Number</label>
                  <input value={form.phone} onChange={(e) => update('phone', e.target.value)} />
                </div>
                <div className="ep-field ep-field-full">
                  <label>Job Title</label>
                  <input value={form.jobTitle} onChange={(e) => update('jobTitle', e.target.value)} placeholder="Operations Lead" />
                </div>
              </div>
            </div>
          ) : (
            <div className="ep-body">
              <div className="ep-form">
                <div className="ep-field">
                  <label>Address Line 1</label>
                  <input value={form.line1} onChange={(e) => update('line1', e.target.value)} />
                </div>
                <div className="ep-field">
                  <label>Address Line 2</label>
                  <input value={form.line2} onChange={(e) => update('line2', e.target.value)} />
                </div>
                <div className="ep-field">
                  <label>City</label>
                  <input value={form.city} onChange={(e) => update('city', e.target.value)} />
                </div>
                <div className="ep-field">
                  <label>State</label>
                  <input value={form.state} onChange={(e) => update('state', e.target.value)} />
                </div>
                <div className="ep-field">
                  <label>Postal Code</label>
                  <input value={form.postalCode} onChange={(e) => update('postalCode', e.target.value)} />
                </div>
                <div className="ep-field">
                  <label>Country</label>
                  <input value={form.country} onChange={(e) => update('country', e.target.value)} />
                </div>
              </div>
            </div>
          )}

          <div className="ep-footer">
            {step === 2 ? (
              <button
                type="button"
                className="ep-back"
                onClick={() => setStep(1)}
                disabled={isSubmitting}
              >
                Back
              </button>
            ) : null}
            <button
              type="button"
              className="ep-continue"
              disabled={!canContinue || isSubmitting}
              onClick={() => {
                if (step === 1) setStep(2)
                else handleSave()
              }}
            >
              {isSubmitting ? 'Saving...' : step === 1 ? 'Continue' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

