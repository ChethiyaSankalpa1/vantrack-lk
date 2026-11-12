import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AdminLayout } from './components/layout/AdminLayout';

import { LoginPage } from './pages/auth/LoginPage';
import { OverviewPage } from './pages/dashboard/OverviewPage';
import { LiveTrackingPage } from './pages/tracking/LiveTrackingPage';
import { TripListPage } from './pages/trips/TripListPage';
import { TripDetailsPage } from './pages/trips/TripDetailsPage';
import { StudentListPage } from './pages/students/StudentListPage';
import { ParentListPage } from './pages/parents/ParentListPage';
import { VehicleListPage } from './pages/fleet/VehicleListPage';
import { DriverListPage } from './pages/fleet/DriverListPage';
import { AttendancePage } from './pages/attendance/AttendancePage';
import { AdminAbsencePage } from './pages/attendance/AdminAbsencePage';
import { InvoiceListPage } from './pages/billing/InvoiceListPage';
import { BankAccountListPage } from './pages/billing/BankAccountListPage';
import { BankDepositVerificationPage } from './pages/billing/BankDepositVerificationPage';
import { IncidentLogPage } from './pages/incidents/IncidentLogPage';
import { RouteListPage } from './pages/routes/RouteListPage';
import { ReportsAnalyticsPage } from './pages/reports/ReportsAnalyticsPage';
import { AuditLogPage } from './pages/audit/AuditLogPage';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <Routes>
            {/* Public Auth Route */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected Admin Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AdminLayout />}>
                <Route path="/" element={<OverviewPage />} />
                <Route path="/tracking" element={<LiveTrackingPage />} />
                <Route path="/trips" element={<TripListPage />} />
                <Route path="/trips/:id" element={<TripDetailsPage />} />
                <Route path="/routes" element={<RouteListPage />} />
                <Route path="/students" element={<StudentListPage />} />
                <Route path="/parents" element={<ParentListPage />} />
                <Route path="/vehicles" element={<VehicleListPage />} />
                <Route path="/drivers" element={<DriverListPage />} />
                <Route path="/attendance" element={<AttendancePage />} />
                <Route path="/attendance/absences" element={<AdminAbsencePage />} />
                <Route path="/payments/bank-accounts" element={<BankAccountListPage />} />
                <Route path="/payments/bank-deposits" element={<BankDepositVerificationPage />} />
                <Route path="/billing" element={<InvoiceListPage />} />
                <Route path="/incidents" element={<IncidentLogPage />} />
                <Route path="/reports" element={<ReportsAnalyticsPage />} />
                <Route path="/audit" element={<AuditLogPage />} />
              </Route>
            </Route>

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
