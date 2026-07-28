import { createBrowserRouter, Navigate } from 'react-router-dom'
import { RouteErrorBoundary } from '@/components/layout/error-boundary'
import { RequireAuth } from '@/features/auth/require-auth'
import { RequirePermission } from '@/features/auth/require-permission'
import { WelcomePage } from '@/features/onboarding/welcome-page'
import { AppShell } from '@/layouts/app-shell'
import { AirFreightPage } from '@/pages/air-freight-page'
import { CustomerDetailPage } from '@/pages/customers/customer-detail-page'
import { CustomerFormPage } from '@/pages/customers/customer-form-page'
import { CustomersPage } from '@/pages/customers/customers-page'
import { DashboardPage } from '@/pages/dashboard-page'
import { InquiryDetailPage } from '@/pages/inquiries/inquiry-detail-page'
import { InquiryFormPage } from '@/pages/inquiries/inquiry-form-page'
import { InquiriesPage } from '@/pages/inquiries/inquiries-page'
import { SyncPage } from '@/pages/sync-page'

export const router = createBrowserRouter([
  { path: '/welcome', element: <WelcomePage />, errorElement: <RouteErrorBoundary /> },
  { path: '/login', element: <Navigate to="/welcome" replace /> },
  {
    element: <RequireAuth />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, path: '/', element: <DashboardPage /> },
          { path: 'modules/air', element: <AirFreightPage /> },
          { path: 'sync', element: <SyncPage /> },
          {
            path: 'customers',
            element: (
              <RequirePermission permission="customers.read">
                <CustomersPage />
              </RequirePermission>
            ),
          },
          {
            path: 'customers/new',
            element: (
              <RequirePermission permission="customers.write">
                <CustomerFormPage />
              </RequirePermission>
            ),
          },
          {
            path: 'customers/:id',
            element: (
              <RequirePermission permission="customers.read">
                <CustomerDetailPage />
              </RequirePermission>
            ),
          },
          {
            path: 'inquiries',
            element: (
              <RequirePermission permission="inquiries.read">
                <InquiriesPage />
              </RequirePermission>
            ),
          },
          {
            path: 'inquiries/new',
            element: (
              <RequirePermission permission="inquiries.write">
                <InquiryFormPage />
              </RequirePermission>
            ),
          },
          {
            path: 'inquiries/:id',
            element: (
              <RequirePermission permission="inquiries.read">
                <InquiryDetailPage />
              </RequirePermission>
            ),
          },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
