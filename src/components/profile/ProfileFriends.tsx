import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert, Button, Form, ListGroup, Spinner } from 'react-bootstrap'
import { useAuth } from '../../auth/AuthContext'
import PaginationControls from '../PaginationControls'
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
}

type FriendSummary = Pick<Friend, 'userId' | 'firstName' | 'lastName'>

type FriendListEntry =
  | ({ type: 'friend' } & FriendSummary)
  | {
      type: 'received' | 'sent'
      userId: string
      firstName: string
      lastName: string
      request: FriendRequest
    }

const PAGE_SIZE = 5
const FRIEND_REQUEST_MESSAGE_MAX_LENGTH = 140

function ProfileFriends({
  profileUser,
  myProfile,
  profileMissing,
}: ProfileFriendsProps) {
  const [friends, setFriends] = useState<FriendSummary[]>([])
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([])
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [dataError, setDataError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [isBusy, setIsBusy] = useState(false)
  const [requestMessage, setRequestMessage] = useState('')

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
        setFriends(
          friendList.map(({ userId, firstName, lastName }) => ({
            userId,
            firstName,
            lastName,
          })),
        )
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

  const friendList: FriendListEntry[] = [
    ...friends.map((friend) => ({ type: 'friend' as const, ...friend })),
    ...receivedRequests.map((request) => ({
      type: 'received' as const,
      userId: request.senderUserId,
      firstName: request.senderFirstName,
      lastName: request.senderLastName,
      request,
    })),
    ...sentRequests.map((request) => ({
      type: 'sent' as const,
      userId: request.recipientUserId,
      firstName: request.recipientFirstName,
      lastName: request.recipientLastName,
      request,
    })),
  ]
  const pageCount = Math.max(1, Math.ceil(friendList.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const visibleFriends = friendList.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
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
      const request = await sendFriendRequest(
        profileUser.id,
        requestMessage.trim(),
      )
      setSentRequests((current) => [...current, request])
      setRequestMessage('')
    })

  const handleAcceptRequest = (request: FriendRequest) =>
    runAction(async () => {
      await acceptFriendRequest(request.id)
      setReceivedRequests((current) =>
        current.filter((item) => item.id !== request.id),
      )
      setFriends((current) => [
        ...current,
        {
          userId: request.senderUserId,
          firstName: request.senderFirstName,
          lastName: request.senderLastName,
        },
      ])
    })

  const handleDeclineRequest = (request: FriendRequest) =>
    runAction(async () => {
      await declineFriendRequest(request.id)
      setReceivedRequests((current) =>
        current.filter((item) => item.id !== request.id),
      )
    })

  const handleRemoveFriend = (userId: string) =>
    runAction(async () => {
      await removeFriend(userId)
      setFriends((current) =>
        current.filter((friend) => friend.userId !== userId),
      )
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
        ) : friendList.length === 0 ? (
          <p className="text-body-secondary">You have no friends yet.</p>
        ) : (
          <>
            <ListGroup>
              {visibleFriends.map((friend) => (
                <ListGroup.Item
                  key={`${friend.type}-${friend.userId}`}
                  className="d-flex align-items-center justify-content-between gap-3"
                >
                  <div>
                    <Button
                      variant="link"
                      className="p-0 text-start text-decoration-none"
                      onClick={() =>
                        navigate(`/${role}/profile`, {
                          state: { currUserId: friend.userId },
                        })
                      }
                    >
                      {friend.firstName} {friend.lastName}
                    </Button>
                    {friend.type === 'received' && friend.request.message && (
                      <p className="mb-0 small text-body-secondary">
                        {friend.request.message}
                      </p>
                    )}
                  </div>
                  {friend.type === 'friend' ? (
                    <Button
                      size="sm"
                      variant="outline-danger"
                      onClick={() => handleRemoveFriend(friend.userId)}
                      disabled={isBusy}
                    >
                      Remove friend
                    </Button>
                  ) : friend.type === 'received' ? (
                    <div className="d-flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleAcceptRequest(friend.request)}
                        disabled={isBusy}
                      >
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline-secondary"
                        onClick={() => handleDeclineRequest(friend.request)}
                        disabled={isBusy}
                      >
                        Decline
                      </Button>
                    </div>
                  ) : (
                    <span className="text-body-secondary small">
                      Request pending
                    </span>
                  )}
                </ListGroup.Item>
              ))}
            </ListGroup>
            <PaginationControls
              page={currentPage}
              pageCount={pageCount}
              onPageChange={setPage}
            />
          </>
        )}
        {actionError && (
          <Alert className="mt-3" variant="danger">
            {actionError}
          </Alert>
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
        profileMissing && (
          <Alert variant="info">
            This user hasn&apos;t set up their profile yet.
          </Alert>
        )
      ) : incomingRequest ? (
        <Alert variant="info">
          This profile cannot be viewed until you become friends. Accept the
          friend request from your personal profile to view it.
        </Alert>
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
          <Form.Group className="mb-2" controlId="friend-request-message">
            <Form.Label>
              Message <span className="text-body-secondary">(optional)</span>
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              maxLength={FRIEND_REQUEST_MESSAGE_MAX_LENGTH}
              value={requestMessage}
              onChange={(event) => setRequestMessage(event.target.value)}
              placeholder="Add a message to your friend request"
              aria-describedby="friend-request-message-count"
            />
            <Form.Text
              id="friend-request-message-count"
              className="d-block text-end"
            >
              {requestMessage.length}/{FRIEND_REQUEST_MESSAGE_MAX_LENGTH}
            </Form.Text>
          </Form.Group>
          <Button onClick={handleSendRequest} disabled={isBusy}>
            {isBusy ? 'Sending…' : 'Send friend request'}
          </Button>
        </>
      )}
    </section>
  )
}

export default ProfileFriends
