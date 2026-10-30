import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PiShieldCheck } from 'react-icons/pi';
import { auditApi, usersApi } from '../api/services.js';
import { getErrorMessage } from '../api/client.js';
import { formatDateTime } from '../utils/format.js';
import { roleLabel } from '../utils/roles.js';
import PageHeader from '../components/ui/PageHeader.jsx';
import Button from '../components/ui/Button.jsx';
import Badge from '../components/ui/Badge.jsx';
import { TextField, SelectField } from '../components/ui/Field.jsx';
import { SkeletonRows, EmptyState, ErrorState } from '../components/ui/States.jsx';

const ACTIONS = [
  ['login', 'Sign in'],
  ['login_failed', 'Failed sign in'],
  ['logout', 'Sign out'],
  ['view', 'Viewed'],
  ['create', 'Created'],
  ['update', 'Changed'],
  ['delete', 'Deleted'],
  ['print', 'Printed'],
  ['denied', 'Not allowed'],
];
const ACTION_LABEL = Object.fromEntries(ACTIONS);
const TONE = { login: 'ok', login_failed: 'danger', logout: 'neutral', view: 'info', create: 'gold', update: 'gold', delete: 'danger', print: 'neutral', denied: 'danger' };

// /audit — Super Admin only. Who signed in, viewed, changed, deleted or printed what, and when.
export default function AuditLog() {
  const [filters, setFilters] = useState({ from: '', to: '', user: '', action: '' });
  const [users, setUsers] = useState([]);
  const [rows, setRows] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [more, setMore] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    usersApi.list().then((d) => setUsers(d.users || [])).catch(() => {});
  }, []);

  const fetchPage = useCallback(
    async (before) => {
      const params = { limit: 50, before: before || undefined };
      Object.entries(filters).forEach(([k, v]) => {
        if (v) params[k] = v;
      });
      return auditApi.list(params);
    },
    [filters]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const d = await fetchPage();
      setRows(d.entries);
      setCursor(d.nextCursor);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [fetchPage]);

  useEffect(() => {
    load();
  }, [load]);

  const loadMore = async () => {
    setMore(true);
    try {
      const d = await fetchPage(cursor);
      setRows((r) => [...r, ...d.entries]);
      setCursor(d.nextCursor);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setMore(false);
    }
  };

  const set = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }));

  return (
    <>
      <PageHeader title="Audit log" subtitle="A permanent record of who signed in, opened, changed, deleted or printed records. It cannot be edited." />

      <div className="mb-5 grid gap-4 rounded-xl border border-line bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
        <TextField id="a-from" label="From" type="date" value={filters.from} onChange={set('from')} />
        <TextField id="a-to" label="To" type="date" value={filters.to} onChange={set('to')} />
        <SelectField id="a-user" label="Person" value={filters.user} onChange={set('user')}>
          <option value="">Everyone</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </SelectField>
        <SelectField id="a-action" label="What happened" value={filters.action} onChange={set('action')}>
          <option value="">Anything</option>
          {ACTIONS.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </SelectField>
      </div>

      <div className="overflow-hidden rounded-xl border border-line bg-white">
        {error && rows.length === 0 ? (
          <ErrorState message={error} onRetry={load} />
        ) : loading ? (
          <SkeletonRows />
        ) : rows.length === 0 ? (
          <EmptyState icon={PiShieldCheck} title="Nothing recorded for these filters" message="Try a wider date range." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left">
                <thead>
                  <tr className="border-b border-line bg-paper/60 text-[13px] text-muted">
                    <th className="px-5 py-3 font-semibold">When</th>
                    <th className="px-3 py-3 font-semibold">Who</th>
                    <th className="px-3 py-3 font-semibold">What</th>
                    <th className="px-3 py-3 font-semibold">Patient</th>
                    <th className="px-3 py-3 font-semibold">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line align-top">
                  {rows.map((e) => (
                    <tr key={e.id}>
                      <td className="whitespace-nowrap px-5 py-3 text-[14px] tabular-nums">{formatDateTime(e.at)}</td>
                      <td className="px-3 py-3 text-[14px]">
                        <span className="block font-medium">{e.userName || 'Unknown'}</span>
                        <span className="block text-xs text-muted">{e.userRole ? roleLabel(e.userRole) : ''}</span>
                      </td>
                      <td className="px-3 py-3 text-[14px]">
                        <Badge tone={TONE[e.action] || 'neutral'}>{ACTION_LABEL[e.action] || e.action}</Badge>
                        <span className="ml-2">{e.resource}</span>
                      </td>
                      <td className="px-3 py-3 text-[14px]">
                        {e.patient ? (
                          <Link to={`/patients/${e.patient.id}`} className="font-medium underline-offset-2 hover:underline">
                            {e.patient.name || e.patient.patientNo}
                            <span className="block text-xs font-normal text-muted">{e.patient.patientNo}</span>
                          </Link>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-[13px] text-muted">
                        {e.note && <span className="block">{e.note}</span>}
                        {e.fields.length > 0 && <span className="block">Fields: {e.fields.join(', ')}</span>}
                        {e.ip && <span className="block">IP {e.ip}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {cursor && (
              <div className="border-t border-line p-4 text-center">
                <Button variant="secondary" loading={more} onClick={loadMore}>
                  Load more
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
