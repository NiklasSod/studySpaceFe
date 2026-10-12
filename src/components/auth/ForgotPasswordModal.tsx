import { useEffect, useRef, useState } from 'react'
import { Alert, Button, Form, Modal, Spinner } from 'react-bootstrap'
import { requestPasswordReset } from '../../api/auth'

interface ForgotPasswordModalProps {
  show: boolean
  onHide: () => void
}

const inputStyle = {
  borderRadius: '6px',
  backgroundColor: 'var(--input-bg)',
  color: 'var(--input-text)',
  borderColor: 'var(--input-border)',
}

function ForgotPasswordModal({ show, onHide }: ForgotPasswordModalProps) {
  const [email, setEmail] = useState('')
  const [emailInvalid, setEmailInvalid] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const closeTimer = useRef<number | null>(null)

  const clearCloseTimer = () => {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }

  const reset = () => {
    clearCloseTimer()
    setEmail('')
    setEmailInvalid(false)
    setError(null)
    setIsSubmitting(false)
    setIsSuccess(false)
  }

  const handleClose = () => {
    reset()
    onHide()
  }

  useEffect(() => {
    return () => clearCloseTimer()
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    const form = e.currentTarget
    const emailInput = form.elements.namedItem(
      'forgotPasswordEmail',
    ) as HTMLInputElement | null

    if (!emailInput || !emailInput.validity.valid) {
      setEmailInvalid(true)
      return
    }
    setEmailInvalid(false)

    const value = email.trim()
    setIsSubmitting(true)

    try {
      await requestPasswordReset(value)
      setIsSuccess(true)
      clearCloseTimer()
      closeTimer.current = window.setTimeout(handleClose, 2000)
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Could not connect to server.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal show={show} onHide={handleClose} onShow={reset} centered>
      <Modal.Header closeButton>
        <Modal.Title>Forgot password</Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit} noValidate>
        <Modal.Body>
          {isSuccess ? (
            <Alert variant="success" className="mb-0">
              An email has been sent to {email.trim()} with instructions to
              reset your password.
            </Alert>
          ) : (
            <>
              {error && <Alert variant="danger">{error}</Alert>}

              <Form.Group controlId="forgotPasswordEmail">
                <Form.Label
                  className="fw-normal mb-1 small"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Enter your email
                </Form.Label>
                <Form.Control
                  type="email"
                  placeholder="Enter email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (emailInvalid) setEmailInvalid(false)
                  }}
                  isInvalid={emailInvalid}
                  className="py-2 px-3 shadow-none"
                  style={inputStyle}
                  autoFocus
                  required
                />
                <Form.Control.Feedback type="invalid">
                  Please enter a valid email address.
                </Form.Control.Feedback>
              </Form.Group>
            </>
          )}
        </Modal.Body>

        {!isSuccess && (
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              style={{
                backgroundColor: 'var(--btn-bg)',
                borderColor: 'var(--btn-bg)',
                color: 'var(--btn-text)',
              }}
            >
              {isSubmitting ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Sending...
                </>
              ) : (
                'Submit'
              )}
            </Button>
          </Modal.Footer>
        )}
      </Form>
    </Modal>
  )
}

export default ForgotPasswordModal
