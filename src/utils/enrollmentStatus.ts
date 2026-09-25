export type EnrollmentStatusKind = 'pending' | 'approved' | 'denied' | 'unknown'

export function normalizeEnrollmentStatus(
  status: string | null | undefined,
): EnrollmentStatusKind {
  const s = (status ?? '').trim().toLowerCase()
  if (s === 'pending') return 'pending'
  if (s === 'approved') return 'approved'
  if (s === 'denied') return 'denied'
  return 'unknown'
}

export function enrollmentStatusLabel(
  status: string | null | undefined,
): string {
  switch (normalizeEnrollmentStatus(status)) {
    case 'pending':
      return 'Pending'
    case 'approved':
      return 'Approved'
    case 'denied':
      return 'Denied'
    default:
      return 'Unknown'
  }
}

export function enrollmentStatusBadgeBg(
  status: string | null | undefined,
): string {
  switch (normalizeEnrollmentStatus(status)) {
    case 'pending':
      return 'warning'
    case 'approved':
      return 'success'
    case 'denied':
      return 'secondary'
    default:
      return 'light'
  }
}
