import React, { useState } from 'react';
import { UserPlus, Trash2, ShieldCheck, X } from 'lucide-react';
import type { AdminRole, AdminUser } from '../types/spark';
import { PRIMARY_ADMIN_EMAIL } from '../firebase';
import { useSparkAuth } from '../context/SparkAuthContext';
import { formatTimestamp } from '../lib/formatters';
import { ConfirmDialog } from '../components/ConfirmDialog';

interface AdminsViewProps {
  admins: AdminUser[];
  loading: boolean;
  onAddAdmin: (email: string, name: string, role: AdminRole, addedBy: string) => Promise<void>;
  onUpdateRole: (adminId: string, role: AdminRole) => Promise<void>;
  onRemoveAdmin: (adminId: string) => Promise<void>;
  onToast: (message: string, tone?: 'success' | 'error') => void;
  addOpenExternal?: boolean;
  onCloseAddExternal?: () => void;
}

export function AdminsView({
  admins,
  loading,
  onAddAdmin,
  onUpdateRole,
  onRemoveAdmin,
  onToast,
  addOpenExternal = false,
  onCloseAddExternal,
}: AdminsViewProps) {
  const { user } = useSparkAuth();
  const [addOpen, setAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const isAddModalOpen = addOpen || addOpenExternal;
  const currentUserEmail = (user?.email || '').trim().toLowerCase();

  const handleCloseAdd = () => {
    setAddOpen(false);
    onCloseAddExternal?.();
  };

  const handleRoleChange = async (admin: AdminUser, role: AdminRole) => {
    setBusyId(admin.id);
    try {
      await onUpdateRole(admin.id, role);
      onToast(`Updated ${admin.email} to ${role === 'super_admin' ? 'Super Admin' : 'Admin'}`);
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Failed to update admin role', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleConfirmRemove = async () => {
    if (!deleteTarget) return;
    setBusyId(deleteTarget.id);
    try {
      await onRemoveAdmin(deleteTarget.id);
      onToast(`Removed ${deleteTarget.email} from Admin Team`);
      setDeleteTarget(null);
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Failed to remove admin', 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header Strip */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Authorized Administrators</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Only <span className="font-mono">{PRIMARY_ADMIN_EMAIL}</span> and verified users
            listed in <span className="font-mono">/admins</span> can sign into this portal.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          Add Coordinator Admin
        </button>
      </div>

      {/* Primary Owner Notice Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-900 truncate">
              Primary Portal Owner (Protected)
            </div>
            <div className="text-xs font-mono text-slate-600 truncate">{PRIMARY_ADMIN_EMAIL}</div>
          </div>
        </div>
        <span className="text-xs font-medium text-blue-800 whitespace-nowrap shrink-0">
          Super Admin
        </span>
      </div>

      {/* /admins Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="h-12 bg-slate-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : admins.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm font-semibold text-slate-900">No coordinator admins added yet</p>
            <p className="mt-1 text-xs text-slate-500">
              Add coordinator emails to grant them Google Sign-In access to Spark Admin Portal.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                  <th className="py-3 px-5">Administrator</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Added By</th>
                  <th className="py-3 px-4">Added On</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {admins.map((admin) => {
                  const normalized = admin.email.trim().toLowerCase();
                  const isPrimary = normalized === PRIMARY_ADMIN_EMAIL.toLowerCase();
                  const isSelf = normalized === currentUserEmail;
                  const isBusy = busyId === admin.id;

                  return (
                    <tr key={admin.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="font-medium text-slate-900">
                          {admin.name || 'Unnamed Admin'}
                        </div>
                        <div className="text-xs font-mono text-slate-500 mt-0.5">
                          {admin.email}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <select
                          value={admin.role}
                          disabled={isBusy || isPrimary}
                          onChange={(e) =>
                            void handleRoleChange(admin, e.target.value as AdminRole)
                          }
                          aria-label={`Role for ${admin.email}`}
                          className="px-2.5 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-md text-slate-800 focus:outline-none focus:border-blue-600 disabled:opacity-60 cursor-pointer"
                        >
                          <option value="admin">Coordinator Admin</option>
                          <option value="super_admin">Super Admin</option>
                        </select>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-mono text-slate-600">
                        {admin.added_by || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-mono tabular-nums text-slate-500 whitespace-nowrap">
                        {formatTimestamp(admin.created_at)}
                      </td>
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        {isPrimary || isSelf ? (
                          <span className="text-xs text-slate-400">
                            {isPrimary ? 'Protected' : 'Current User'}
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => setDeleteTarget(admin)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Remove
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Admin Modal */}
      {isAddModalOpen && (
        <AddAdminModal
          addedBy={user?.email || PRIMARY_ADMIN_EMAIL}
          existingEmails={admins.map((a) => a.email.trim().toLowerCase())}
          onClose={handleCloseAdd}
          onAdd={async (email, name, role) => {
            await onAddAdmin(email, name, role, user?.email || PRIMARY_ADMIN_EMAIL);
            onToast(`Added ${email.toLowerCase()} to /admins`);
            handleCloseAdd();
          }}
        />
      )}

      {/* Remove Confirmation */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Remove Administrator"
        description={
          deleteTarget
            ? `Revoke portal access for "${deleteTarget.name || deleteTarget.email}" (${deleteTarget.email})? They will immediately lose admin permissions.`
            : ''
        }
        confirmLabel="Remove Access"
        destructive
        busy={Boolean(busyId)}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void handleConfirmRemove()}
      />
    </div>
  );
}

function AddAdminModal({
  addedBy,
  existingEmails,
  onClose,
  onAdd,
}: {
  addedBy: string;
  existingEmails: string[];
  onClose: () => void;
  onAdd: (email: string, name: string, role: AdminRole) => Promise<void>;
}) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<AdminRole>('admin');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = email.trim().toLowerCase();
    if (!normalized || !normalized.includes('@')) {
      setError('Please enter a valid Google account email.');
      return;
    }
    if (existingEmails.includes(normalized)) {
      setError('This email is already listed in /admins.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onAdd(normalized, name.trim() || normalized.split('@')[0], role);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add administrator.');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-[1px]">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Add Coordinator Admin</h2>
            <p className="text-xs text-slate-500 mt-0.5">Added by {addedBy}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Google Account Email *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="coordinator@college.edu"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">Full Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Priya Sharma"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as AdminRole)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
            >
              <option value="admin">Coordinator Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg cursor-pointer disabled:opacity-50"
            >
              {saving ? 'Adding…' : 'Grant Admin Access'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
