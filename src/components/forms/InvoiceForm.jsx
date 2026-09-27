import { useState } from 'react';
import toast from 'react-hot-toast';
import { PiPlus, PiTrash } from 'react-icons/pi';
import useForm from '../../hooks/useForm.js';
import useFetch from '../../hooks/useFetch.js';
import { servicesApi } from '../../api/services.js';
import { getErrorMessage, getFieldErrors } from '../../api/client.js';
import { validateInvoice } from '../../utils/validators.js';
import { todayInput } from '../../utils/format.js';
import Panel from '../ui/Panel.jsx';
import Button from '../ui/Button.jsx';
import ConfirmDialog from '../ui/ConfirmDialog.jsx';
import { TextField, SelectField, ChoiceGroup } from '../ui/Field.jsx';
import { Spinner } from '../ui/States.jsx';

const newLine = () => ({ description: '', amount: '' });

export const newInvoice = () => ({
  date: todayInput(),
  lineItems: [newLine()],
  paymentMethod: '',
  cardLast4: '',
  cardAuthCode: '',
});

const PAYMENT_OPTIONS = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'online', label: 'Online' },
];

export default function InvoiceForm({ initial, submitLabel = 'Save invoice', onSave, onCancel }) {
  const form = useForm(initial || newInvoice());
  const { values, set, bind, setValues } = form;
  const [saving, setSaving] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const servicesQ = useFetch(() => servicesApi.list(), []);
  const services = servicesQ.data?.services || [];

  const setLine = (i, patch) =>
    setValues((v) => ({ ...v, lineItems: v.lineItems.map((it, idx) => (idx === i ? { ...it, ...patch } : it)) }));
  const addLine = () => setValues((v) => ({ ...v, lineItems: [...v.lineItems, newLine()] }));
  const removeLine = (i) => setValues((v) => ({ ...v, lineItems: v.lineItems.filter((_, idx) => idx !== i) }));

  const pickService = (i, serviceId) => {
    const svc = services.find((s) => s._id === serviceId);
    if (svc) setLine(i, { description: svc.name, amount: String(svc.price) });
  };

  const subtotal = values.lineItems.reduce((sum, it) => sum + (Number(it.amount) || 0), 0);

  const submit = async (e) => {
    e.preventDefault();
    const errs = validateInvoice(values);
    if (Object.keys(errs).length) {
      form.setErrors(errs);
      toast.error('Please check the highlighted fields', { id: 'form-invalid' });
      return;
    }

    setSaving(true);
    try {
      await onSave({
        date: new Date(values.date).toISOString(),
        lineItems: values.lineItems
          .filter((it) => it.description.trim() && Number(it.amount) > 0)
          .map((it) => ({ description: it.description.trim(), amount: Number(it.amount) })),
        paymentMethod: values.paymentMethod,
        cardLast4: values.cardLast4.trim(),
        cardAuthCode: values.cardAuthCode.trim(),
      });
    } catch (err) {
      const fieldErrors = getFieldErrors(err);
      if (Object.keys(fieldErrors).length) form.setErrors(fieldErrors);
      toast.error(getErrorMessage(err));
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <Panel title="Invoice details">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField label="Date" type="date" required {...bind('date')} />
        </div>
      </Panel>

      <Panel
        title="Line items"
        action={
          <Button type="button" size="sm" variant="secondary" icon={PiPlus} onClick={addLine}>
            Add line
          </Button>
        }
      >
        {servicesQ.loading ? (
          <Spinner />
        ) : (
          <div className="space-y-3">
            {values.lineItems.map((it, i) => (
              <div key={i} className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_7rem_2.5rem] sm:items-end">
                <SelectField
                  label={i === 0 ? 'Quick add from services' : undefined}
                  value=""
                  onChange={(e) => pickService(i, e.target.value)}
                >
                  <option value="">Select service…</option>
                  {services.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} — €{s.price.toFixed(2)}
                    </option>
                  ))}
                </SelectField>
                <TextField
                  label={i === 0 ? 'Description' : undefined}
                  placeholder="Description"
                  value={it.description}
                  onChange={(e) => setLine(i, { description: e.target.value })}
                />
                <TextField
                  label={i === 0 ? 'Amount €' : undefined}
                  placeholder="0.00"
                  type="number"
                  step="0.01"
                  min="0"
                  value={it.amount}
                  onChange={(e) => setLine(i, { amount: e.target.value })}
                />
                <Button
                  type="button"
                  variant="dangerGhost"
                  size="sm"
                  icon={PiTrash}
                  disabled={values.lineItems.length === 1}
                  onClick={() => removeLine(i)}
                  aria-label="Remove line"
                />
              </div>
            ))}
          </div>
        )}
        {form.errors.lineItems && <p className="mt-3 text-[13px] font-medium text-danger">{form.errors.lineItems}</p>}
        <div className="mt-4 flex justify-end border-t border-line pt-4 text-[15px] font-semibold">
          Subtotal: €{subtotal.toFixed(2)}
        </div>
      </Panel>

      <Panel title="Payment">
        <ChoiceGroup
          legend="Payment method"
          name="paymentMethod"
          required
          value={values.paymentMethod}
          onChange={(v) => set('paymentMethod', v)}
          options={PAYMENT_OPTIONS}
          error={form.errors.paymentMethod}
        />

        {values.paymentMethod === 'card' && (
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <TextField label="Card last 4 digits" required maxLength={4} {...bind('cardLast4')} />
            <TextField label="Auth code" {...bind('cardAuthCode')} />
          </div>
        )}
      </Panel>

      <div className="sticky bottom-0 z-20 -mx-4 flex items-center justify-end gap-2 border-t border-line bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <Button variant="secondary" onClick={() => setConfirmCancel(true)} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" loading={saving}>
          {submitLabel}
        </Button>
      </div>
      <ConfirmDialog
        open={confirmCancel}
        title="Cancel this invoice?"
        message="Are you sure you want to cancel? Anything you have entered will not be saved."
        confirmLabel="Yes, cancel"
        cancelLabel="No, keep editing"
        onConfirm={() => {
          setConfirmCancel(false);
          onCancel();
        }}
        onCancel={() => setConfirmCancel(false)}
      />
    </form>
  );
}