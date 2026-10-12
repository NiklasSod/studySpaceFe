import React, { useState } from 'react'
import { Form, Button, Alert, Spinner, InputGroup } from 'react-bootstrap'
import { Eye, EyeSlash } from 'react-bootstrap-icons'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import BrandLogo from '../../components/BrandLogo'

export default function LoginView() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const navigate = useNavigate()
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      await login(email, password)
      navigate('/')
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Could not connect to server.')
      }
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
            className="text-center fw-bold mb-4 fs-3"
            style={{ color: 'var(--text-primary)' }}
          >
            Log In
          </h1>

          {error && (
            <Alert variant="danger" onClose={() => setError(null)} dismissible>
              {error}
            </Alert>
          )}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="loginEmail">
              <Form.Label
                className="fw-normal mb-1 small"
                style={{ color: 'var(--text-secondary)' }}
              >
                Email
              </Form.Label>
              <Form.Control
                type="email"
                placeholder="Value"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="py-2 px-3 shadow-none"
                style={{
                  borderRadius: '6px',
                  backgroundColor: 'var(--input-bg)',
                  color: 'var(--input-text)',
                  borderColor: 'var(--input-border)',
                }}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="loginPassword">
              <Form.Label
                className="fw-normal mb-1 small"
                style={{ color: 'var(--text-secondary)' }}
              >
                Password
              </Form.Label>
              <InputGroup style={{ borderRadius: '6px', overflow: 'hidden' }}>
                <Form.Control
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Value"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="py-2 px-3 shadow-none"
                  style={{
                    borderRadius: '6px 0 0 6px',
                    backgroundColor: 'var(--input-bg)',
                    color: 'var(--input-text)',
                    borderColor: 'var(--input-border)',
                  }}
                  required
                />
                <InputGroup.Text
                  as="button"
                  type="button"
                  onClick={() => setShowPassword((show) => !show)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  className="shadow-none"
                  style={{
                    borderRadius: '0 6px 6px 0',
                    backgroundColor: 'var(--input-bg)',
                    color: 'var(--input-text)',
                    borderColor: 'var(--input-border)',
                    cursor: 'pointer',
                  }}
                >
                  {showPassword ? <Eye /> : <EyeSlash />}
                </InputGroup.Text>
              </InputGroup>
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
                  Logging in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>

            <div className="d-flex justify-content-between align-items-center mt-2">
              <Link
                to="/forgot-password"
                className="text-decoration-underline small"
                style={{ color: 'var(--link-color)' }}
              >
                {/* TODO add forgot password if time */}
                Forgot password?
              </Link>
              <Link
                to="/register"
                className="text-decoration-underline small"
                style={{ color: 'var(--link-color)' }}
              >
                Create Account
              </Link>
            </div>
          </Form>
        </div>
      </main>
    </div>
  )
}
