import { Route, Routes } from 'react-router-dom'
import ProfileView from '../views/profile/ProfileView'
import CourseMembersView from '../views/courses/CourseMembersView'
import CoursesView from '../views/courses/CoursesView'
import ModulesView from '../views/modules/ModulesView'
import CourseOverviewView from '../views/courses/CourseOverviewView'
import CourseModulesView from '../views/courses/CourseModulesView'
import CourseResourcesView from '../views/courses/CourseResourcesView'
import DashboardView from '../views/dashboard/DashboardView'
import ActivitiesView from '../views/activities/ActivitiesView'
import ActivityDetailView from '../views/activities/ActivityDetailView'
import ResourceDetailView from '../views/resources/ResourceDetailView'
import AssignmentsView from '../views/assignments/AssignmentsView'
import AssignmentLinksView from '../views/assignments/AssignmentLinksView'

function StudentRoutes() {
  return (
    <Routes>
      <Route index element={<DashboardView />} />
      <Route path="profile" element={<ProfileView />} />
      <Route path="courses" element={<CoursesView />} />
      <Route path="courses/:courseId" element={<CourseOverviewView />} />
      <Route path="courses/:courseId/members" element={<CourseMembersView />} />
      <Route path="courses/:courseId/modules" element={<CourseModulesView />} />
      <Route
        path="courses/:courseId/resources"
        element={<CourseResourcesView />}
      />
      <Route path="modules" element={<ModulesView />} />
      <Route path="activities" element={<ActivitiesView />} />
      <Route path="activities/:activityId" element={<ActivityDetailView />} />
      <Route path="resources/:resourceId" element={<ResourceDetailView />} />
      <Route path="assignments" element={<AssignmentsView />} />
      <Route
        path="assignments/:assignmentId/links"
        element={<AssignmentLinksView />}
      />
      <Route path="*" element={<p className="p-4">Page not found.</p>} />
    </Routes>
  )
}

export default StudentRoutes
