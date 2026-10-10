import { Modal, Button } from 'react-bootstrap'
import { CardImage, Link45deg } from 'react-bootstrap-icons'

export type AddResourceKind = 'resource' | 'image'

interface AddResourceChooserModalProps {
  show: boolean
  onHide: () => void
  onPick: (kind: AddResourceKind) => void
}

function AddResourceChooserModal({
  show,
  onHide,
  onPick,
}: AddResourceChooserModalProps) {
  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Add resource</Modal.Title>
      </Modal.Header>
      <Modal.Body className="d-flex gap-3">
        <Button
          variant="outline-primary"
          className="d-flex flex-column align-items-center justify-content-center gap-2 py-4 flex-grow-1"
          onClick={() => onPick('resource')}
        >
          <Link45deg size={28} />
          Resource
        </Button>
        <Button
          variant="outline-primary"
          className="d-flex flex-column align-items-center justify-content-center gap-2 py-4 flex-grow-1"
          onClick={() => onPick('image')}
        >
          <CardImage size={28} />
          Interactive image
        </Button>
      </Modal.Body>
    </Modal>
  )
}

export default AddResourceChooserModal
