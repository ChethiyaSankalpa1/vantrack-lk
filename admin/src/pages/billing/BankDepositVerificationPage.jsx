import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Eye,
  AlertTriangle,
  Building2,
  Search,
  RefreshCw,
  FileText,
  UserCheck,
  ShieldCheck,
} from 'lucide-react';
import client from '../../api/client';

export const BankDepositVerificationPage = () => {
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ pendingCount: 0, approvedCount: 0, rejectedCount: 0 });
  const [statusFilter, setStatusFilter] = useState('pending_verification');
  const [searchTerm, setSearchTerm] = useState('');

  // Receipt Modal State
  const [selectedDeposit, setSelectedDeposit] = useState(null);

  // Reject Modal State
  const [rejectingDeposit, setRejectingDeposit] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('Incorrect deposit amount or unreadable slip');
  const [submittingReject, setSubmittingReject] = useState(false);

  // Approve Modal State
  const [approvingDeposit, setApprovingDeposit] = useState(null);
  const [submittingApprove, setSubmittingApprove] = useState(false);

  const fetchDeposits = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
      if (searchTerm) params.search = searchTerm;

      const res = await client.get('/admin/bank-deposits', { params });
      if (res.data.success) {
        setDeposits(res.data.data || []);
        if (res.data.stats) setStats(res.data.stats);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeposits();
  }, [statusFilter]);

  const handleApprove = async () => {
    if (!approvingDeposit) return;
    setSubmittingApprove(true);
    try {
      const res = await client.post(`/admin/bank-deposits/${approvingDeposit._id}/approve`);
      if (res.data.success) {
        alert('Bank deposit verified and approved successfully! Parent notified & invoice marked as PAID.');
        setApprovingDeposit(null);
        setSelectedDeposit(null);
        fetchDeposits();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Approval failed');
    } finally {
      setSubmittingApprove(false);
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    if (!rejectingDeposit) return;
    if (!rejectionReason.trim()) {
      alert('Please enter a rejection reason.');
      return;
    }

    setSubmittingReject(true);
    try {
      const res = await client.post(`/admin/bank-deposits/${rejectingDeposit._id}/reject`, {
        rejectionReason: rejectionReason.trim(),
      });
      if (res.data.success) {
        alert('Deposit rejected. Parent notified with rejection reason.');
        setRejectingDeposit(null);
        setSelectedDeposit(null);
        fetchDeposits();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Rejection failed');
    } finally {
      setSubmittingReject(false);
    }
  };

  const filteredDeposits = deposits.filter((d) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      d.depositReference?.toLowerCase().includes(term) ||
      d.invoiceId?.invoiceNumber?.toLowerCase().includes(term) ||
      d.parentId?.name?.toLowerCase().includes(term) ||
      d.studentId?.name?.toLowerCase().includes(term) ||
      d.depositorName?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Bank Deposit Verification Center</h1>
          <p className="text-xs text-slate-400">
            Review parent bank deposit receipts, confirm bank account entries, and issue digital receipts.
          </p>
        </div>
        <button
          onClick={fetchDeposits}
          className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition self-start sm:self-auto"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
          <div className="flex items-center justify-between text-amber-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Pending Verification</span>
            <Clock className="h-4 w-4" />
          </div>
          <p className="text-2xl font-extrabold text-amber-300">{stats.pendingCount}</p>
          <span className="text-[11px] text-amber-400/80">Requires manual bank slip check</span>
        </div>

        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4">
          <div className="flex items-center justify-between text-emerald-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Approved Deposits</span>
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-300">{stats.approvedCount}</p>
          <span className="text-[11px] text-emerald-400/80">Verified & marked as paid</span>
        </div>

        <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-4">
          <div className="flex items-center justify-between text-red-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Rejected Slips</span>
            <XCircle className="h-4 w-4" />
          </div>
          <p className="text-2xl font-extrabold text-red-300">{stats.rejectedCount}</p>
          <span className="text-[11px] text-red-400/80">Returned to parent for correction</span>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'pending_verification', label: 'Pending Verification' },
            { key: 'APPROVED', label: 'Approved Receipts' },
            { key: 'REJECTED', label: 'Rejected Slips' },
            { key: 'all', label: 'All Submissions' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                statusFilter === tab.key
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search parent, student, invoice..."
            className="w-full rounded-lg border border-slate-700 bg-slate-800 pl-9 pr-3 py-2 text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Submissions Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
          </div>
        ) : filteredDeposits.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <FileText className="mx-auto h-12 w-12 text-slate-600 mb-3" />
            <p className="text-base font-bold text-slate-200">No Bank Deposit Submissions Found</p>
            <p className="text-xs text-slate-400 mt-1">Bank deposit payment slips submitted by parents will appear here for verification.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3.5">Ref & Invoice</th>
                  <th className="px-4 py-3.5">Parent & Student</th>
                  <th className="px-4 py-3.5">Deposit Amount</th>
                  <th className="px-4 py-3.5">Bank Destination</th>
                  <th className="px-4 py-3.5">Deposit Date</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredDeposits.map((d) => {
                  const isPending = d.status === 'pending_verification';
                  const isApproved = d.status === 'APPROVED';
                  const isRejected = d.status === 'REJECTED';

                  return (
                    <tr key={d._id} className="hover:bg-slate-800/40 transition">
                      {/* Ref & Invoice */}
                      <td className="px-4 py-3.5">
                        <div className="font-mono font-bold text-slate-100">{d.depositReference}</div>
                        <div className="text-[11px] font-mono text-amber-400">
                          {d.invoiceId?.invoiceNumber || 'INV-000'}
                        </div>
                      </td>

                      {/* Parent & Student */}
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-100">{d.parentId?.name || 'Parent'}</div>
                        <div className="text-[11px] text-slate-400">
                          Student: <span className="text-slate-300 font-medium">{d.studentId?.name || 'Child'}</span>
                        </div>
                        <div className="text-[10px] text-slate-500">{d.parentId?.phone}</div>
                      </td>

                      {/* Amount */}
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-100 text-sm">
                          Rs. {d.amount?.toLocaleString()} {d.currency}
                        </div>
                        <div className="text-[10px] text-slate-400">Depositor: {d.depositorName}</div>
                      </td>

                      {/* Bank Destination Snapshot */}
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-slate-200">{d.bankAccountSnapshot?.bankName}</div>
                        <div className="font-mono text-[11px] text-emerald-400">{d.bankAccountSnapshot?.accountNumber}</div>
                        <div className="text-[10px] text-slate-400">{d.bankAccountSnapshot?.branchName}</div>
                      </td>

                      {/* Deposit Date */}
                      <td className="px-4 py-3.5">
                        <div className="text-slate-200">{new Date(d.depositDate).toLocaleDateString()}</div>
                        <div className="text-[10px] text-slate-500">Submitted: {new Date(d.submittedAt).toLocaleDateString()}</div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        {isPending && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 px-2.5 py-1 text-[10px] font-bold text-amber-400 border border-amber-500/30">
                            <Clock className="h-3 w-3" /> PENDING VERIFICATION
                          </span>
                        )}
                        {isApproved && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2.5 py-1 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="h-3 w-3" /> APPROVED
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/20 px-2.5 py-1 text-[10px] font-bold text-red-400 border border-red-500/30">
                            <XCircle className="h-3 w-3" /> REJECTED
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedDeposit(d)}
                            className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-[11px] font-semibold text-slate-200 hover:bg-slate-700"
                            title="View Receipt Slip"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Inspect</span>
                          </button>

                          {isPending && (
                            <>
                              <button
                                onClick={() => setApprovingDeposit(d)}
                                className="rounded-lg bg-emerald-500 px-2.5 py-1.5 text-[11px] font-bold text-slate-950 hover:bg-emerald-400"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => {
                                  setRejectingDeposit(d);
                                  setRejectionReason('Incorrect deposit amount or unreadable slip');
                                }}
                                className="rounded-lg bg-red-500/20 px-2.5 py-1.5 text-[11px] font-bold text-red-300 hover:bg-red-500/30"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspect Receipt Lightbox Modal */}
      {selectedDeposit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-amber-400">{selectedDeposit.depositReference}</span>
                <h2 className="text-lg font-bold text-slate-100">Bank Deposit Receipt Verification</h2>
              </div>
              <button
                onClick={() => setSelectedDeposit(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Receipt Image / PDF Preview */}
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 flex flex-col items-center justify-center min-h-[220px]">
                {selectedDeposit.receiptFileUrl ? (
                  <div className="w-full text-center space-y-3">
                    <img
                      src={selectedDeposit.receiptFileUrl}
                      alt="Bank Deposit Slip"
                      className="max-h-60 w-full object-contain rounded-lg border border-slate-800"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'block';
                      }}
                    />
                    <div className="hidden text-xs text-slate-400">
                      Receipt document provided (PDF/URL format)
                    </div>
                    <a
                      href={selectedDeposit.receiptFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-amber-400 hover:bg-slate-700"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> Open Full Image / Document
                    </a>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">No image attachment provided</p>
                )}
              </div>

              {/* Deposit Meta Details */}
              <div className="space-y-3 text-xs">
                <div className="rounded-lg bg-slate-950/80 p-3 space-y-1.5 border border-slate-800">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Invoice:</span>
                    <span className="font-mono font-bold text-amber-400">{selectedDeposit.invoiceId?.invoiceNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Invoice Amount:</span>
                    <span className="font-bold text-slate-100">Rs. {selectedDeposit.amount?.toLocaleString()} LKR</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Depositor Name:</span>
                    <span className="font-semibold text-slate-200">{selectedDeposit.depositorName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Deposit Date:</span>
                    <span className="text-slate-200">{new Date(selectedDeposit.depositDate).toLocaleDateString()}</span>
                  </div>
                  {selectedDeposit.depositReferenceNumber && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Ref / Slip #:</span>
                      <span className="font-mono text-slate-200">{selectedDeposit.depositReferenceNumber}</span>
                    </div>
                  )}
                </div>

                <div className="rounded-lg bg-slate-950/80 p-3 space-y-1.5 border border-slate-800">
                  <span className="text-[11px] font-bold uppercase text-emerald-400 block mb-1">Bank Destination Snapshot</span>
                  <div className="text-slate-200 font-semibold">{selectedDeposit.bankAccountSnapshot?.bankName}</div>
                  <div className="font-mono text-emerald-300">{selectedDeposit.bankAccountSnapshot?.accountNumber}</div>
                  <div className="text-slate-400 text-[11px]">{selectedDeposit.bankAccountSnapshot?.branchName}</div>
                </div>

                {selectedDeposit.rejectionReason && (
                  <div className="rounded-lg bg-red-950/30 border border-red-500/30 p-3 text-red-300 text-xs">
                    <span className="font-bold block mb-0.5">Rejection Reason:</span>
                    {selectedDeposit.rejectionReason}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setSelectedDeposit(null)}
                className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
              >
                Close
              </button>
              {selectedDeposit.status === 'pending_verification' && (
                <>
                  <button
                    onClick={() => {
                      setRejectingDeposit(selectedDeposit);
                      setRejectionReason('Incorrect deposit amount or unreadable slip');
                    }}
                    className="rounded-lg bg-red-500/20 px-4 py-2 text-xs font-bold text-red-300 hover:bg-red-500/30"
                  >
                    Reject Deposit
                  </button>
                  <button
                    onClick={() => setApprovingDeposit(selectedDeposit)}
                    className="rounded-lg bg-emerald-500 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400"
                  >
                    Approve Payment
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Approve Confirmation Modal */}
      {approvingDeposit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-emerald-500/40 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-emerald-400">
              <ShieldCheck className="h-6 w-6" />
              <h3 className="text-base font-bold text-slate-100">Confirm Payment Verification</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              By approving, you manually confirm that <strong className="text-emerald-300">Rs. {approvingDeposit.amount?.toLocaleString()} LKR</strong> has been received in the operator bank account for invoice <strong className="text-amber-400">{approvingDeposit.invoiceId?.invoiceNumber}</strong>.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setApprovingDeposit(null)}
                className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={submittingApprove}
                className="rounded-lg bg-emerald-500 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400"
              >
                {submittingApprove ? 'Approving...' : 'Confirm & Mark Paid'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectingDeposit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-red-500/40 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle className="h-6 w-6" />
              <h3 className="text-base font-bold text-slate-100">Reject Bank Deposit Slip</h3>
            </div>
            <p className="text-xs text-slate-300">
              Select or type the mandatory reason for rejecting this deposit slip. The parent will be notified to re-submit:
            </p>

            {/* Quick Reason Chips */}
            <div className="flex flex-wrap gap-1.5">
              {[
                'Incorrect deposit amount',
                'Unreadable slip / image blurry',
                'Deposit not found in operator account',
                'Duplicate slip submitted',
              ].map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setRejectionReason(reason)}
                  className="rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] text-slate-300 hover:border-amber-500 hover:text-amber-400"
                >
                  {reason}
                </button>
              ))}
            </div>

            <textarea
              rows={3}
              required
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full rounded-lg border border-slate-700 bg-slate-800 p-3 text-xs text-slate-100 focus:border-red-500 focus:outline-none"
            />

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setRejectingDeposit(null)}
                className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={submittingReject}
                className="rounded-lg bg-red-500 px-5 py-2 text-xs font-bold text-white hover:bg-red-600"
              >
                {submittingReject ? 'Rejecting...' : 'Reject Deposit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BankDepositVerificationPage;
