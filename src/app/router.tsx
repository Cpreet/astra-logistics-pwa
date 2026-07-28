import { createBrowserRouter } from 'react-router-dom'
import { AppShell } from '@/layouts/app-shell'
import { AirFreightPage } from '@/pages/air-freight-page'
import { DashboardPage } from '@/pages/dashboard-page'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'modules/air', element: <AirFreightPage /> },
    ],
  },
])
