import React, { useState, useEffect } from 'react';
import { CreditCard, Plus, CheckCircle, Clock, AlertTriangle, FileText, ExternalLink, ShieldCheck } from 'lucide-react';
import client from '../../api/client';

export const InvoiceListPage = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState(new Date().toISOString().slice(0, 7));

  // Bulk Invoice Modal State
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkMonth, setBulkMonth] = useState(new Date().toISOString().slice(0, 7));
  const [bulkDueDate, setBulkDueDate] = useState('');
  const [bulkAmount, setBulkAmount] = useState('7500');
  const [bulkGenerating, setBulkGenerating] = useState(false);

  // Verify Payment Modal State
  const [verifyingInvoice, setVerifyingInvoice] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [notes, setNotes] = useState('Verified by VanTrack transport operations');
  const [submittingVerification, setSubmittingVerification] = useState(false);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (monthFilter) params.monthYear = monthFilter;

      const res = await client.get('/admin/invoices', { params });
      if (res.data.success) {
        setInvoices(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter, monthFilter]);

  const handleBulkGenerate = async (e) => {
    e.preventDefault();
    setBulkGenerating(true);
    try {
      const res = await client.post('/admin/invoices/bulk-generate', {
        monthYear: bulkMonth,
        dueDate: bulkDueDate || undefined,
        defaultAmount: Number(bulkAmount) || 7500,
      });
      if (res.data.success) {
        alert(res.data.message);
        setIsBulkModalOpen(false);
        fetchInvoices();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error generating invoices');
    } finally {
      setBulkGenerating(false);
    }
  };

  const handleVerifyPayment = async (e) => {
    e.preventDefault();
    if (!verifyingInvoice) return;
    setSubmittingVerification(true);
    try {
      const res = await client.post(`/admin/invoices/${verifyingInvoice._id}/verify`, {
        paymentMethod,
        notes,
      });
      if (res.data.success) {
        alert('Payment verified and invoice marked as paid.');
        setVerifyingInvoice(null);
        fetchInvoices();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Verification failed');
    } finally {
      setSubmittingVerification(false);
    }
  };

  const totalPaid = invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + i.amount, 0);
  const totalPending = invoices.filter((i) => i.status === 'unpaid' || i.status === 'pending_verification').reduce((s, i) => s + i.amount, 0);
  const overdueCount = invoices.filter((i) => i.status === 'overdue').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Monthly Transport Invoices & Billing</h1>
          <p className="text-xs text-slate-400">
            Generate monthly fee bills, review bank slips, monitor PayHere online payments, and audit verifications.
          </p>
        </div>
        <button
          onClick={() => setIsBulkModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 transition shadow-md shadow-amber-500/20"
        >
          <Plus className="h-4 w-4" />
          <span>Bulk Generate Invoices</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4">
          <div className="flex items-center justify-between text-emerald-400 mb-1">
            <span className="text-xs font-bold uppercase">Collected Income</span>
            <CheckCircle className="h-4 w-4" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-300">Rs. {totalPaid.toLocaleString()}</p>
          <span className="text-[11px] text-emerald-400/80">Filtered period verified</span>
        </div>

        <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4">
          <div className="flex items-center justify-between text-amber-400 mb-1">
            <span className="text-xs font-bold uppercase">Pending Outstanding</span>
            <Clock className="h-4 w-4" />
          </div>
          <p className="text-2xl font-extrabold text-amber-300">Rs. {totalPending.toLocaleString()}</p>
          <span className="text-[11px] text-amber-400/80">Awaiting parent remittance</span>
        </div>

        <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-4">
          <div className="flex items-center justify-between text-red-400 mb-1">
            <span className="text-xs font-bold uppercase">Overdue Accounts</span>
            <AlertTriangle className="h-4 w-4" />
          </div>
          <p className="text-2xl font-extrabold text-red-300">{overdueCount} Invoices</p>
          <span className="text-[11px] text-red-400/80">Past due date</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/70 p-3 text-xs">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-slate-200 outline-none"
        >
          <option value="">All Payment Statuses</option>
          <option value="unpaid">Unpaid</option>
          <option value="pending_verification">Pending Slip Verification</option>
          <option value="paid">Paid & Verified</option>
          <option value="overdue">Overdue</option>
        </select>

        <input
          type="month"
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-slate-200 outline-none"
        />

        {(statusFilter || monthFilter) && (
          <button
            onClick={() => {
              setStatusFilter('');
              setMonthFilter('');
            }}
            className="text-amber-400 hover:underline font-semibold ml-auto"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Invoices Table */}
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/70">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            <FileText className="mx-auto h-8 w-8 text-slate-600 mb-2" />
            <p className="font-semibold text-slate-300">No invoices found</p>
            <p className="mt-1">Generate monthly invoices using the button above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-800/40 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3">Invoice Number</th>
                  <th className="px-4 py-3">Student & School</th>
                  <th className="px-4 py-3">Parent Account</th>
                  <th className="px-4 py-3">Month / Due Date</th>
                  <th className="px-4 py-3">Amount (LKR)</th>
                  <th className="px-4 py-3">Payment Method</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {invoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-slate-800/30 transition">
                    <td className="px-4 py-3.5 font-mono font-bold text-slate-100">
                      {inv.invoiceNumber}
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="font-semibold text-slate-200 block">{inv.studentId?.name || 'Student'}</span>
                      <span className="text-[10px] text-slate-400 block">{inv.studentId?.schoolName}</span>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="font-medium text-slate-200 block">{inv.parentId?.name || 'Parent'}</span>
                      <span className="text-[10px] text-slate-400 block">{inv.parentId?.phone}</span>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="font-medium text-slate-200 block">{inv.monthYear}</span>
                      <span className="text-[10px] text-slate-400 block">
                        Due: {new Date(inv.dueDate).toLocaleDateString()}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 font-bold text-slate-100 text-sm">
                      Rs. {inv.amount?.toLocaleString()}
                    </td>

                    <td className="px-4 py-3.5 text-slate-300">
                      <span className="capitalize">{inv.paymentMethod?.replace('_', ' ') || 'None'}</span>
                      {inv.payherePaymentId && (
                        <span className="text-[10px] text-emerald-400 block font-mono">
                          PayHere: #{inv.payherePaymentId}
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                          inv.status === 'paid'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : inv.status === 'pending_verification'
                            ? 'bg-amber-500/20 text-amber-400'
                            : inv.status === 'overdue'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {inv.status.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-right space-x-1.5">
                      {inv.receiptUrl && (
                        <a
                          href={inv.receiptUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded bg-slate-800 px-2 py-1 text-xs text-amber-400 hover:bg-slate-700 font-semibold"
                        >
                          <span>Slip</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}

                      {inv.status !== 'paid' && (
                        <button
                          onClick={() => setVerifyingInvoice(inv)}
                          className="inline-flex items-center gap-1 rounded bg-emerald-500/20 px-2.5 py-1 text-xs font-bold text-emerald-400 hover:bg-emerald-500/30"
                        >
                          <CheckCircle className="h-3 w-3" />
                          <span>Verify</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bulk Generate Modal */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <h2 className="text-base font-bold text-slate-100 mb-1">Bulk Generate Monthly Invoices</h2>
            <p className="text-xs text-slate-400 mb-4">
              Automatically creates transport fee invoices for all active enrolled students
            </p>

            <form onSubmit={handleBulkGenerate} className="space-y-3.5 text-xs">
              <div>
                <label className="mb-1 block font-semibold text-slate-300">Billing Month (YYYY-MM) *</label>
                <input
                  type="month"
                  value={bulkMonth}
                  onChange={(e) => setBulkMonth(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold text-slate-300">Payment Due Date</label>
                <input
                  type="date"
                  value={bulkDueDate}
                  onChange={(e) => setBulkDueDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-100"
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold text-slate-300">Default Amount (LKR)</label>
                <input
                  type="number"
                  required
                  value={bulkAmount}
                  onChange={(e) => setBulkAmount(e.target.value)}
                  placeholder="e.g. 7500"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-slate-100 focus:border-amber-500 focus:outline-none font-mono"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Students with customized fee amounts will use their configured fee.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsBulkModalOpen(false)}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 font-semibold text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bulkGenerating}
                  className="rounded-lg bg-amber-500 px-5 py-2 font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-50"
                >
                  {bulkGenerating ? 'Generating...' : 'Generate Invoices'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Verify Payment Modal */}
      {verifyingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2 mb-1">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              <span>Verify Remittance & Mark as Paid</span>
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Invoice: {verifyingInvoice.invoiceNumber} • Rs. {verifyingInvoice.amount?.toLocaleString()}
            </p>

            <form onSubmit={handleVerifyPayment} className="space-y-3.5 text-xs">
              <div>
                <label className="mb-1 block font-semibold text-slate-300">Payment Channel *</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-slate-100"
                >
                  <option value="bank_transfer">Direct Bank Deposit / Transfer Slip</option>
                  <option value="cash_to_driver">Cash Handed to Driver / Assistant</option>
                  <option value="payhere_online">PayHere Gateway Manual Reconciliation</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block font-semibold text-slate-300">Auditor Notes</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-slate-100"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setVerifyingInvoice(null)}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 font-semibold text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingVerification}
                  className="rounded-lg bg-emerald-500 px-5 py-2 font-bold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
                >
                  {submittingVerification ? 'Verifying...' : 'Confirm Paid Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
