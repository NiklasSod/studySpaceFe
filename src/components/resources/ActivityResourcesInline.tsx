import { useEffect, useRef, useState } from 'react'
import type { Editor } from '@tiptap/react'
import { Alert, Button, Form, ListGroup, Spinner } from 'react-bootstrap'
import { BoxArrowUpRight } from 'react-bootstrap-icons'
import { useAuth } from '../../auth/AuthContext'
import { useEditMode } from '../../editMode/EditModeContext'
import {
  createResource,
  deleteResource,
  getActivityResources,
  updateResource,
} from '../../api/resource'
import type { Resource } from '../../types/resource'
import ResourceDescription from '../richText/ResourceDescription'
import RichTextEditor from '../richText/RichTextEditor'
import VoiceRecorderButton from './VoiceRecorderButton'
import CopyReferenceButton from '../CopyReferenceButton'

interface ActivityResourcesInlineProps {
  activityId: number
}

function normalizeUrl(raw: string): string {
  const value = raw.trim()
  if (!value) return value
  if (/^https?:\/\//i.test(value)) return value
  return `https://${value}`
}

function ActivityResourcesInline({ activityId }: ActivityResourcesInlineProps) {
  const { role, userId } = useAuth()
  const { editMode } = useEditMode()
  const isTeacher = role !== 'student'
  const canEdit = isTeacher && editMode

  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [desc, setDesc] = useState('')
  const [audioUrls, setAudioUrls] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const editorRef = useRef<Editor | null>(null)

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [editUrl, setEditUrl] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editAudioUrls, setEditAudioUrls] = useState<string[]>([])

  const editEditorRef = useRef<Editor | null>(null)

  const [deleteId, setDeleteId] = useState<number | null>(null)

  useEffect(() => {
    let ignore = false

    async function fetchResources() {
      try {
        const data = await getActivityResources(activityId)

        if (ignore) return
        setError(null)
        setResources(Array.isArray(data) ? data : [])
      } catch (err) {
        if (ignore) return
        setError(
          err instanceof Error ? err.message : 'Failed to load resources.',
        )
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    fetchResources()

    return () => {
      ignore = true
    }
  }, [activityId])

  const startAdd = () => {
    setAdding(true)
    setName('')
    setUrl('')
    setDesc('')
    setAudioUrls([])
    setFormError(null)
  }

  const submitAdd = async () => {
    const link = normalizeUrl(url)
    if (!name.trim() || !link) {
      setFormError('Please provide both a name and a valid link.')
      return
    }

    setSaving(true)
    setFormError(null)
    try {
      const created = await createResource({
        displayName: name.trim(),
        url: link,
        description: desc,
        ...(audioUrls.length > 0 ? { audioUrls } : {}),
        activityId,
      })
      setResources((prev) => [...prev, created])
      setAdding(false)
      setName('')
      setUrl('')
      setDesc('')
      setAudioUrls([])
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Could not add resource.',
      )
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (resource: Resource) => {
    setEditingId(resource.id)
    setEditName(resource.displayName)
    setEditUrl(resource.url)
    setEditDesc(resource.description ?? '')
    setEditAudioUrls(resource.audioUrls ?? [])
    setFormError(null)
  }

  const submitEdit = async () => {
    if (editingId === null) return
    const link = normalizeUrl(editUrl)
    if (!editName.trim() || !link) {
      setFormError('Please provide both a name and a valid link.')
      return
    }

    setSaving(true)
    setFormError(null)
    try {
      const updated = await updateResource(editingId, {
        displayName: editName.trim(),
        url: link,
        description: editDesc,
        audioUrls: editAudioUrls,
      })
      setResources((prev) =>
        prev.map((r) => (r.id === updated.id ? updated : r)),
      )
      setEditingId(null)
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Could not update resource.',
      )
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async (id: number) => {
    try {
      await deleteResource(id)
      setResources((prev) => prev.filter((r) => r.id !== id))
      setDeleteId(null)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not delete resource.',
      )
    }
  }

  const handleAddAudioUploaded = (audioUrl: string) => {
    const index = audioUrls.length
    setAudioUrls((prev) => [...prev, audioUrl])
    editorRef.current?.chain().focus().insertContent(`[[audio:${index}]]`).run()
  }

  const removeAddAudio = (index: number) => {
    setAudioUrls((prev) => prev.filter((_, i) => i !== index))
  }

  const handleEditAudioUploaded = (audioUrl: string) => {
    const index = editAudioUrls.length
    setEditAudioUrls((prev) => [...prev, audioUrl])
    editEditorRef.current
      ?.chain()
      .focus()
      .insertContent(`[[audio:${index}]]`)
      .run()
  }

  const removeEditAudio = (index: number) => {
    setEditAudioUrls((prev) => prev.filter((_, i) => i !== index))
  }

  if (loading) {
    return (
      <div className="text-center py-1">
        <Spinner animation="border" size="sm" role="status" />
      </div>
    )
  }

  return (
    <div className="mt-2 small">
      <div className="d-flex justify-content-between align-items-center">
        <span className="fw-semibold text-secondary">Resources</span>
        {isTeacher && !adding && (
          <Button
            variant="outline-primary"
            size="sm"
            className="py-0 px-2 small"
            onClick={startAdd}
          >
            + Add
          </Button>
        )}
      </div>

      {error && (
        <Alert variant="danger" className="py-1 px-2 small mb-0 mt-1">
          {error}
        </Alert>
      )}
      {formError && (
        <Alert variant="danger" className="py-1 px-2 small mb-0 mt-1">
          {formError}
        </Alert>
      )}

      {resources.length === 0 && !adding && (
        <div className="text-muted">No resources.</div>
      )}

      <ListGroup variant="flush">
        {resources.map((resource) => {
          const isOwner = canEdit && resource.creatorId === userId

          if (editingId === resource.id) {
            return (
              <ListGroup.Item
                key={resource.id}
                className="px-0 py-2 bg-transparent border-0"
              >
                <Form.Control
                  size="sm"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="mb-1"
                  placeholder="Name"
                />
                <Form.Control
                  size="sm"
                  value={editUrl}
                  onChange={(e) => setEditUrl(e.target.value)}
                  className="mb-1"
                  placeholder="https://…"
                />
                <RichTextEditor
                  value={editDesc}
                  onChange={setEditDesc}
                  placeholder="Description"
                  minHeight={90}
                  editorRef={editEditorRef}
                />
                {isTeacher && (
                  <>
                    <VoiceRecorderButton
                      onUploaded={handleEditAudioUploaded}
                      disabled={saving}
                    />
                    {editAudioUrls.length > 0 && (
                      <div className="d-flex flex-column gap-1 my-1">
                        {editAudioUrls.map((audioUrl, index) => (
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
                              size="sm"
                              variant="outline-danger"
                              className="py-0 px-2"
                              onClick={() => removeEditAudio(index)}
                              title="Remove voice note"
                            >
                              ×
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
                <div className="d-flex gap-2">
                  <Button
                    size="sm"
                    variant="primary"
                    className="py-0 px-2"
                    disabled={saving}
                    onClick={submitEdit}
                  >
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="py-0 px-2"
                    onClick={() => setEditingId(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </ListGroup.Item>
            )
          }

          return (
            <ListGroup.Item
              key={resource.id}
              className="px-0 py-1 bg-transparent border-0 d-flex justify-content-between align-items-start"
            >
              <div className="me-2 p-1">
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-decoration-none d-inline-flex align-items-center gap-1"
                  style={{ color: 'var(--link-color)' }}
                >
                  <span className="text-break">{resource.displayName}</span>
                  <BoxArrowUpRight
                    size={10}
                    className="flex-shrink-0"
                    style={{ width: 10, height: 10, flexShrink: 0 }}
                  />
                </a>
                {resource.description && (
                  <ResourceDescription
                    html={resource.description}
                    audioUrls={resource.audioUrls}
                    className="text-muted mt-1"
                  />
                )}
              </div>
              {isTeacher && (
                <div className="d-flex gap-2 flex-shrink-0 align-items-center">
                  <CopyReferenceButton value={`/resources/${resource.id}`} />
                  {isOwner && (
                    <>
                      <Button
                        size="sm"
                        variant="outline-secondary"
                        className="py-0 px-2 small"
                        onClick={() => startEdit(resource)}
                      >
                        Edit
                      </Button>
                      {deleteId === resource.id ? (
                        <span className="d-inline-flex gap-1 align-items-center">
                          <Button
                            size="sm"
                            variant="outline-danger"
                            className="py-0 px-2 small"
                            onClick={() => confirmDelete(resource.id)}
                          >
                            Confirm
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="py-0 px-2 small"
                            onClick={() => setDeleteId(null)}
                          >
                            Cancel
                          </Button>
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline-danger"
                          className="py-0 px-2 small"
                          onClick={() => setDeleteId(resource.id)}
                        >
                          Delete
                        </Button>
                      )}
                    </>
                  )}
                </div>
              )}
            </ListGroup.Item>
          )
        })}
      </ListGroup>

      {adding && (
        <div className="mt-2">
          <Form.Control
            size="sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mb-1"
            placeholder="Name"
          />
          <Form.Control
            size="sm"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="mb-1"
            placeholder="https://…"
          />
          <RichTextEditor
            value={desc}
            onChange={setDesc}
            placeholder="Description"
            minHeight={90}
            editorRef={editorRef}
          />
          {isTeacher && (
            <>
              <VoiceRecorderButton
                onUploaded={handleAddAudioUploaded}
                disabled={saving}
              />
              {audioUrls.length > 0 && (
                <div className="d-flex flex-column gap-1 my-1">
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
                        size="sm"
                        variant="outline-danger"
                        className="py-0 px-2"
                        onClick={() => removeAddAudio(index)}
                        title="Remove voice note"
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
          <div className="d-flex gap-2">
            <Button
              size="sm"
              variant="primary"
              className="py-0 px-2"
              disabled={saving}
              onClick={submitAdd}
            >
              Save
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="py-0 px-2"
              onClick={() => setAdding(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ActivityResourcesInline
