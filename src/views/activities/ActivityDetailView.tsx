import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  Alert,
  Badge,
  Breadcrumb,
  Card,
  Col,
  Container,
  Row,
  Spinner,
} from 'react-bootstrap'
import { getActivityById } from '../../api/activity'
import type { Activity } from '../../types/activity'
import { useAuth } from '../../auth/AuthContext'
import { DomainIcon } from '../../components/DomainIcon'
import LinkedRichText from '../../components/richText/LinkedRichText'
import ActivityResourcesInline from '../../components/resources/ActivityResourcesInline'
import CopyReferenceButton from '../../components/CopyReferenceButton'

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

export default function ActivityDetailView() {
  const { activityId } = useParams<{ activityId: string }>()
  const { role } = useAuth()
  const base = role === 'student' ? '/student' : '/teacher'
  const isTeacher = role !== 'student'

  const [activity, setActivity] = useState<Activity | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!activityId) return
    let ignore = false

    getActivityById(Number(activityId))
      .then((data) => {
        if (!ignore) setActivity(data)
      })
      .catch((err: unknown) => {
        if (!ignore) {
          setError(
            err instanceof Error ? err.message : 'Failed to load activity.',
          )
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })

    return () => {
      ignore = true
    }
  }, [activityId])

  if (loading) {
    return (
      <Container className="py-4 text-center">
        <Spinner animation="border" role="status" />
      </Container>
    )
  }

  if (error || !activity) {
    return (
      <Container className="py-4">
        <Alert variant="danger">{error || 'Activity not found.'}</Alert>
        <Link to={`${base}/activities`}>Back to activities</Link>
      </Container>
    )
  }

  return (
    <Container className="py-4">
      <Breadcrumb>
        <Breadcrumb.Item
          linkAs={Link}
          linkProps={{ to: `${base}/activities` }}
          style={{ color: 'var(--link-color)' }}
        >
          Activities
        </Breadcrumb.Item>
        <Breadcrumb.Item active style={{ color: 'var(--text-primary)' }}>
          {activity.name}
        </Breadcrumb.Item>
      </Breadcrumb>

      <Row>
        <Col lg={8}>
          <Card className="shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div className="d-flex align-items-center gap-2">
                  <DomainIcon
                    type="activity"
                    size={28}
                    className="text-primary"
                  />
                  <h2 className="h4 mb-0">{activity.name}</h2>
                  {isTeacher && (
                    <CopyReferenceButton value={`/activities/${activity.id}`} />
                  )}
                </div>
                {activity.type && (
                  <Badge bg="secondary" className="ms-2">
                    {activity.type}
                  </Badge>
                )}
              </div>

              <p className="text-muted small">
                Occurs: {formatActivityDate(activity)}
              </p>

              {activity.description && (
                <LinkedRichText
                  html={activity.description}
                  className="card-text mb-3"
                />
              )}

              <ActivityResourcesInline activityId={activity.id} />
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}
