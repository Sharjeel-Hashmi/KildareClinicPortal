import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { PiUserPlus, PiUsersThree, PiPencilSimple, PiTrash, PiIdentificationCard, PiClockCounterClockwise } from 'react-icons/pi';
import { usersApi } from '../api/services.js';
import { getErrorMessage } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import useFetch from '../hooks/useFetch.js';
import PageHeader from '../components/ui/PageHeader.jsx';
import Button from '../components/ui/Button.jsx';
import Badge from '../components/ui/Badge.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import { SkeletonRows, EmptyState, ErrorState } from '../components/ui/States.jsx';

export default function Doctors() {
  const { user: me } = useAuth();
  const navigate = useNavigate();
  const [confirmId, setConfirmId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { data, loading, error, reload } = useFetch(() => usersApi.list(), []);
  const users = data?.users || [];
  const target = users.find((u) => u.id === confirmId);

  const remove = async () => {
    setDeleting(true);
    try {
      await usersApi.remove(confirmId);
      toast.success('Account deleted');
      setConfirmId(null);
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Doctors"
        subtitle="Doctor and administrator accounts for the portal"
        actions={
          <Button to="/doctors/new" icon={PiUserPlus}>
            Add doctor
          </Button>
        }
      />

      <div className="overflow-hidden rounded-xl border border-line bg-white">
        {error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : loading ? (
          <SkeletonRows />
        ) : users.length === 0 ? (
          <EmptyState
            icon={PiUsersThree}
            title="No accounts yet"
            message="Add the clinic's doctors so they can sign in."
            action={
              <Button to="/doctors/new" icon={PiUserPlus}>
                Add doctor
              </Button>
            }
          />
        ) : (
          <>
            {/* Desktop table */}
            <table className="hidden w-full text-left md:table">
              <thead>
                <tr className="border-b border-line bg-paper/60 text-[13px] font-semibold text-muted">
                  <th scope="col" className="px-5 py-3 font-semibold">Name</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Email</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Phone</th>
                  <th scope="col" className="px-3 py-3 font-semibold">IMC No.</th>
                  <th scope="col" className="px-3 py-3 text-right font-semibold">Patients seen</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Role</th>
                  <th scope="col" className="w-32 px-3 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {users.map((u) => (
                  <tr key={u.id} className="transition-colors hover:bg-gold-50/60">
                    <td className="px-5 py-3">
                      <Link
                        to={`/doctors/${u.id}/edit`}
                        className="font-semibold text-ink underline-offset-2 hover:underline"
                      >
                        {u.name}
                      </Link>
                      {u.id === me?.id && <span className="ml-2 text-xs text-muted">(you)</span>}
                    </td>
                    <td className="px-3 py-3 text-[15px] text-muted">{u.email}</td>
                    <td className="px-3 py-3 text-[15px] text-muted">{u.phone || '—'}</td>
                    <td className="px-3 py-3 text-[15px] tabular-nums text-muted">{u.imcNumber || '—'}</td>
                    <td className="px-3 py-3 text-right">
                      <Link
                        to={`/doctors/${u.id}/activity`}
                        className="font-semibold text-gold-700 tabular-nums underline-offset-2 hover:underline"
                      >
                        {u.consultationCount}
                      </Link>
                    </td>
                    <td className="px-3 py-3">
                      <Badge tone={u.role === 'admin' ? 'gold' : 'neutral'}>
                        {u.role === 'admin' ? 'Admin' : 'Doctor'}
                      </Badge>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="secondary"
                          icon={PiClockCounterClockwise}
                          onClick={() => navigate(`/doctors/${u.id}/activity`)}
                          aria-label={`View ${u.name}'s activity`}
                        >
                          <span className="sr-only">Activity</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          icon={PiPencilSimple}
                          onClick={() => navigate(`/doctors/${u.id}/edit`)}
                          aria-label={`Edit ${u.name}`}
                        >
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="dangerGhost"
                          icon={PiTrash}
                          onClick={() => setConfirmId(u.id)}
                          disabled={u.id === me?.id}
                          aria-label={`Delete ${u.name}`}
                        >
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile list */}
            <ul className="divide-y divide-line md:hidden">
              {users.map((u) => (
                <li key={u.id} className="flex items-center gap-3 px-4 py-3.5">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-gold-100 text-gold-700">
                    <PiIdentificationCard size={20} aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <Link to={`/doctors/${u.id}/edit`} className="block truncate font-semibold text-ink">
                      {u.name} {u.id === me?.id && <span className="text-xs text-muted">(you)</span>}
                    </Link>
                    <span className="block truncate text-sm text-muted">
                      {u.email} {u.imcNumber && `· IMC ${u.imcNumber}`}
                    </span>
                    <Link
                      to={`/doctors/${u.id}/activity`}
                      className="mt-0.5 inline-block text-sm font-semibold text-gold-700 underline-offset-2 hover:underline"
                    >
                      {u.consultationCount} patients seen
                    </Link>
                  </span>
                  <Badge tone={u.role === 'admin' ? 'gold' : 'neutral'}>{u.role === 'admin' ? 'Admin' : 'Doctor'}</Badge>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(confirmId)}
        title="Delete this account?"
        message={`This permanently deletes ${target?.name || 'this account'}'s sign-in. Consultations, prescriptions and certificates they created stay on record. This cannot be undone.`}
        confirmLabel="Delete account"
        loading={deleting}
        onConfirm={remove}
        onCancel={() => setConfirmId(null)}
      />
    </>
  );
}