import { useState } from 'react'
import { Button } from 'react-bootstrap'
import { Trash } from 'react-bootstrap-icons'
import { deleteResourceAudio } from '../../api/resource'
import ConfirmModal from '../ConfirmModal'

interface DeleteRecordingButtonProps {
  /**
   * Id of the saved resource the recording belongs to. Omit while the resource
   * has not been created yet: there is nothing to delete on the server then.
   */
  resourceId?: number
  audioUrl: string
  disabled?: boolean
  /** Overrides the confirmation text when the delete does something extra. */
  message?: string
  /** Called once the recording is gone, so the caller can drop it from its state. */
  onDeleted: () => void
}

/**
 * Deletes one recording. For a saved resource it is removed from the resource and
 * destroyed in Cloudinary straight away (`DELETE /api/resources/{id}/audio`);
 * for a resource that is still being created it only leaves the form.
 */
function DeleteRecordingButton({
  resourceId,
  audioUrl,
  disabled,
  message = 'The recording is deleted immediately and cannot be restored.',
  onDeleted,
}: DeleteRecordingButtonProps) {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    if (resourceId === undefined) {
      setConfirming(false)
      onDeleted()
      return
    }

    setDeleting(true)
    setError(null)
    try {
      await deleteResourceAudio(resourceId, audioUrl)
      setConfirming(false)
      onDeleted()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not delete the recording.',
      )
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <Button
        variant="outline-danger"
        size="sm"
        className="py-0 px-2"
        disabled={disabled}
        onClick={() => {
          setError(null)
          setConfirming(true)
        }}
        title="Delete this recording"
      >
        <Trash />
      </Button>
      <ConfirmModal
        show={confirming}
        title="Delete recording"
        message={message}
        confirmLabel="Delete"
        busyLabel="Deleting…"
        isBusy={deleting}
        error={error}
        onConfirm={() => void handleDelete()}
        onCancel={() => setConfirming(false)}
      />
    </>
  )
}

export default DeleteRecordingButton
