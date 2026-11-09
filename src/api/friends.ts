import { apiFetch } from '../utils/apiFetch'
import { parseApiError, toApiError } from '../utils/apiError'

export interface Friend {
  userId: string
  firstName: string
  lastName: string
  email: string
}

export interface FriendRequest {
  id: number
  senderUserId: string
  senderFirstName: string
  senderLastName: string
  recipientUserId: string
  recipientFirstName: string
  recipientLastName: string
  message?: string | null
  status: string
  createdAt: string
}

async function ensureSuccess(res: Response, fallback: string): Promise<void> {
  if (!res.ok) {
    throw await toApiError(res, fallback)
  }
}

export async function getFriends(): Promise<Friend[]> {
  const res = await apiFetch('/api/friends')
  await ensureSuccess(res, 'Could not load your friends.')
  return res.json()
}

export async function getReceivedFriendRequests(): Promise<FriendRequest[]> {
  const res = await apiFetch('/api/friends/requests/received')
  await ensureSuccess(res, 'Could not load received friend requests.')
  return res.json()
}

export async function getSentFriendRequests(): Promise<FriendRequest[]> {
  const res = await apiFetch('/api/friends/requests/sent')
  await ensureSuccess(res, 'Could not load sent friend requests.')
  return res.json()
}

export async function sendFriendRequest(
  userId: string,
): Promise<FriendRequest> {
  const res = await apiFetch(`/api/friends/requests/${userId}`, {
    method: 'POST',
    body: JSON.stringify({}),
  })
  if (!res.ok) {
    throw new Error(await parseApiError(res, 'Could not send friend request.'))
  }
  return res.json()
}

export async function acceptFriendRequest(requestId: number): Promise<void> {
  const res = await apiFetch(`/api/friends/requests/${requestId}/accept`, {
    method: 'POST',
  })
  await ensureSuccess(res, 'Could not accept friend request.')
}

export async function declineFriendRequest(requestId: number): Promise<void> {
  const res = await apiFetch(`/api/friends/requests/${requestId}/decline`, {
    method: 'POST',
  })
  await ensureSuccess(res, 'Could not decline friend request.')
}

export async function removeFriend(userId: string): Promise<void> {
  const res = await apiFetch(`/api/friends/${userId}`, {
    method: 'DELETE',
  })
  await ensureSuccess(res, 'Could not remove friend.')
}
