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
import { InvoiceListPage } from './pages/billing/InvoiceListPage';
import { IncidentLogPage } from './pages/incidents/IncidentLogPage';
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
                <Route path="/students" element={<StudentListPage />} />
                <Route path="/parents" element={<ParentListPage />} />
                <Route path="/vehicles" element={<VehicleListPage />} />
                <Route path="/drivers" element={<DriverListPage />} />
                <Route path="/attendance" element={<AttendancePage />} />
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
