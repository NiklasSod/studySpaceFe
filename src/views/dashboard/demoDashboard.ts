import type { Deadline, FeedbackItem } from '../../types/dashboard'
import type { CourseSummary } from '../../types/course'
import type { CourseModule } from '../../types/module'
import type { UserNotification } from '../../types/notification'

export const DEMO_NOTIFICATION_STORAGE_KEY =
  'demoDashboardDismissedNotifications'

export interface DemoDashboardData {
  courses: CourseSummary[]
  modules: CourseModule[]
  deadlines: Deadline[]
  feedbackItems: FeedbackItem[]
  notifications: UserNotification[]
}

interface DateOptions {
  hours?: number
  midnight?: boolean
  endWorkDay?: boolean
}

const dateAfterDays = (days: number, options?: DateOptions) => {
  const now = new Date()
  const date = new Date(now)
  date.setDate(date.getDate() + days)
  if (options?.midnight) {
    date.setHours(23, 59, 0, 0)
  } else if (options?.endWorkDay) {
    date.setHours(17, 0, 0, 0)
  } else if (
    options?.hours !== undefined &&
    options.hours >= 1 &&
    options.hours <= 23
  ) {
    date.setHours(date.getHours() - options.hours)
  }
  return date
}

export function getDemoDashboardData(): DemoDashboardData {
  const now = new Date()

  return {
    courses: [
      {
        id: 9001,
        name: 'Introduction to Web Development',
        description:
          '<p>Learn the foundations of the web, from HTML and CSS to modern JavaScript.</p>',
        startDate: dateAfterDays(-21).toISOString(),
        endDate: dateAfterDays(70).toISOString(),
      },
    ],
    modules: [
      {
        id: 9001,
        name: 'Getting started with HTML',
        description:
          '<p>Explore document structure, semantic elements, and accessible page content.</p>',
        startDate: dateAfterDays(-14).toISOString(),
        endDate: dateAfterDays(7).toISOString(),
      },
      {
        id: 9002,
        name: 'Styling with CSS',
        description:
          '<p>Practice selectors, layouts, responsive design, and reusable styles.</p>',
        startDate: dateAfterDays(-7).toISOString(),
        endDate: dateAfterDays(14).toISOString(),
      },
    ],
    deadlines: [
      {
        id: 9001,
        moduleId: 9001,
        assignmentTitle: 'Build your first web page',
        dueAt: dateAfterDays(1, { endWorkDay: true }),
        status: 'Unsent',
      },
      {
        id: 9002,
        moduleId: 9001,
        assignmentTitle: 'HTML accessibility checklist',
        dueAt: dateAfterDays(5, { midnight: true }),
        status: 'Submitted',
      },
      {
        id: 9003,
        moduleId: 9002,
        assignmentTitle: 'Create a responsive profile card',
        dueAt: dateAfterDays(10, { endWorkDay: true }),
        status: null,
      },
    ],
    feedbackItems: [
      {
        id: 9001,
        assignmentTitle: 'Semantic HTML practice',
        feedback:
          'Great use of semantic elements. The page structure is clear and easy to follow.',
        handinDate: dateAfterDays(-2),
        status: 'approved',
        hasResubmission: false,
      },
      {
        id: 9002,
        assignmentTitle: 'CSS layout exercise',
        feedback:
          'Nice progress. Consider how the layout behaves on smaller screens.',
        handinDate: dateAfterDays(-1),
        status: 'revision',
        hasResubmission: true,
      },
    ],
    notifications: [
      {
        id: 9001,
        type: 'ResourceAdded',
        title: 'New course resource',
        body: 'A guide to semantic HTML has been added to your course.',
        courseId: 9001,
        moduleId: 9001,
        activityId: null,
        resourceId: 9001,
        submissionId: null,
        createdAt: now.toISOString(),
        isSeen: false,
        seenAt: null,
      },
      {
        id: 9002,
        type: 'SubmissionApproved',
        title: 'Assignment approved',
        body: 'Your semantic HTML practice has been approved. Keep it up!',
        courseId: 9001,
        moduleId: 9001,
        activityId: null,
        resourceId: null,
        submissionId: 9001,
        createdAt: now.toISOString(),
        isSeen: false,
        seenAt: null,
      },
    ],
  }
}
