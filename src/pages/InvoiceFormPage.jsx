import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { patientsApi, invoicesApi } from '../api/services.js';
import useFetch from '../hooks/useFetch.js';
import PageHeader from '../components/ui/PageHeader.jsx';
import { Spinner, ErrorState } from '../components/ui/States.jsx';
import PatientBar from '../components/consultations/PatientBar.jsx';
import InvoiceForm from '../components/forms/InvoiceForm.jsx';
import { fullName, toDateInput } from '../utils/format.js';

// /patients/:patientId/invoices/new  OR  /invoices/:id/edit
export default function InvoiceFormPage() {
  const { patientId, id } = useParams();
  const navigate = useNavigate();
  const editing = Boolean(id);

  const { data, loading, error, reload } = useFetch(
    () =>
      editing
        ? invoicesApi.get(id).then((r) => ({ patient: r.invoice.patient, invoice: r.invoice }))
        : patientsApi.get(patientId).then((r) => ({ patient: r.patient, invoice: null })),
    [editing, id, patientId]
  );

  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const { patient, invoice } = data;
  const backTo = editing ? `/invoices/${id}` : `/patients/${patient._id}`;

  const initial = invoice
    ? {
        date: toDateInput(invoice.date),
        lineItems: invoice.lineItems.map((it) => ({ description: it.description, amount: String(it.amount) })),
        paymentMethod: invoice.paymentMethod,
        cardLast4: invoice.cardLast4 || '',
        cardAuthCode: invoice.cardAuthCode || '',
      }
    : undefined;

  const save = async (payload) => {
    if (editing) {
      await invoicesApi.update(id, payload);
      toast.success('Invoice updated');
      navigate(`/invoices/${id}`);
    } else {
      const res = await patientsApi.createInvoice(patient._id, payload);
      toast.success('Invoice created');
      navigate(`/invoices/${res.invoice._id}`);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        back={{ to: backTo, label: editing ? 'Invoice' : fullName(patient) }}
        title={editing ? 'Edit invoice' : 'Create invoice'}
      />
      <PatientBar patient={patient} className="mb-5" />
      <InvoiceForm
        initial={initial}
        submitLabel={editing ? 'Save changes' : 'Save invoice'}
        onSave={save}
        onCancel={() => navigate(backTo)}
      />
    </div>
  );
}