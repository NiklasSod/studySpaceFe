import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Alert,
  Button,
  Card,
  Col,
  Container,
  Form,
  Row,
  Spinner,
} from 'react-bootstrap'
import { ChevronDown, ChevronUp, Star, StarFill } from 'react-bootstrap-icons'
import { useAuth } from '../../auth/AuthContext'
import { getMyResources, updateResourceProgress } from '../../api/resource'
import type {
  MyResource,
  UpdateResourceProgressRequest,
  UserResourceProgressStatus,
} from '../../types/resource'
import { DomainIcon } from '../../components/DomainIcon'
import PaginationControls from '../../components/PaginationControls'
import ResourceDescription from '../../components/richText/ResourceDescription'

const PAGE_SIZE = 2
const STATUSES: UserResourceProgressStatus[] = [
  'Current',
  'CheckLater',
  'Done',
  'Archived',
]
type SectionKey = UserResourceProgressStatus | 'Favorites'

const INITIAL_OPEN_SECTIONS = new Set<SectionKey>(['Current', 'Favorites'])

function ResourceCard({
  resource,
  basePath,
  updating,
  onUpdate,
}: {
  resource: MyResource
  basePath: string
  updating: boolean
  onUpdate: (
    resource: MyResource,
    update: UpdateResourceProgressRequest,
  ) => void
}) {
  const [imageExpanded, setImageExpanded] = useState(false)
  const resourcePath = `${basePath}/resources/${resource.id}`

  return (
    <Card className="h-100 border shadow-sm">
      <Card.Body className="d-flex flex-column">
        <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
          <Card.Title className="h5 mb-0">
            <Link
              to={resourcePath}
              className="text-decoration-none"
              style={{ color: 'var(--link-color)' }}
            >
              {resource.displayName}
            </Link>
          </Card.Title>
          <Button
            type="button"
            variant="link"
            className="p-0 text-warning flex-shrink-0"
            aria-label={
              resource.isFavorite ? 'Remove from favorites' : 'Add to favorites'
            }
            title={
              resource.isFavorite ? 'Remove from favorites' : 'Add to favorites'
            }
            disabled={
              updating ||
              (!resource.isFavorite &&
                resource.userProgressStatus !== 'Current' &&
                resource.userProgressStatus !== 'Done')
            }
            onClick={() =>
              onUpdate(resource, { isFavorite: !resource.isFavorite })
            }
          >
            {resource.isFavorite ? <StarFill /> : <Star />}
          </Button>
        </div>

        {resource.isInteractiveImage && (
          <div className="mb-2">
            <div
              className="overflow-hidden rounded"
              style={{
                height: imageExpanded ? 280 : 110,
                backgroundColor: 'var(--input-bg)',
                border: '1px solid var(--input-border)',
              }}
            >
              <img
                src={resource.url}
                alt={resource.displayName}
                className="w-100 h-100"
                style={{ objectFit: 'contain' }}
              />
            </div>
            <Button
              type="button"
              variant="link"
              size="sm"
              className="p-0 text-decoration-none"
              onClick={() => setImageExpanded((expanded) => !expanded)}
            >
              {imageExpanded ? 'Show less' : 'Show more'}
            </Button>
          </div>
        )}

        {resource.description && (
          <ResourceDescription
            html={resource.description}
            audioUrls={resource.audioUrls}
            lines={3}
            className="text-muted small mb-2"
          />
        )}

        <Form.Group
          controlId={`resource-status-${resource.id}`}
          className="mt-auto pt-2"
        >
          <Form.Label className="small text-muted mb-1">Status</Form.Label>
          <Form.Select
            size="sm"
            value={resource.userProgressStatus}
            disabled={updating}
            onChange={(event) => {
              const status = STATUSES.find(
                (candidate) => candidate === event.currentTarget.value,
              )
              if (status) onUpdate(resource, { userProgressStatus: status })
            }}
          >
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {status === 'CheckLater' ? 'Check later' : status}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
      </Card.Body>
    </Card>
  )
}

function MyResourcesView() {
  const { role } = useAuth()
  const basePath = role === 'student' ? '/student' : '/teacher'
  const [resources, setResources] = useState<MyResource[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingIds, setUpdatingIds] = useState<Set<number>>(() => new Set())
  const [openSections, setOpenSections] = useState<Set<SectionKey>>(
    INITIAL_OPEN_SECTIONS,
  )
  const [pages, setPages] = useState<Record<SectionKey, number>>({
    Favorites: 1,
    Current: 1,
    CheckLater: 1,
    Done: 1,
    Archived: 1,
  })

  useEffect(() => {
    let ignore = false

    getMyResources()
      .then((data) => {
        if (!ignore) setResources(data)
      })
      .catch((err: unknown) => {
        if (!ignore) {
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to load your resources.',
          )
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })

    return () => {
      ignore = true
    }
  }, [])

  const handleUpdate = async (
    resource: MyResource,
    update: UpdateResourceProgressRequest,
  ) => {
    setError(null)
    setUpdatingIds((previous) => new Set(previous).add(resource.id))

    try {
      const updated = await updateResourceProgress(resource.id, update)
      setResources((previous) =>
        previous.map((item) =>
          item.id === updated.resourceId
            ? {
                ...item,
                userProgressStatus: updated.userProgressStatus,
                isFavorite: updated.isFavorite,
              }
            : item,
        ),
      )
      setPages({
        Favorites: 1,
        Current: 1,
        CheckLater: 1,
        Done: 1,
        Archived: 1,
      })
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not update resource progress.',
      )
    } finally {
      setUpdatingIds((previous) => {
        const next = new Set(previous)
        next.delete(resource.id)
        return next
      })
    }
  }

  const toggleSection = (section: SectionKey) => {
    setOpenSections((previous) => {
      const next = new Set(previous)
      if (next.has(section)) next.delete(section)
      else next.add(section)
      return next
    })
  }

  const renderSection = (
    section: SectionKey,
    sectionResources: MyResource[],
    emptyMessage: string,
  ) => {
    const isOpen = openSections.has(section)
    const page = pages[section]
    const pageCount = Math.max(
      1,
      Math.ceil(sectionResources.length / PAGE_SIZE),
    )
    const visibleResources = sectionResources.slice(
      (page - 1) * PAGE_SIZE,
      page * PAGE_SIZE,
    )
    const title = section === 'Favorites' ? 'Favorites' : section
    const sectionId = `my-resources-${section.toLowerCase()}`

    return (
      <Card key={section} className="border-0 shadow-sm mb-4">
        <Card.Header className="p-0">
          <Button
            type="button"
            variant="link"
            className="w-100 d-flex align-items-center justify-content-between text-body text-decoration-none fw-semibold px-3 py-3"
            aria-expanded={isOpen}
            aria-controls={sectionId}
            onClick={() => toggleSection(section)}
          >
            <span>
              {title}{' '}
              <span className="text-muted">({sectionResources.length})</span>
            </span>
            {isOpen ? (
              <ChevronUp aria-hidden="true" />
            ) : (
              <ChevronDown aria-hidden="true" />
            )}
          </Button>
        </Card.Header>
        {isOpen && (
          <Card.Body id={sectionId}>
            {sectionResources.length === 0 ? (
              <Alert variant="info" className="mb-0">
                {emptyMessage}
              </Alert>
            ) : (
              <>
                <Row xs={1} md={2} className="g-3">
                  {visibleResources.map((resource) => (
                    <Col key={resource.id}>
                      <ResourceCard
                        resource={resource}
                        basePath={basePath}
                        updating={updatingIds.has(resource.id)}
                        onUpdate={handleUpdate}
                      />
                    </Col>
                  ))}
                </Row>
                <PaginationControls
                  page={page}
                  pageCount={pageCount}
                  onPageChange={(nextPage) =>
                    setPages((previous) => ({
                      ...previous,
                      [section]: nextPage,
                    }))
                  }
                />
              </>
            )}
          </Card.Body>
        )}
      </Card>
    )
  }

  if (loading) {
    return (
      <Container className="py-4 text-center">
        <Spinner animation="border" role="status" />
      </Container>
    )
  }

  if (error && resources.length === 0) {
    return (
      <Container className="py-4">
        <div className="d-flex align-items-center gap-2 mb-4">
          <DomainIcon type="resource" size={28} className="text-primary" />
          <h1 className="h2 mb-0">My resources</h1>
        </div>
        <Alert variant="danger">{error}</Alert>
      </Container>
    )
  }

  const favorites = resources.filter((resource) => resource.isFavorite)

  return (
    <Container className="py-4">
      <div className="d-flex align-items-center gap-2 mb-4">
        <DomainIcon type="resource" size={28} className="text-primary" />
        <h1 className="h2 mb-0">My resources</h1>
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {renderSection('Favorites', favorites, 'You have no favorite resources.')}
      {STATUSES.map((status) =>
        renderSection(
          status,
          resources.filter(
            (resource) => resource.userProgressStatus === status,
          ),
          `You have no resources marked ${status === 'CheckLater' ? 'Check later' : status}.`,
        ),
      )}
    </Container>
  )
}

export default MyResourcesView
