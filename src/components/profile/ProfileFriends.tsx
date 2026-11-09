import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert, Button, ListGroup, Spinner } from 'react-bootstrap'
import { useAuth } from '../../auth/AuthContext'
import {
  acceptFriendRequest,
  declineFriendRequest,
  getFriends,
  getReceivedFriendRequests,
  getSentFriendRequests,
  removeFriend,
  sendFriendRequest,
} from '../../api/friends'
import type { Friend, FriendRequest } from '../../api/friends'
import type { UserDto } from '../../api/user'

interface ProfileFriendsProps {
  profileUser: UserDto
  myProfile: boolean
  profileMissing: boolean
  onFriendshipChanged: (isFriend: boolean) => Promise<void>
}

function ProfileFriends({
  profileUser,
  myProfile,
  profileMissing,
  onFriendshipChanged,
}: ProfileFriendsProps) {
  const [friends, setFriends] = useState<Friend[]>([])
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([])
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [dataError, setDataError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [isBusy, setIsBusy] = useState(false)

  const navigate = useNavigate()
  const { role } = useAuth()

  useEffect(() => {
    let cancelled = false

    Promise.all([
      getFriends(),
      getReceivedFriendRequests(),
      getSentFriendRequests(),
    ])
      .then(([friendList, received, sent]) => {
        if (cancelled) return
        setFriends(friendList)
        setReceivedRequests(received)
        setSentRequests(sent)
        setDataError(null)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setDataError(
            err instanceof Error
              ? err.message
              : 'Could not load friend details.',
          )
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [profileUser.id])

  const isFriend = friends.some((friend) => friend.userId === profileUser.id)
  const incomingRequest = receivedRequests.find(
    (request) => request.senderUserId === profileUser.id,
  )
  const outgoingRequest = sentRequests.find(
    (request) => request.recipientUserId === profileUser.id,
  )

  const runAction = async (action: () => Promise<void>) => {
    setIsBusy(true)
    setActionError(null)
    try {
      await action()
    } catch (err: unknown) {
      setActionError(
        err instanceof Error ? err.message : 'Could not update friendship.',
      )
    } finally {
      setIsBusy(false)
    }
  }

  const handleSendRequest = () =>
    runAction(async () => {
      const request = await sendFriendRequest(profileUser.id)
      setSentRequests((current) => [...current, request])
    })

  const handleAcceptRequest = () => {
    if (!incomingRequest) return
    return runAction(async () => {
      await acceptFriendRequest(incomingRequest.id)
      setReceivedRequests((current) =>
        current.filter((request) => request.id !== incomingRequest.id),
      )
      setFriends((current) => [
        ...current,
        {
          userId: profileUser.id,
          firstName: profileUser.firstName,
          lastName: profileUser.lastName,
          email: profileUser.email,
        },
      ])
      await onFriendshipChanged(true)
    })
  }

  const handleDeclineRequest = () => {
    if (!incomingRequest) return
    return runAction(async () => {
      await declineFriendRequest(incomingRequest.id)
      setReceivedRequests((current) =>
        current.filter((request) => request.id !== incomingRequest.id),
      )
    })
  }

  const handleRemoveFriend = () =>
    runAction(async () => {
      await removeFriend(profileUser.id)
      setFriends((current) =>
        current.filter((friend) => friend.userId !== profileUser.id),
      )
      await onFriendshipChanged(false)
    })

  if (myProfile) {
    return (
      <section className="mt-5">
        <h2 className="h5 fw-semibold mb-3">Friends</h2>
        {dataError ? (
          <Alert variant="danger">{dataError}</Alert>
        ) : loading ? (
          <Spinner animation="border" size="sm" role="status">
            <span className="visually-hidden">Loading friends…</span>
          </Spinner>
        ) : friends.length === 0 ? (
          <p className="text-body-secondary">You have no friends yet.</p>
        ) : (
          <ListGroup>
            {friends.map((friend) => (
              <ListGroup.Item
                key={friend.userId}
                action
                onClick={() =>
                  navigate(`/${role}/profile`, {
                    state: { currUserId: friend.userId },
                  })
                }
              >
                {friend.firstName} {friend.lastName}
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
        <hr className="my-4" style={{ maxWidth: '400px' }}></hr>
      </section>
    )
  }

  return (
    <section className="mb-4" aria-label="Friend relationship">
      {actionError && <Alert variant="danger">{actionError}</Alert>}
      {dataError ? (
        <Alert variant="danger">{dataError}</Alert>
      ) : loading ? (
        <Spinner animation="border" size="sm" role="status">
          <span className="visually-hidden">Loading friend status…</span>
        </Spinner>
      ) : isFriend ? (
        <>
          {profileMissing && (
            <Alert variant="info">
              This user hasn&apos;t set up their profile yet.
            </Alert>
          )}
          <Button
            variant="outline-danger"
            onClick={handleRemoveFriend}
            disabled={isBusy}
          >
            {isBusy ? 'Removing friend…' : 'Remove friend'}
          </Button>
        </>
      ) : incomingRequest ? (
        <>
          <Alert variant="info">
            This profile cannot be viewed until you become friends. Accept the
            friend request to view it.
          </Alert>
          <div className="d-flex gap-2">
            <Button onClick={handleAcceptRequest} disabled={isBusy}>
              {isBusy ? 'Accepting…' : 'Accept request'}
            </Button>
            <Button
              variant="outline-secondary"
              onClick={handleDeclineRequest}
              disabled={isBusy}
            >
              Decline
            </Button>
          </div>
        </>
      ) : outgoingRequest ? (
        <Alert variant="info">
          This profile cannot be viewed until you become friends. Your friend
          request is pending.
        </Alert>
      ) : (
        <>
          <Alert variant="info">
            This profile cannot be viewed until you become friends.
          </Alert>
          <Button onClick={handleSendRequest} disabled={isBusy}>
            {isBusy ? 'Sending…' : 'Send friend request'}
          </Button>
        </>
      )}
    </section>
  )
}

export default ProfileFriends
