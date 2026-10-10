import { Outlet, useLocation } from 'react-router-dom'
import AppNavbar from './AppNavbar'

const RESOURCE_DETAIL_PATH = /^\/(student|teacher|admin)\/resources\/\d+$/

function AppLayout() {
  const location = useLocation()
  const isResourceDetail = RESOURCE_DETAIL_PATH.test(location.pathname)

  return (
    <div
      className={`app-layout d-flex ${isResourceDetail ? 'app-layout-top' : ''}`}
    >
      <AppNavbar top={isResourceDetail} />
      <main className="flex-grow-1 p-4">
        <Outlet />
      </main>
    </div>
  )
}

export default AppLayout
