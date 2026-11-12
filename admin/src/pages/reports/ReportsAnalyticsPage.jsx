import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, CalendarCheck, CheckCircle2, Bus, AlertCircle } from 'lucide-react';
import client from '../../api/client';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export const ReportsAnalyticsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res = await client.get('/admin/analytics');
        if (res.data.success) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  const { monthlyRevenue = [], tripStatusCounts = [], attendanceStats = [], vehicleStatusCounts = [] } =
    data || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">Transport Fleet Reports & Analytics</h1>
        <p className="text-xs text-slate-400">
          Executive insights into transport collection, vehicle utilization, and student boarding rates.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Monthly Revenue Trend */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
          <h2 className="text-sm font-bold text-slate-100 mb-1 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            <span>Monthly Revenue Collection (LKR)</span>
          </h2>
          <p className="text-xs text-slate-400 mb-4">Paid transport fees over recent billing cycles</p>

          <div className="h-64">
            {monthlyRevenue.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-slate-500">
                No billing history data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyRevenue} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="_id" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', color: '#f8fafc' }}
                    formatter={(val) => [`Rs. ${val?.toLocaleString()}`, 'Revenue']}
                  />
                  <Bar dataKey="totalAmount" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Trip Operations Breakdown */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
          <h2 className="text-sm font-bold text-slate-100 mb-1 flex items-center gap-2">
            <CalendarCheck className="h-4 w-4 text-blue-400" />
            <span>Trip Execution Distribution</span>
          </h2>
          <p className="text-xs text-slate-400 mb-4">Lifecycle status proportion of all scheduled runs</p>

          <div className="h-64">
            {tripStatusCounts.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-slate-500">
                No trip records yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={tripStatusCounts}
                    dataKey="count"
                    nameKey="_id"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={(entry) => `${entry._id} (${entry.count})`}
                  >
                    {tripStatusCounts.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', color: '#f8fafc' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Attendance Verification Stats */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
          <h2 className="text-sm font-bold text-slate-100 mb-1 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-amber-400" />
            <span>Attendance Verification Rates</span>
          </h2>
          <p className="text-xs text-slate-400 mb-4">Boarded vs Dropped vs Absent passengers</p>

          <div className="h-64">
            {attendanceStats.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-slate-500">
                No attendance logs yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={attendanceStats}
                    dataKey="count"
                    nameKey="_id"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={(entry) => `${entry._id} (${entry.count})`}
                  >
                    {attendanceStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', color: '#f8fafc' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Vehicle Fleet Status Distribution */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
          <h2 className="text-sm font-bold text-slate-100 mb-1 flex items-center gap-2">
            <Bus className="h-4 w-4 text-cyan-400" />
            <span>Vehicle Fleet Utilization</span>
          </h2>
          <p className="text-xs text-slate-400 mb-4">Availability, active transit, and maintenance status</p>

          <div className="h-64">
            {vehicleStatusCounts.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-slate-500">
                No vehicle status records
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vehicleStatusCounts} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="_id" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', color: '#f8fafc' }}
                  />
                  <Bar dataKey="count" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
