import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { PiPrinter, PiTrash, PiPencilSimple } from 'react-icons/pi';
import { invoicesApi } from '../api/services.js';
import { getErrorMessage } from '../api/client.js';
import useFetch from '../hooks/useFetch.js';
import { usePrint } from '../context/PrintContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { formatDate, fullName } from '../utils/format.js';
import { isSuperAdmin } from '../utils/roles.js';
import PageHeader from '../components/ui/PageHeader.jsx';
import Button from '../components/ui/Button.jsx';
import Panel from '../components/ui/Panel.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import { Spinner, ErrorState } from '../components/ui/States.jsx';
import PatientBar from '../components/consultations/PatientBar.jsx';

const METHOD_LABEL = { cash: 'Cash', card: 'Card', online: 'Online' };

export default function InvoiceView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { print } = usePrint();
  const { user } = useAuth();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { data, loading, error, reload } = useFetch(() => invoicesApi.get(id), [id]);

  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const inv = data.invoice;
  const p = inv.patient;
  const canManage = isSuperAdmin(user); // edit + delete are Super Admin only

  const remove = async () => {
    setDeleting(true);
    try {
      await invoicesApi.remove(id);
      toast.success('Invoice deleted');
      navigate(`/patients/${p._id}`, { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        back={{ to: `/patients/${p._id}`, label: fullName(p) }}
        title="Invoice"
        subtitle={`${inv.receiptNumber} · ${formatDate(inv.date)}`}
        actions={
          <>
            <Button variant="secondary" icon={PiPrinter} onClick={() => print('invoice', inv)}>
              Print
            </Button>
            {canManage && (
              <>
                <Button variant="secondary" icon={PiPencilSimple} to={`/invoices/${id}/edit`}>
                  Edit
                </Button>
                <Button
                  variant="dangerGhost"
                  icon={PiTrash}
                  onClick={() => setConfirmDelete(true)}
                  aria-label="Delete invoice"
                >
                  <span className="sr-only sm:not-sr-only">Delete</span>
                </Button>
              </>
            )}
          </>
        }
      />

      <PatientBar patient={p} className="mb-5" />

      <Panel title="Line items" bodyClassName="p-0">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-line bg-paper/60 text-[13px] text-muted">
              <th scope="col" className="px-5 py-3 font-semibold">Description</th>
              <th scope="col" className="px-5 py-3 text-right font-semibold">Amount €</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {inv.lineItems.map((it, i) => (
              <tr key={i}>
                <td className="px-5 py-3 text-[15px]">{it.description}</td>
                <td className="px-5 py-3 text-right text-[15px] tabular-nums">{it.amount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-end border-t border-line px-5 py-4 text-[17px] font-bold">
          Total: €{inv.subtotal.toFixed(2)}
        </div>
      </Panel>

      <Panel title="Payment" className="mt-6">
        <p className="text-[15px]">
          <span className="font-semibold">Method:</span> {METHOD_LABEL[inv.paymentMethod]}
        </p>
        {inv.paymentMethod === 'card' && (
          <div className="mt-2 space-y-1 text-[15px] text-muted">
            {inv.cardLast4 && <p>Card ending {inv.cardLast4}</p>}
            {inv.cardAuthCode && <p>Auth code: {inv.cardAuthCode}</p>}
          </div>
        )}
        <p className="mt-2 text-sm text-muted">Taken by {inv.takenBy}</p>
      </Panel>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this invoice?"
        message="This permanently deletes this invoice record. This cannot be undone."
        confirmLabel="Delete invoice"
        loading={deleting}
        onConfirm={remove}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}