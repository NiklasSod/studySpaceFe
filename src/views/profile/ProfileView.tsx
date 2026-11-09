import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Alert, Col, Container, Form, Row, Spinner } from 'react-bootstrap'
import { useAuth } from '../../auth/AuthContext'
import { useEditMode } from '../../editMode/EditModeContext'
import { getUser } from '../../api/user'
import type { UserDto } from '../../api/user'
import { getProfile } from '../../api/userProfile'
import type { ProfileRequest } from '../../types/userProfile'
import { ApiError } from '../../utils/apiError'
import ProfileHeader from '../../components/profile/ProfileHeader'
import ProfileAbout from '../../components/profile/ProfileAbout'
import ProfileSkills from '../../components/profile/ProfileSkills'
import ProfileDetails from '../../components/profile/ProfileDetails'
import ProfileFriends from '../../components/profile/ProfileFriends'
import ProfileAccountSettings from '../../components/profile/ProfileAccountSettings'
import CreateProfileForm from '../../components/profile/CreateProfileForm'

const ProfileView = () => {
  const [user, setUser] = useState<UserDto>()
  const [userProfile, setUserProfile] = useState<ProfileRequest>()
  const [profileMissing, setProfileMissing] = useState(false)
  const [loadedOwnerId, setLoadedOwnerId] = useState<string>()
  const [error, setError] = useState<string | null>(null)

  const location = useLocation()
  const currUserId = location.state?.currUserId as string | undefined

  const { userId, role } = useAuth()
  const { editMode, setEditMode } = useEditMode()
  const myProfile = !currUserId || currUserId === userId
  const canDeleteSelf = myProfile && role?.toLowerCase() !== 'admin'
  const ownerId = currUserId ?? userId
  const loading = !ownerId || loadedOwnerId !== ownerId
  const isTeacher = role !== 'student'

  useEffect(() => {
    if (!ownerId) return
    let cancelled = false

    Promise.allSettled([getUser(ownerId), getProfile(ownerId)]).then(
      ([userResult, profileResult]) => {
        if (cancelled) return

        setError(null)
        if (userResult.status === 'fulfilled') {
          setUser(userResult.value)
        } else {
          const err = userResult.reason
          setError(
            err instanceof Error ? err.message : 'Could not load your account.',
          )
        }

        if (profileResult.status === 'fulfilled') {
          setUserProfile(profileResult.value)
          setProfileMissing(false)
        } else {
          const err = profileResult.reason
          if (err instanceof ApiError && err.status === 404) {
            setUserProfile(undefined)
            setProfileMissing(true)
          } else {
            setError(
              err instanceof Error ? err.message : 'Could not load profile.',
            )
          }
        }

        setLoadedOwnerId(ownerId)
      },
    )

    return () => {
      cancelled = true
    }
  }, [ownerId])

  const handleProfileCreated = (profile: ProfileRequest) => {
    setUserProfile(profile)
    setProfileMissing(false)
  }

  const roleLabel = user?.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
    : null
  const aboutMe = userProfile?.aboutMe?.trim()
  const skills = userProfile?.skills?.filter((skill) => skill.trim()) ?? []
  const whatsAppNumber = userProfile?.whatsAppNumber?.trim()
  const gitHubLink = userProfile?.gitHubLink?.trim()

  return (
    <Container className="py-4">
      {loading && (
        <div className="py-5 text-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading profile…</span>
          </Spinner>
        </div>
      )}

      {error && <Alert variant="danger">{error}</Alert>}

      {!loading && !error && user && (
        <>
          <ProfileHeader
            firstName={user.firstName}
            lastName={user.lastName}
            email={user.email}
            roleLabel={roleLabel}
            myProfile={myProfile}
          />

          <ProfileFriends
            key={user.id}
            profileUser={user}
            myProfile={myProfile}
            profileMissing={profileMissing}
          />

          {profileMissing && myProfile ? (
            <CreateProfileForm onCreated={handleProfileCreated} />
          ) : !profileMissing ? (
            <Row className="g-5">
              <Col lg={7}>
                <div className="mb-5">
                  <ProfileAbout aboutMe={aboutMe} />

                  {isTeacher && myProfile && (
                    <Form.Check
                      type="switch"
                      id="edit-mode-switch"
                      label="Edit mode"
                      checked={editMode}
                      onChange={(e) => setEditMode(e.target.checked)}
                      className="my-3"
                    />
                  )}
                </div>
                <ProfileSkills skills={skills} />
              </Col>

              <Col lg={5}>
                <ProfileDetails
                  dateOfBirth={userProfile?.dateOfBirth}
                  whatsAppNumber={whatsAppNumber}
                  gitHubLink={gitHubLink}
                />
              </Col>
            </Row>
          ) : null}

          <ProfileAccountSettings
            user={user}
            onUpdated={setUser}
            canDeleteSelf={canDeleteSelf}
          />
        </>
      )}
    </Container>
  )
}

export default ProfileView
