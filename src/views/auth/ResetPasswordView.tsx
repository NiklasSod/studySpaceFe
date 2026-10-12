import React, { useState } from 'react'
import {
  Alert,
  Button,
  Form,
  InputGroup,
  Spinner,
} from 'react-bootstrap'
import { Eye, EyeSlash } from 'react-bootstrap-icons'
import { Link, useSearchParams } from 'react-router-dom'
import { resetPassword } from '../../api/auth'
import BrandLogo from '../../components/BrandLogo'

const inputStyle = {
  borderRadius: '6px',
  backgroundColor: 'var(--input-bg)',
  color: 'var(--input-text)',
  borderColor: 'var(--input-border)',
}

export default function ResetPasswordView() {
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email') ?? ''
  const token = searchParams.get('token') ?? ''

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const missingLinkData = !email || !token

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    if (!email || !token) {
      setError('Invalid or expired reset link.')
      return
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setIsLoading(true)

    try {
      await resetPassword({ email, token, newPassword })
      setIsSuccess(true)
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Could not reset password.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="min-vh-100 d-flex flex-column"
      style={{ backgroundColor: 'var(--card-bg)' }}
    >
      <header className="p-4 d-flex align-items-center">
        <BrandLogo />
      </header>

      <main className="flex-grow-1 d-flex align-items-center justify-content-center px-3">
        <div style={{ width: '100%', maxWidth: '380px' }}>
          <h1
            className="text-center fw-bold mb-3 fs-3"
            style={{ color: 'var(--text-primary)' }}
          >
            Reset Password
          </h1>
          <p
            className="text-center small mb-4"
            style={{ color: 'var(--text-secondary)' }}
          >
            Choose a new password for your account.
          </p>

          {isSuccess ? (
            <Alert variant="success">
              Your password has been reset. You can now{' '}
              <Alert.Link as={Link} to="/login">
                log in
              </Alert.Link>{' '}
              with your new password.
            </Alert>
          ) : (
            <>
              {error && (
                <Alert
                  variant="danger"
                  onClose={() => setError(null)}
                  dismissible={!missingLinkData}
                >
                  {error}
                </Alert>
              )}

              {missingLinkData ? (
                <div className="text-center mt-3">
                  <Link
                    to="/login"
                    className="text-decoration-underline small"
                    style={{ color: 'var(--link-color)' }}
                  >
                    Back to login
                  </Link>
                </div>
              ) : (
                <Form onSubmit={handleSubmit} noValidate>
                  <Form.Group className="mb-3" controlId="resetNewPassword">
                    <Form.Label
                      className="fw-normal mb-1 small"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      New password
                    </Form.Label>
                    <InputGroup style={{ borderRadius: '6px', overflow: 'hidden' }}>
                      <Form.Control
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter new password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="py-2 px-3 shadow-none"
                        style={{ ...inputStyle, borderRadius: '6px 0 0 6px' }}
                        required
                        autoFocus
                      />
                      <InputGroup.Text
                        as="button"
                        type="button"
                        onClick={() => setShowPassword((show) => !show)}
                        aria-label={
                          showPassword ? 'Hide password' : 'Show password'
                        }
                        title={showPassword ? 'Hide password' : 'Show password'}
                        className="shadow-none"
                        style={{
                          ...inputStyle,
                          borderRadius: '0 6px 6px 0',
                          cursor: 'pointer',
                        }}
                      >
                        {showPassword ? <EyeSlash /> : <Eye />}
                      </InputGroup.Text>
                    </InputGroup>
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="resetConfirmPassword">
                    <Form.Label
                      className="fw-normal mb-1 small"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Confirm password
                    </Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="py-2 px-3 shadow-none"
                      style={inputStyle}
                      required
                    />
                  </Form.Group>

                  <Button
                    variant="dark"
                    type="submit"
                    disabled={isLoading}
                    className="w-100 py-2 mt-2 mb-3 fw-medium"
                    style={{
                      backgroundColor: 'var(--btn-bg)',
                      borderColor: 'var(--btn-bg)',
                      color: 'var(--btn-text)',
                      borderRadius: '6px',
                    }}
                  >
                    {isLoading ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Resetting...
                      </>
                    ) : (
                      'Reset password'
                    )}
                  </Button>
                </Form>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
