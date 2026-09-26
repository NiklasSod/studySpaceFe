import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  Alert,
  Badge,
  Breadcrumb,
  Card,
  Col,
  Container,
  ListGroup,
  Row,
  Spinner,
} from 'react-bootstrap'
import {
  BoxArrowUpRight,
  JournalCheck,
  ListCheck,
  Link45deg,
} from 'react-bootstrap-icons'
import { getAssignmentById } from '../../api/assignment'
import { getActivityById } from '../../api/activity'
import { getResourceById } from '../../api/resource'
import type { Assignment } from '../../types/assignment'
import type { Activity } from '../../types/activity'
import type { Resource } from '../../types/resource'
import { extractInternalLinks } from '../../utils/internalLinks'
import { useAuth } from '../../auth/AuthContext'

interface LinkedActivity {
  type: 'activity'
  id: number
  item: Activity
}

interface LinkedResource {
  type: 'resource'
  id: number
  item: Resource
}

type LinkedItem = LinkedActivity | LinkedResource

function formatActivityDate(activity: Activity): string {
  const start = activity.startDate
    ? new Date(activity.startDate).toLocaleDateString()
    : ''
  const end = activity.endDate
    ? new Date(activity.endDate).toLocaleDateString()
    : ''
  if (start && end && start !== end) return `${start} - ${end}`
  return start || end || '-'
}

export default function AssignmentLinksView() {
  const { assignmentId } = useParams<{ assignmentId: string }>()
  const { role } = useAuth()
  const base = role === 'student' ? '/student' : '/teacher'

  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [items, setItems] = useState<LinkedItem[]>([])
  const [linkCount, setLinkCount] = useState(0)
  const [failedCount, setFailedCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!assignmentId) return
    let ignore = false

    async function load() {
      try {
        const assignmentData = await getAssignmentById(Number(assignmentId))
        if (ignore) return
        setAssignment(assignmentData)

        const refs = extractInternalLinks(assignmentData.description)
        setLinkCount(refs.length)

        const results = await Promise.allSettled(
          refs.map(async (ref) => {
            if (ref.type === 'activity') {
              const item = await getActivityById(ref.id)
              return { type: 'activity' as const, id: ref.id, item }
            }
            const item = await getResourceById(ref.id)
            return { type: 'resource' as const, id: ref.id, item }
          }),
        )

        if (ignore) return
        const loaded = results
          .filter(
            (result): result is PromiseFulfilledResult<LinkedItem> =>
              result.status === 'fulfilled',
          )
          .map((result) => result.value)
        setItems(loaded)
        setFailedCount(refs.length - loaded.length)
      } catch (err) {
        if (!ignore) {
          setError(
            err instanceof Error ? err.message : 'Failed to load assignment.',
          )
        }
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    load()

    return () => {
      ignore = true
    }
  }, [assignmentId])

  if (loading) {
    return (
      <Container className="py-4 text-center">
        <Spinner animation="border" role="status" />
      </Container>
    )
  }

  if (error || !assignment) {
    return (
      <Container className="py-4">
        <Alert variant="danger">{error || 'Assignment not found.'}</Alert>
        <Link to={`${base}/assignments`}>Back to assignments</Link>
      </Container>
    )
  }

  return (
    <Container className="py-4">
      <Breadcrumb>
        <Breadcrumb.Item
          linkAs={Link}
          linkProps={{ to: `${base}/assignments` }}
          style={{ color: 'var(--link-color)' }}
        >
          Assignments
        </Breadcrumb.Item>
        <Breadcrumb.Item active style={{ color: 'var(--text-primary)' }}>
          Linked items
        </Breadcrumb.Item>
      </Breadcrumb>

      <Row>
        <Col lg={8}>
          <h2 className="h4 mb-1">{assignment.name}</h2>
          <p className="text-muted mb-4">
            Everything this assignment points to, in one place.
          </p>

          {items.length === 0 && linkCount > 0 ? (
            <Alert variant="warning">
              Found {linkCount} linked item{linkCount === 1 ? '' : 's'}, but
              none could be loaded. You may not have access to the linked
              course, or the item was deleted.
            </Alert>
          ) : items.length === 0 ? (
            <Alert variant="secondary">
              This assignment does not link to any activities or resources.
            </Alert>
          ) : (
            <>
              <ListGroup>
                {items.map((linked) =>
                  linked.type === 'activity' ? (
                    <ListGroup.Item key={`a-${linked.id}`}>
                      <div className="d-flex justify-content-between align-items-start gap-2">
                        <div>
                          <div className="d-flex align-items-center gap-2 mb-1">
                            <ListCheck size={16} className="text-primary" />
                            <Link
                              to={`${base}/activities/${linked.id}`}
                              className="fw-semibold text-decoration-none"
                              style={{ color: 'var(--link-color)' }}
                            >
                              {linked.item.name}
                            </Link>
                            {linked.item.type && (
                              <Badge bg="secondary" className="ms-1">
                                {linked.item.type}
                              </Badge>
                            )}
                          </div>
                          <div className="text-muted small">
                            Activity · {formatActivityDate(linked.item)}
                          </div>
                        </div>
                      </div>
                    </ListGroup.Item>
                  ) : (
                    <ListGroup.Item key={`r-${linked.id}`}>
                      <div className="d-flex justify-content-between align-items-start gap-2">
                        <div>
                          <div className="d-flex align-items-center gap-2 mb-1">
                            <Link45deg size={16} className="text-primary" />
                            <Link
                              to={`${base}/resources/${linked.id}`}
                              className="fw-semibold text-decoration-none"
                              style={{ color: 'var(--link-color)' }}
                            >
                              {linked.item.displayName}
                            </Link>
                            <a
                              href={linked.item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`Open ${linked.item.displayName}`}
                              style={{ color: 'var(--link-color)' }}
                            >
                              <BoxArrowUpRight size={12} />
                            </a>
                          </div>
                          <div className="text-muted small">Resource</div>
                        </div>
                      </div>
                    </ListGroup.Item>
                  ),
                )}
              </ListGroup>
              {failedCount > 0 && (
                <Alert variant="warning" className="mt-3 mb-0">
                  {failedCount} of {linkCount} linked item
                  {linkCount === 1 ? '' : 's'} could not be loaded (no access or
                  deleted).
                </Alert>
              )}
            </>
          )}
        </Col>
      </Row>

      <Card className="border-0 shadow-sm mt-4">
        <Card.Body className="d-flex align-items-center gap-2 text-muted">
          <JournalCheck size={18} />
          <span className="small">
            Linked from assignment description references such as{' '}
            <code>/activities/5</code>, <code>/resources/9</code>, or{' '}
            <code>[read pages 4-5](/activities/5)</code>.
          </span>
        </Card.Body>
      </Card>
    </Container>
  )
}
