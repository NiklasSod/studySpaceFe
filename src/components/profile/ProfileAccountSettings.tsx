import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Collapse } from 'react-bootstrap'
import { ChevronDown } from 'react-bootstrap-icons'
import { useAuth } from '../../auth/AuthContext'
import { deleteAccount, type UserDto } from '../../api/user'
import ConfirmModal from '../ConfirmModal'
import ChangePasswordForm from './ChangePasswordForm'
import EditAccountForm from './EditAccountForm'

interface ProfileAccountSettingsProps {
  user: UserDto
  onUpdated: (user: UserDto) => void
  canDeleteSelf: boolean
}

interface SettingsSectionProps {
  title: string
  children: ReactNode
  bordered?: boolean
  danger?: boolean
}

function SettingsSection({
  title,
  children,
  bordered = false,
  danger = false,
}: SettingsSectionProps) {
  const [open, setOpen] = useState(false)
  const id = title.toLowerCase().replaceAll(' ', '-') + '-collapse'

  return (
    <div className={bordered ? 'border-top pt-4' : ''}>
      <Button
        type="button"
        variant="link"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={id}
        className={
          'd-flex align-items-center justify-content-between w-100 p-0 border-0 text-decoration-none pb-4'
        }
        style={{ color: 'var(--text-primary)' }}
      >
        <span className={`h5 fw-semibold mb-0 ${danger ? 'text-danger' : ''}`}>
          {title}
        </span>
        <ChevronDown
          aria-hidden="true"
          size={20}
          className={danger ? 'text-danger' : 'text-body-secondary'}
          style={{
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            flexShrink: 0,
          }}
        />
      </Button>
      <Collapse in={open}>
        <div id={id} className={bordered ? 'pt-3 pb-4' : 'pt-3 pb-4'}>
          {children}
        </div>
      </Collapse>
    </div>
  )
}

function ProfileAccountSettings({
  user,
  onUpdated,
  canDeleteSelf,
}: ProfileAccountSettingsProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const navigate = useNavigate()
  const { logout } = useAuth()

  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true)
      setDeleteError(null)
      await deleteAccount()
      await logout()
      navigate('/login', { replace: true })
    } catch (err: unknown) {
      setDeleteError(
        err instanceof Error ? err.message : 'Could not delete your account.',
      )
      setIsDeleting(false)
    }
  }

  return (
    <>
      <hr className="my-4" style={{ maxWidth: '400px' }} />
      <section
        className="d-flex flex-column"
        style={{ maxWidth: '400px' }}
        aria-label="Account settings"
      >
        <SettingsSection title="Edit profile">
          <p className="text-body-secondary mb-3">
            Update your first name, last name and / or email address.
          </p>
          <EditAccountForm key={user.id} user={user} onUpdated={onUpdated} />
        </SettingsSection>

        <SettingsSection title="Change password" bordered>
          <p className="text-body-secondary mb-3">
            Set a new password for your account.
          </p>
          <ChangePasswordForm />
        </SettingsSection>

        {canDeleteSelf && (
          <SettingsSection title="Delete profile" bordered danger>
            <p className="text-body-secondary mb-3">
              Permanently delete your account, your profile and all of your
              data.
              <br /> This action cannot be undone.
            </p>
            <Button
              variant="outline-danger"
              size="sm"
              style={{ maxWidth: '150px' }}
              onClick={() => setShowDeleteModal(true)}
            >
              Delete account
            </Button>
          </SettingsSection>
        )}
      </section>

      <ConfirmModal
        show={showDeleteModal}
        title="Delete account"
        confirmLabel="Delete account"
        busyLabel="Deleting..."
        variant="danger"
        isBusy={isDeleting}
        error={deleteError}
        onConfirm={handleDeleteAccount}
        onCancel={() => setShowDeleteModal(false)}
        message={
          <>
            Are you sure you want to permanently delete your account? This will
            remove your profile and all of your data. This action cannot be
            undone.
          </>
        }
      />
    </>
  )
}

export default ProfileAccountSettings
