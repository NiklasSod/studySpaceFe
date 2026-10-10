import { useRef, useState } from 'react'
import { Alert, Button, Form, Modal, Spinner } from 'react-bootstrap'
import { createResource, uploadResourceImage } from '../../api/resource'
import type { ImagePoint, Resource } from '../../types/resource'
import { compressImage } from '../../utils/imageCompression'
import VoiceRecorderButton from './VoiceRecorderButton'

interface InteractiveImageFormModalProps {
  show: boolean
  courseId?: number
  moduleId?: number
  activityId?: number
  onHide: () => void
  onSaved: (resource: Resource) => void
}

function InteractiveImageFormModal({
  show,
  courseId,
  moduleId,
  activityId,
  onHide,
  onSaved,
}: InteractiveImageFormModalProps) {
  const [displayName, setDisplayName] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [points, setPoints] = useState<ImagePoint[]>([])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const reset = () => {
    setError(null)
    setDisplayName('')
    setImageUrl('')
    setPoints([])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleHide = () => {
    setError(null)
    onHide()
  }

  const handleShow = () => {
    reset()
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setError(null)
    setUploading(true)
    compressImage(file)
      .then((compressed) => {
        const extension =
          compressed.type === 'image/webp'
            ? 'webp'
            : (compressed.type.split('/')[1] ?? 'webp')
        return uploadResourceImage(compressed, `image-${Date.now()}.${extension}`)
      })
      .then((url) => {
        setImageUrl(url)
        setPoints([])
      })
      .catch((err: unknown) => {
        setError(
          err instanceof Error ? err.message : 'Could not upload the image.',
        )
      })
      .finally(() => setUploading(false))
  }

  const handleImageClick = (event: React.MouseEvent<HTMLImageElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width))
    const y = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height))
    setPoints((prev) => [...prev, { x, y, text: '', audioUrl: '' }])
  }

  const updatePoint = (index: number, patch: Partial<ImagePoint>) => {
    setPoints((prev) =>
      prev.map((point, i) => (i === index ? { ...point, ...patch } : point)),
    )
  }

  const removePoint = (index: number) => {
    setPoints((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!displayName.trim() || !imageUrl) {
      setError('Please provide a name and upload an image.')
      return
    }

    setSaving(true)
    setError(null)
    try {
      const created = await createResource({
        displayName: displayName.trim(),
        url: imageUrl,
        isInteractiveImage: true,
        points,
        courseId,
        moduleId,
        activityId,
      })
      onSaved(created)
      handleHide()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not save the image.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal show={show} onHide={handleHide} onShow={handleShow} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Add interactive image</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {error && (
          <Alert variant="danger" onClose={() => setError(null)} dismissible>
            {error}
          </Alert>
        )}

        <Form.Group className="mb-3">
          <Form.Label className="fw-normal mb-1 small text-secondary">
            Name
          </Form.Label>
          <Form.Control
            type="text"
            placeholder="e.g. Anatomy diagram"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label className="fw-normal mb-1 small text-secondary">
            Image
          </Form.Label>
          <Form.Control
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
          />
          <Form.Text className="text-muted">
            The image is compressed to WebP and must be under 1 MB. Wide images
            scroll horizontally.
          </Form.Text>
        </Form.Group>

        {uploading && (
          <div className="d-flex align-items-center gap-2 text-muted small mb-2">
            <Spinner animation="border" size="sm" />
            Uploading image…
          </div>
        )}

        {imageUrl && (
          <>
            <Form.Label className="fw-normal mb-1 small text-secondary">
              Click the image to add a point
            </Form.Label>
            <div
              className="overflow-auto mb-2"
              style={{
                border: '1px solid var(--input-border)',
                borderRadius: '6px',
                backgroundColor: 'var(--input-bg)',
              }}
            >
              <div style={{ position: 'relative', width: 'fit-content' }}>
                <img
                  src={imageUrl}
                  alt="Uploaded"
                  onClick={handleImageClick}
                  style={{
                    display: 'block',
                    maxWidth: 'none',
                    height: 'auto',
                    cursor: 'crosshair',
                  }}
                />
                {points.map((point, index) => (
                  <span
                    key={index}
                    className="rounded-circle d-inline-flex align-items-center justify-content-center text-white"
                    style={{
                      position: 'absolute',
                      left: `${point.x * 100}%`,
                      top: `${point.y * 100}%`,
                      transform: 'translate(-50%, -50%)',
                      width: '24px',
                      height: '24px',
                      fontSize: '12px',
                      fontWeight: 600,
                      pointerEvents: 'none',
                      backgroundColor: 'var(--link-color)',
                      border: '2px solid rgba(255,255,255,0.85)',
                    }}
                  >
                    {index + 1}
                  </span>
                ))}
              </div>
            </div>

            {points.length === 0 ? (
              <p className="text-muted small mb-0">
                No points yet. Click on the image above to add the first point.
              </p>
            ) : (
              <div className="d-flex flex-column gap-2">
                {points.map((point, index) => (
                  <div
                    key={index}
                    className="rounded p-2"
                    style={{
                      border: '1px solid var(--input-border)',
                      backgroundColor: 'var(--input-bg)',
                    }}
                  >
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="fw-semibold small">
                        Point {index + 1}
                      </span>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        className="py-0 px-2"
                        onClick={() => removePoint(index)}
                        title="Remove point"
                      >
                        ×
                      </Button>
                    </div>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      value={point.text}
                      onChange={(e) => updatePoint(index, { text: e.target.value })}
                      placeholder="Label shown for this point"
                      className="mb-2"
                    />
                    <VoiceRecorderButton
                      onUploaded={(url) => updatePoint(index, { audioUrl: url })}
                      disabled={saving || uploading}
                    />
                    {point.audioUrl && (
                      <audio
                        controls
                        preload="none"
                        src={point.audioUrl}
                        className="w-100 mt-2"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={handleHide} disabled={saving}>
          Cancel
        </Button>
        <Button
          variant="dark"
          onClick={handleSubmit}
          disabled={saving || uploading || !imageUrl}
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
          ) : (
            'Save image'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default InteractiveImageFormModal
