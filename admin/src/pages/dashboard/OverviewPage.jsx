import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  Users,
  Bus,
  UserCheck,
  CalendarCheck,
  Navigation,
  CheckCircle2,
  Clock,
  CreditCard,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
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
} from 'recharts';

export const OverviewPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOverview = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await client.get('/admin/overview');
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load overview data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
          <p className="text-xs text-slate-400">Loading Fleet Telemetry & Metrics...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center">
        <AlertTriangle className="mx-auto h-8 w-8 text-red-400 mb-2" />
        <p className="text-sm text-red-300">{error || 'Unable to load dashboard data.'}</p>
        <button
          onClick={fetchOverview}
          className="mt-4 rounded-lg bg-red-500/20 px-4 py-2 text-xs font-semibold text-red-300 hover:bg-red-500/30"
        >
          Retry
        </button>
      </div>
    );
  }

  const { counts, trips, finances, activeIncidents, recentActivities, upcomingTrips } = data;

  const tripStatsChart = [
    { name: 'Scheduled', count: trips.scheduled, fill: '#3b82f6' },
    { name: 'Active', count: trips.active, fill: '#10b981' },
    { name: 'Delayed', count: trips.delayed, fill: '#f59e0b' },
    { name: 'Completed', count: trips.completed, fill: '#6366f1' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Transport Fleet Operations</h1>
          <p className="text-xs text-slate-400">
            Real-time telemetry, student attendance, and trip lifecycle control across Sri Lanka.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/tracking"
            className="flex items-center gap-2 rounded-lg bg-emerald-500 px-3.5 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition shadow-md shadow-emerald-500/20"
          >
            <Navigation className="h-4 w-4" />
            <span>Open Live Fleet Map ({trips.active} Active)</span>
          </Link>
          <Link
            to="/trips"
            className="flex items-center gap-2 rounded-lg bg-amber-500 px-3.5 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 transition shadow-md shadow-amber-500/20"
          >
            <CalendarCheck className="h-4 w-4" />
            <span>Schedule Trip</span>
          </Link>
        </div>
      </div>

      {/* Row 1: KPI Stat Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">Total Students</span>
            <GraduationCap className="h-4 w-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-slate-100">{counts.students}</p>
          <span className="text-[11px] text-slate-400">Enrolled passengers</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">Parents</span>
            <Users className="h-4 w-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-slate-100">{counts.parents}</p>
          <span className="text-[11px] text-slate-400">Registered guardians</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">Fleet Vehicles</span>
            <Bus className="h-4 w-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-slate-100">{counts.vehicles}</p>
          <span className="text-[11px] text-slate-400">Vans & Mini-coaches</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">Drivers</span>
            <UserCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-slate-100">{counts.drivers}</p>
          <span className="text-[11px] text-slate-400">Licensed crew</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">Assistants</span>
            <Users className="h-4 w-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-bold text-slate-100">{counts.assistants}</p>
          <span className="text-[11px] text-slate-400">Van attendants</span>
        </div>
      </div>

      {/* Row 2: Trip Status & Financial Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Active Trips */}
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide">Active Trips</span>
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <p className="text-3xl font-extrabold text-emerald-300">{trips.active}</p>
          <p className="text-xs text-emerald-400/80 mt-1">Vehicles currently on the road</p>
        </div>

        {/* Scheduled Trips */}
        <div className="rounded-xl border border-blue-500/30 bg-blue-950/20 p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wide">Scheduled Today</span>
            <CalendarCheck className="h-4 w-4 text-blue-400" />
          </div>
          <p className="text-3xl font-extrabold text-blue-300">{trips.scheduled}</p>
          <p className="text-xs text-blue-400/80 mt-1">Pending dispatch</p>
        </div>

        {/* Delayed Trips */}
        <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wide">Delayed Trips</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <p className="text-3xl font-extrabold text-amber-300">{trips.delayed}</p>
          <p className="text-xs text-amber-400/80 mt-1">Traffic / road obstruction</p>
        </div>

        {/* Monthly Revenue */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">Monthly Revenue</span>
            <CreditCard className="h-4 w-4 text-amber-400" />
          </div>
          <p className="text-2xl font-extrabold text-slate-100">
            Rs. {finances.monthlyRevenue.toLocaleString()}
          </p>
          <div className="flex items-center justify-between text-xs text-slate-400 mt-1">
            <span>Pending: Rs. {(finances.pendingInvoices * 7500).toLocaleString()}</span>
            <span className="text-red-400">Overdue: {finances.overdueInvoices}</span>
          </div>
        </div>
      </div>

      {/* Row 3: Trip Lifecycle Chart & Active Incidents */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Trip Overview Chart */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-100">Today's Trip Operations Volume</h2>
              <p className="text-xs text-slate-400">Status breakdown of morning & afternoon school runs</p>
            </div>
            <span className="text-xs font-semibold text-slate-400">Total: {trips.scheduled + trips.active + trips.completed}</span>
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tripStatsChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', color: '#f8fafc' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {tripStatsChart.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Active Incidents Panel */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                <span>Active Incidents</span>
              </h2>
              <Link to="/incidents" className="text-xs text-amber-400 hover:underline">
                View all
              </Link>
            </div>

            {activeIncidents.length === 0 ? (
              <div className="py-8 text-center">
                <ShieldCheck className="mx-auto h-8 w-8 text-emerald-400 mb-2" />
                <p className="text-xs text-emerald-300 font-medium">All Clear!</p>
                <p className="text-[11px] text-slate-400">No active vehicle breakdowns or route delays reported.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {activeIncidents.map((inc) => (
                  <div key={inc._id} className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-amber-300">{inc.title}</span>
                      <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] text-amber-300 uppercase">
                        {inc.type.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-1 line-clamp-1">{inc.description}</p>
                    <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                      <span>Vehicle: {inc.vehicleId?.registrationNumber || 'N/A'}</span>
                      <span className="text-amber-400">+{inc.estimatedDelayMinutes || 15}m delay</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Transport Operations Helpline</span>
            <span className="text-amber-400 font-semibold">011-234-5678</span>
          </div>
        </div>
      </div>

      {/* Row 4: Upcoming Trips & Recent Audit Trail */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Upcoming Trips */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <CalendarCheck className="h-4 w-4 text-blue-400" />
              <span>Upcoming Scheduled Runs</span>
            </h2>
            <Link to="/trips" className="text-xs text-amber-400 hover:underline">
              Manage trips
            </Link>
          </div>

          {upcomingTrips.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No upcoming trips scheduled.</p>
          ) : (
            <div className="divide-y divide-slate-800">
              {upcomingTrips.map((trip) => (
                <div key={trip._id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-200">
                        {trip.tripType === 'morning_pickup' ? 'Morning Pickup' : 'Afternoon Drop-off'}
                      </span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                          trip.status === 'started' || trip.status === 'active'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-blue-500/20 text-blue-400'
                        }`}
                      >
                        {trip.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Route: {trip.routeId?.name || 'Assigned Route'} • {trip.vehicleId?.registrationNumber || 'Van'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-300">{trip.driverId?.name || 'Driver'}</p>
                    <p className="text-[10px] text-slate-400">{trip.scheduledStartTime || '06:30 AM'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Security Audit Trail Activity */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Recent Administrative Actions</span>
            </h2>
            <Link to="/audit" className="text-xs text-amber-400 hover:underline">
              Full audit log
            </Link>
          </div>

          {recentActivities.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No audit records logged yet.</p>
          ) : (
            <div className="divide-y divide-slate-800">
              {recentActivities.map((act) => (
                <div key={act._id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-200">{act.action}</span>
                    <p className="text-[11px] text-slate-400">
                      Operator: {act.userId?.name || 'Admin'} ({act.userId?.role || 'admin'})
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
