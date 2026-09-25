import { useRef, useState } from 'react'
import type { Editor } from '@tiptap/react'
import { Alert, Button, Form, Modal, Spinner } from 'react-bootstrap'
import { createResource, updateResource } from '../../api/resource'
import type { Resource } from '../../types/resource'
import { useAuth } from '../../auth/AuthContext'
import RichTextEditor from '../richText/RichTextEditor'
import VoiceRecorderButton from './VoiceRecorderButton'

interface ResourceFormModalProps {
  show: boolean
  mode: 'add' | 'edit'
  resource?: Resource | null
  courseId?: number
  moduleId?: number
  activityId?: number
  onHide: () => void
  onSaved: (resource: Resource, mode: 'add' | 'edit') => void
}

function normalizeUrl(raw: string): string {
  const value = raw.trim()
  if (!value) return value
  if (/^https?:\/\//i.test(value)) return value
  return `https://${value}`
}

function ResourceFormModal({
  show,
  mode,
  resource,
  courseId,
  moduleId,
  activityId,
  onHide,
  onSaved,
}: ResourceFormModalProps) {
  const [displayName, setDisplayName] = useState('')
  const [url, setUrl] = useState('')
  const [description, setDescription] = useState('')
  const [audioUrls, setAudioUrls] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const editorRef = useRef<Editor | null>(null)

  const { role } = useAuth()
  const canRecord = role !== 'student'

  const handleShow = () => {
    setError(null)
    setDisplayName(resource?.displayName ?? '')
    setUrl(resource?.url ?? '')
    setDescription(resource?.description ?? '')
    setAudioUrls(resource?.audioUrls ?? [])
  }

  const handleHide = () => {
    setError(null)
    onHide()
  }

  const handleAudioUploaded = (audioUrl: string) => {
    const index = audioUrls.length
    setAudioUrls((prev) => [...prev, audioUrl])
    editorRef.current?.chain().focus().insertContent(`[[audio:${index}]]`).run()
  }

  const removeAudio = (index: number) => {
    setAudioUrls((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    const name = displayName.trim()
    const link = normalizeUrl(url)
    if (!name || !link) {
      setError('Please provide both a name and a valid link.')
      return
    }

    setSaving(true)
    try {
      if (mode === 'add') {
        const created = await createResource({
          displayName: name,
          url: link,
          description,
          ...(audioUrls.length > 0 ? { audioUrls } : {}),
          courseId,
          moduleId,
          activityId,
        })
        onSaved(created, 'add')
      } else if (resource) {
        const updated = await updateResource(resource.id, {
          displayName: name,
          url: link,
          description,
          audioUrls,
        })
        onSaved(updated, 'edit')
      }

      onHide()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save resource.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal show={show} onHide={handleHide} onShow={handleShow} centered>
      <Modal.Header closeButton>
        <Modal.Title>
          {mode === 'add' ? 'Add Resource' : 'Edit Resource'}
        </Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && (
            <Alert variant="danger" onClose={() => setError(null)} dismissible>
              {error}
            </Alert>
          )}

          <Form.Group className="mb-3" controlId="resourceName">
            <Form.Label
              className="fw-normal mb-1 small"
              style={{ color: 'var(--text-secondary)' }}
            >
              Name
            </Form.Label>
            <Form.Control
              type="text"
              placeholder="e.g. Lecture slides"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
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

          <Form.Group className="mb-3" controlId="resourceUrl">
            <Form.Label
              className="fw-normal mb-1 small"
              style={{ color: 'var(--text-secondary)' }}
            >
              Link
            </Form.Label>
            <Form.Control
              type="url"
              placeholder="https://example.com/resource"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="py-2 px-3 shadow-none"
              style={{
                borderRadius: '6px',
                backgroundColor: 'var(--input-bg)',
                color: 'var(--input-text)',
                borderColor: 'var(--input-border)',
              }}
              required
            />
            <Form.Text className="text-muted">
              A URL starting with https:// is recommended.
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-3" controlId="resourceDescription">
            <Form.Label
              className="fw-normal mb-1 small"
              style={{ color: 'var(--text-secondary)' }}
            >
              Description
            </Form.Label>
            <RichTextEditor
              value={description}
              onChange={setDescription}
              placeholder="Add a short description"
              editorRef={editorRef}
            />
          </Form.Group>

          {canRecord && (
            <Form.Group className="mb-3" controlId="resourceAudio">
              <Form.Label
                className="fw-normal mb-1 small"
                style={{ color: 'var(--text-secondary)' }}
              >
                Voice notes
              </Form.Label>
              <VoiceRecorderButton
                onUploaded={handleAudioUploaded}
                disabled={saving}
              />
              {audioUrls.length > 0 && (
                <div className="d-flex flex-column gap-1 mt-2">
                  {audioUrls.map((audioUrl, index) => (
                    <div
                      key={audioUrl}
                      className="d-flex align-items-center gap-2"
                    >
                      <audio
                        controls
                        preload="none"
                        src={audioUrl}
                        className="flex-grow-1"
                      />
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => removeAudio(index)}
                        title="Remove voice note"
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Form.Group>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={handleHide} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="dark"
            type="submit"
            disabled={saving}
            style={{
              backgroundColor: 'var(--btn-bg)',
              borderColor: 'var(--btn-bg)',
              color: 'var(--btn-text)',
              borderRadius: '6px',
            }}
          >
            {saving ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Saving…
              </>
            ) : mode === 'add' ? (
              'Add Resource'
            ) : (
              'Save Changes'
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}

export default ResourceFormModal
