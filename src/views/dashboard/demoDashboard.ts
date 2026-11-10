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
      {
        id: 9002,
        name: 'Foundations of User Experience',
        description:
          '<p>Discover how research, accessibility, and thoughtful design shape useful digital products.</p>',
        startDate: dateAfterDays(-14).toISOString(),
        endDate: dateAfterDays(77).toISOString(),
      },
      {
        id: 9003,
        name: 'Introduction to Data',
        description:
          '<p>Learn to organize, explore, and communicate insights from real-world data.</p>',
        startDate: dateAfterDays(-7).toISOString(),
        endDate: dateAfterDays(84).toISOString(),
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
      {
        id: 9003,
        name: 'JavaScript fundamentals',
        description:
          '<p>Work with values, functions, and events to bring web pages to life.</p>',
        startDate: dateAfterDays(0).toISOString(),
        endDate: dateAfterDays(21).toISOString(),
      },
      {
        id: 9004,
        name: 'Responsive web design',
        description:
          '<p>Build layouts that adapt to different screen sizes and devices.</p>',
        startDate: dateAfterDays(7).toISOString(),
        endDate: dateAfterDays(28).toISOString(),
      },
      {
        id: 9005,
        name: 'Understanding your users',
        description:
          '<p>Practice personas, user interviews, and turning research into design decisions.</p>',
        startDate: dateAfterDays(-10).toISOString(),
        endDate: dateAfterDays(18).toISOString(),
      },
      {
        id: 9006,
        name: 'Accessibility and inclusive design',
        description:
          '<p>Explore inclusive design principles and practical accessibility checks.</p>',
        startDate: dateAfterDays(-3).toISOString(),
        endDate: dateAfterDays(25).toISOString(),
      },
      {
        id: 9007,
        name: 'Working with datasets',
        description:
          '<p>Learn how to inspect, clean, and summarize a dataset.</p>',
        startDate: dateAfterDays(-4).toISOString(),
        endDate: dateAfterDays(24).toISOString(),
      },
      {
        id: 9008,
        name: 'Visualizing information',
        description:
          '<p>Choose clear charts and communicate data findings with confidence.</p>',
        startDate: dateAfterDays(3).toISOString(),
        endDate: dateAfterDays(31).toISOString(),
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
      {
        id: 9004,
        moduleId: 9003,
        assignmentTitle: 'Add interactive form validation',
        dueAt: dateAfterDays(2, { endWorkDay: true }),
        status: 'Unsent',
      },
      {
        id: 9005,
        moduleId: 9005,
        assignmentTitle: 'Write a short user research plan',
        dueAt: dateAfterDays(4, { midnight: true }),
        status: 'Submitted',
      },
      {
        id: 9006,
        moduleId: 9007,
        assignmentTitle: 'Explore a sample dataset',
        dueAt: dateAfterDays(8, { endWorkDay: true }),
        status: null,
      },
      {
        id: 9007,
        moduleId: 9008,
        assignmentTitle: 'Choose the right chart',
        dueAt: dateAfterDays(12, { midnight: true }),
        status: 'Revision',
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
      {
        id: 9003,
        assignmentTitle: 'Color and contrast check',
        feedback:
          'Your contrast checks are thorough. Add a note about how you tested keyboard focus visibility.',
        handinDate: dateAfterDays(-3),
        status: 'handedIn',
        hasResubmission: false,
      },
      {
        id: 9004,
        assignmentTitle: 'User interview reflection',
        feedback:
          'A thoughtful summary. Your interview questions encouraged useful, open-ended answers.',
        handinDate: dateAfterDays(-4),
        status: 'approved',
        hasResubmission: false,
      },
      {
        id: 9005,
        assignmentTitle: 'Dataset cleanup exercise',
        feedback:
          'Good work spotting missing values. Explain one more step you would take before comparing these results.',
        handinDate: dateAfterDays(-5),
        status: 'revision',
        hasResubmission: false,
      },
      {
        id: 9006,
        assignmentTitle: 'Accessible navigation review',
        feedback:
          'Your review identifies the main barriers clearly. The suggested fixes are practical and specific.',
        handinDate: dateAfterDays(-6),
        status: 'approved',
        hasResubmission: true,
      },
      {
        id: 9007,
        assignmentTitle: 'Data story outline',
        feedback:
          'The key message is clear. Consider simplifying the chart choice so the comparison is easier to scan.',
        handinDate: dateAfterDays(-7),
        status: 'handedIn',
        hasResubmission: false,
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
