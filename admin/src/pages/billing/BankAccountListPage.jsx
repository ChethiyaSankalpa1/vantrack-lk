import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  CheckCircle2,
  XCircle,
  Edit2,
  Archive,
  Star,
  ShieldCheck,
  Copy,
  Check,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import client from '../../api/client';

export const BankAccountListPage = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  // Form Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [bankName, setBankName] = useState('Commercial Bank of Ceylon');
  const [accountHolderName, setAccountHolderName] = useState('VanTrack LK Fleet Services (Pvt) Ltd');
  const [accountNumber, setAccountNumber] = useState('');
  const [branchName, setBranchName] = useState('');
  const [branchCode, setBranchCode] = useState('');
  const [accountType, setAccountType] = useState('Current');
  const [instructions, setInstructions] = useState('Please deposit monthly transport fee and upload receipt/slip.');
  const [displayName, setDisplayName] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await client.get('/admin/bank-accounts');
      if (res.data.success) {
        setAccounts(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleOpenAddModal = () => {
    setEditingAccount(null);
    setBankName('Commercial Bank of Ceylon');
    setAccountHolderName('VanTrack LK Fleet Services (Pvt) Ltd');
    setAccountNumber('');
    setBranchName('Maharagama Branch');
    setBranchCode('080');
    setAccountType('Current');
    setInstructions('Please deposit monthly transport fee and upload receipt/slip.');
    setDisplayName('');
    setIsDefault(accounts.length === 0);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (acc) => {
    setEditingAccount(acc);
    setBankName(acc.bankName);
    setAccountHolderName(acc.accountHolderName);
    setAccountNumber(acc.accountNumber);
    setBranchName(acc.branchName);
    setBranchCode(acc.branchCode || '');
    setAccountType(acc.accountType || 'Savings');
    setInstructions(acc.instructions || '');
    setDisplayName(acc.displayName || '');
    setIsDefault(acc.isDefault);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        bankName,
        accountHolderName,
        accountNumber,
        branchName,
        branchCode,
        accountType,
        instructions,
        displayName: displayName || `${bankName} - ${accountNumber}`,
        isDefault,
      };

      if (editingAccount) {
        await client.put(`/admin/bank-accounts/${editingAccount._id}`, payload);
      } else {
        await client.post('/admin/bank-accounts', payload);
      }

      setIsModalOpen(false);
      fetchAccounts();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save bank account');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await client.patch(`/admin/bank-accounts/${id}/default`);
      fetchAccounts();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to set default bank account');
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await client.patch(`/admin/bank-accounts/${id}/status`);
      fetchAccounts();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update account status');
    }
  };

  const handleArchive = async (acc) => {
    if (acc.isDefault) {
      alert('Cannot delete the default bank account. Please assign another default account first.');
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to archive "${acc.bankName} (${acc.accountNumber})"?\n\nThis will safely hide it from parents while preserving all historical payment transaction logs.`
      )
    ) {
      return;
    }

    try {
      await client.delete(`/admin/bank-accounts/${acc._id}`);
      fetchAccounts();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to archive account');
    }
  };

  const handleCopyAcc = (num, id) => {
    navigator.clipboard.writeText(num);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const defaultAccount = accounts.find((a) => a.isDefault);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Operator Bank Account Management</h1>
          <p className="text-xs text-slate-400">
            Configure bank accounts displayed to parents for direct bank transfer and CDM fee deposits.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchAccounts}
            className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 transition shadow-md shadow-amber-500/20"
          >
            <Plus className="h-4 w-4" />
            <span>Add Bank Account</span>
          </button>
        </div>
      </div>

      {/* Default Account Highlight Banner */}
      {defaultAccount ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
              <Star className="h-5 w-5 fill-emerald-400 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">PRIMARY DEFAULT DESTINATION</span>
                <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">ACTIVE FOR PARENTS</span>
              </div>
              <p className="text-base font-bold text-slate-100 mt-1">
                {defaultAccount.bankName} — <span className="font-mono text-emerald-300">{defaultAccount.accountNumber}</span>
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Holder: {defaultAccount.accountHolderName} • Branch: {defaultAccount.branchName} ({defaultAccount.accountType})
              </p>
            </div>
          </div>
          <button
            onClick={() => handleCopyAcc(defaultAccount.accountNumber, 'default-banner')}
            className="flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-500/20 transition self-start sm:self-auto"
          >
            {copiedId === 'default-banner' ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            <span>{copiedId === 'default-banner' ? 'Copied' : 'Copy Number'}</span>
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 flex items-center gap-3 text-amber-300 text-xs">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>No default bank account selected. Please add or designate one primary account for parents to deposit fees.</span>
        </div>
      )}

      {/* Account Cards / Grid */}
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
        </div>
      ) : accounts.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-12 text-center text-slate-400">
          <Building2 className="mx-auto h-12 w-12 text-slate-600 mb-3" />
          <p className="text-base font-bold text-slate-200">No Bank Accounts Configured</p>
          <p className="text-xs text-slate-400 mt-1">Add your Commercial, BOC, or Sampath bank accounts to receive direct fee deposits.</p>
          <button
            onClick={handleOpenAddModal}
            className="mt-4 rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400"
          >
            Add First Bank Account
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {accounts.map((acc) => (
            <div
              key={acc._id}
              className={`rounded-2xl border p-5 transition-all ${
                acc.isDefault
                  ? 'border-emerald-500/40 bg-slate-900/90 shadow-lg shadow-emerald-500/5'
                  : acc.isActive
                  ? 'border-slate-800 bg-slate-900/60'
                  : 'border-slate-800/60 bg-slate-900/30 opacity-60'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl font-bold ${
                    acc.isDefault ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-300'
                  }`}>
                    <Building2 className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-100">{acc.bankName}</h3>
                      {acc.isDefault && (
                        <span className="flex items-center gap-1 rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-extrabold text-emerald-400 border border-emerald-500/30">
                          <Star className="h-3 w-3 fill-emerald-400" /> DEFAULT
                        </span>
                      )}
                      {!acc.isActive && (
                        <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-400">
                          DISABLED
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">{acc.branchName} {acc.branchCode ? `(Code: ${acc.branchCode})` : ''}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEditModal(acc)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                    title="Edit Bank Account"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleArchive(acc)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-red-500/10 hover:text-red-400"
                    title="Archive Bank Account"
                  >
                    <Archive className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Account Details */}
              <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Account Number:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-amber-400 text-sm">{acc.accountNumber}</span>
                    <button
                      onClick={() => handleCopyAcc(acc.accountNumber, acc._id)}
                      className="p-1 text-slate-400 hover:text-amber-400"
                      title="Copy Number"
                    >
                      {copiedId === acc._id ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Account Holder:</span>
                  <span className="font-medium text-slate-200">{acc.accountHolderName}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Account Type:</span>
                  <span className="font-medium text-slate-300">{acc.accountType}</span>
                </div>
                {acc.instructions && (
                  <div className="pt-2 border-t border-slate-800/60 text-[11px] text-slate-400 italic">
                    "{acc.instructions}"
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-800/80">
                <button
                  onClick={() => handleToggleStatus(acc._id)}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition ${
                    acc.isActive
                      ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
                      : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                  }`}
                >
                  {acc.isActive ? (
                    <>
                      <XCircle className="h-3.5 w-3.5 text-slate-400" /> Disable Account
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Enable Account
                    </>
                  )}
                </button>

                {!acc.isDefault && acc.isActive && (
                  <button
                    onClick={() => handleSetDefault(acc._id)}
                    className="flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300"
                  >
                    <Star className="h-3.5 w-3.5" />
                    <span>Set as Primary Default</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Bank Account Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-100 mb-1">
              {editingAccount ? 'Edit Bank Account' : 'Add Operator Bank Account'}
            </h2>
            <p className="text-xs text-slate-400 mb-5">
              Parents will see this account details when depositing transport fees via Bank Transfer.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Bank Name *</label>
                  <input
                    type="text"
                    required
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g. Commercial Bank of Ceylon"
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Account Type</label>
                  <select
                    value={accountType}
                    onChange={(e) => setAccountType(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
                  >
                    <option value="Current">Current Account</option>
                    <option value="Savings">Savings Account</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Account Holder Name *</label>
                <input
                  type="text"
                  required
                  value={accountHolderName}
                  onChange={(e) => setAccountHolderName(e.target.value)}
                  placeholder="e.g. VanTrack LK Fleet Services (Pvt) Ltd"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Account Number *</label>
                  <input
                    type="text"
                    required
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="e.g. 800-123456-789"
                    className="w-full font-mono rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Branch Name *</label>
                  <input
                    type="text"
                    required
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    placeholder="e.g. Maharagama Main Branch"
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Deposit Instructions for Parents</label>
                <textarea
                  rows={2}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Instructions displayed on mobile fee payment screen..."
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isDefaultCheck"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-700 text-amber-500 focus:ring-amber-500"
                />
                <label htmlFor="isDefaultCheck" className="text-xs font-semibold text-slate-200">
                  Set as Primary DEFAULT Bank Account for Parents
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-amber-500 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400"
                >
                  {submitting ? 'Saving...' : editingAccount ? 'Update Account' : 'Save Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BankAccountListPage;
