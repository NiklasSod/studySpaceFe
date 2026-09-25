import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Container,
  ListGroup,
  Alert,
  Breadcrumb,
  Row,
  Col,
  Spinner,
  Button,
  Badge,
} from 'react-bootstrap'
import { CheckLg, XLg } from 'react-bootstrap-icons'
import {
  getCourseById,
  getCourseEnrollments,
  approveEnrollment,
  denyEnrollment,
} from '../../api/course'
import type { CourseDetail, CourseEnrollment } from '../../types/course'
import {
  normalizeEnrollmentStatus,
  enrollmentStatusBadgeBg,
  enrollmentStatusLabel,
} from '../../utils/enrollmentStatus'
import { useAuth } from '../../auth/AuthContext'
import { useEditMode } from '../../editMode/EditModeContext'

function CourseMembersView() {
  const { courseId } = useParams<{ courseId: string }>()
  const [course, setCourse] = useState<CourseDetail | undefined>(undefined)
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([])
  const [loading, setLoading] = useState(() => courseId !== undefined)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [busyUserId, setBusyUserId] = useState<string | null>(null)

  const navigate = useNavigate()
  const { role } = useAuth()
  const { editMode } = useEditMode()
  const isStudent = role === 'student'
  const base = isStudent ? '/student/courses' : '/teacher/courses'

  const handleMemberClick = (userId: string) => {
    navigate(`/${role}/profile`, { state: { currUserId: userId } })
  }

  useEffect(() => {
    if (!courseId) {
      return
    }

    const id = courseId
    let ignore = false

    async function loadMembers() {
      try {
        const courseData = await getCourseById(id)
        if (ignore) return
        setCourse(courseData)

        if (isStudent) {
          setEnrollments(courseData.enrollments)
        } else {
          const records = await getCourseEnrollments(id)
          if (ignore) return
          setEnrollments(records)
        }
      } catch (err: unknown) {
        if (!ignore) {
          setError(
            err instanceof Error ? err.message : 'Failed to load course.',
          )
        }
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    loadMembers()

    return () => {
      ignore = true
    }
  }, [courseId, isStudent])

  const handleDecide = async (userId: string, approve: boolean) => {
    if (!courseId) return
    setBusyUserId(userId)
    setActionError(null)
    try {
      const updated = approve
        ? await approveEnrollment(courseId, userId)
        : await denyEnrollment(courseId, userId)
      setEnrollments((prev) =>
        prev.map((enrollment) =>
          enrollment.userId === userId ? updated : enrollment,
        ),
      )
    } catch (err: unknown) {
      setActionError(
        err instanceof Error ? err.message : 'Could not update enrollment.',
      )
    } finally {
      setBusyUserId(null)
    }
  }

  if (loading) {
    return (
      <Container className="py-4 text-center">
        <Spinner animation="border" />
      </Container>
    )
  }

  if (error) {
    return (
      <Container className="py-4">
        <Alert variant="danger">{error}</Alert>
        <Link to="/">Back to course list</Link>
      </Container>
    )
  }

  if (!course) {
    return (
      <Container className="py-4">
        <Alert variant="danger">Course not found.</Alert>
        <Link to="/">Back to course list</Link>
      </Container>
    )
  }

  const teachers = enrollments.filter((e) => e.role === 'Teacher')
  const approvedStudents = enrollments.filter(
    (e) =>
      e.role === 'Student' &&
      normalizeEnrollmentStatus(e.status) === 'approved',
  )
  const pendingStudents = enrollments.filter(
    (e) =>
      e.role === 'Student' && normalizeEnrollmentStatus(e.status) === 'pending',
  )
  const deniedStudents = enrollments.filter(
    (e) =>
      e.role === 'Student' && normalizeEnrollmentStatus(e.status) === 'denied',
  )

  const renderMember = (member: CourseEnrollment, showStatus = false) => (
    <ListGroup.Item
      key={member.userId}
      action
      onClick={() => handleMemberClick(member.userId)}
      className="d-flex justify-content-between align-items-center gap-2"
    >
      <div className="flex-grow-1">
        <div className="fw-semibold">
          {member.firstName} {member.lastName}
        </div>
        <div className="text-muted">{member.email}</div>
      </div>
      {showStatus && (
        <Badge bg={enrollmentStatusBadgeBg(member.status)}>
          {enrollmentStatusLabel(member.status)}
        </Badge>
      )}
    </ListGroup.Item>
  )

  const renderRequest = (member: CourseEnrollment) => (
    <ListGroup.Item
      key={member.userId}
      className="d-flex justify-content-between align-items-center gap-2"
    >
      <div className="flex-grow-1">
        <div className="fw-semibold">
          {member.firstName} {member.lastName}
        </div>
        <div className="text-muted">{member.email}</div>
      </div>
      <div className="d-flex gap-2">
        <Button
          variant="success"
          size="sm"
          title={`Approve ${member.firstName} ${member.lastName}`}
          aria-label={`Approve ${member.firstName} ${member.lastName}`}
          onClick={() => handleDecide(member.userId, true)}
          disabled={busyUserId === member.userId}
        >
          <CheckLg /> Approve
        </Button>
        <Button
          variant="outline-danger"
          size="sm"
          title={`Deny ${member.firstName} ${member.lastName}`}
          aria-label={`Deny ${member.firstName} ${member.lastName}`}
          onClick={() => handleDecide(member.userId, false)}
          disabled={busyUserId === member.userId}
        >
          <XLg /> Deny
        </Button>
      </div>
    </ListGroup.Item>
  )

  return (
    <Container className="py-4">
      <Breadcrumb>
        <Breadcrumb.Item
          linkAs={Link}
          linkProps={{ to: base }}
          style={{ color: 'var(--link-color)' }}
        >
          Courses
        </Breadcrumb.Item>
        <Breadcrumb.Item
          linkAs={Link}
          linkProps={{ to: `${base}/${course.id}` }}
          style={{ color: 'var(--link-color)' }}
        >
          {course.name}
        </Breadcrumb.Item>
        <Breadcrumb.Item active style={{ color: 'var(--text-primary)' }}>
          Members
        </Breadcrumb.Item>
      </Breadcrumb>

      <Row>
        <Col lg={8}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2 className="h5 fw-semibold mb-0">Members</h2>
            {!isStudent && editMode && (
              <Link
                to="/teacher/courses/users"
                className="btn btn-primary btn-sm"
              >
                Edit members
              </Link>
            )}
          </div>

          {actionError && (
            <Alert variant="danger" className="py-2">
              {actionError}
            </Alert>
          )}

          {!isStudent && pendingStudents.length > 0 && (
            <>
              <h3 className="h6 fw-semibold text-muted text-uppercase mb-2">
                Enrollment requests
              </h3>
              <ListGroup className="mb-3">
                {pendingStudents.map(renderRequest)}
              </ListGroup>
            </>
          )}

          <ListGroup>
            <ListGroup.Item variant="secondary" className="fw-semibold">
              Teachers
            </ListGroup.Item>
            {teachers.length === 0 ? (
              <ListGroup.Item className="text-muted">
                No teachers listed.
              </ListGroup.Item>
            ) : (
              teachers.map((member) => renderMember(member))
            )}
          </ListGroup>

          <ListGroup className="mt-3">
            <ListGroup.Item variant="secondary" className="fw-semibold">
              Students
            </ListGroup.Item>
            {approvedStudents.length === 0 ? (
              <ListGroup.Item className="text-muted">
                No students enrolled.
              </ListGroup.Item>
            ) : (
              approvedStudents.map((member) => renderMember(member, !isStudent))
            )}
          </ListGroup>

          {!isStudent && deniedStudents.length > 0 && (
            <ListGroup className="mt-3">
              <ListGroup.Item variant="secondary" className="fw-semibold">
                Denied requests
              </ListGroup.Item>
              {deniedStudents.map((member) => renderMember(member, true))}
            </ListGroup>
          )}
        </Col>
      </Row>
    </Container>
  )
}

export default CourseMembersView
