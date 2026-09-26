import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  Alert,
  Breadcrumb,
  Button,
  Card,
  Col,
  Container,
  Row,
  Spinner,
} from 'react-bootstrap'
import { BoxArrowUpRight } from 'react-bootstrap-icons'
import { getResourceById } from '../../api/resource'
import type { Resource } from '../../types/resource'
import { useAuth } from '../../auth/AuthContext'
import { DomainIcon } from '../../components/DomainIcon'
import ResourceDescription from '../../components/richText/ResourceDescription'
import CopyReferenceButton from '../../components/CopyReferenceButton'

export default function ResourceDetailView() {
  const { resourceId } = useParams<{ resourceId: string }>()
  const { role } = useAuth()
  const base = role === 'student' ? '/student' : '/teacher'
  const isTeacher = role !== 'student'

  const [resource, setResource] = useState<Resource | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!resourceId) return
    let ignore = false

    getResourceById(Number(resourceId))
      .then((data) => {
        if (!ignore) setResource(data)
      })
      .catch((err: unknown) => {
        if (!ignore) {
          setError(
            err instanceof Error ? err.message : 'Failed to load resource.',
          )
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })

    return () => {
      ignore = true
    }
  }, [resourceId])

  if (loading) {
    return (
      <Container className="py-4 text-center">
        <Spinner animation="border" role="status" />
      </Container>
    )
  }

  if (error || !resource) {
    return (
      <Container className="py-4">
        <Alert variant="danger">{error || 'Resource not found.'}</Alert>
        <Link to={`${base}/courses`}>Back to courses</Link>
      </Container>
    )
  }

  return (
    <Container className="py-4">
      <Breadcrumb>
        <Breadcrumb.Item
          linkAs={Link}
          linkProps={{ to: `${base}/courses` }}
          style={{ color: 'var(--link-color)' }}
        >
          Courses
        </Breadcrumb.Item>
        <Breadcrumb.Item active style={{ color: 'var(--text-primary)' }}>
          {resource.displayName}
        </Breadcrumb.Item>
      </Breadcrumb>

      <Row>
        <Col lg={8}>
          <Card className="shadow-sm">
            <Card.Body>
              <div className="d-flex align-items-center gap-2 mb-3">
                <DomainIcon
                  type="resource"
                  size={28}
                  className="text-primary"
                />
                <h2 className="h4 mb-0">{resource.displayName}</h2>
                {isTeacher && (
                  <CopyReferenceButton value={`/resources/${resource.id}`} />
                )}
              </div>

              {resource.description && (
                <ResourceDescription
                  html={resource.description}
                  audioUrls={resource.audioUrls}
                  className="card-text mb-3"
                />
              )}

              <div className="d-flex align-items-center gap-3">
                <Button
                  as="a"
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="primary"
                  size="sm"
                >
                  <BoxArrowUpRight className="me-1" />
                  Open resource
                </Button>
                <span className="text-muted small">
                  Added {new Date(resource.uploadDate).toLocaleDateString()}
                </span>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}
