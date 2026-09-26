import { useState } from 'react';
import toast from 'react-hot-toast';
import useForm from '../../hooks/useForm.js';
import useFetch from '../../hooks/useFetch.js';
import { labsApi } from '../../api/services.js';
import { getErrorMessage, getFieldErrors } from '../../api/client.js';
import { validateReport } from '../../utils/validators.js';
import { todayInput } from '../../utils/format.js';
import Panel from '../ui/Panel.jsx';
import Button from '../ui/Button.jsx';
import ConfirmDialog from '../ui/ConfirmDialog.jsx';
import FileUpload from '../ui/FileUpload.jsx';
import { TextField, TextAreaField, SelectField } from '../ui/Field.jsx';
import { Spinner } from '../ui/States.jsx';

export const newReport = () => ({ labId: '', date: todayInput(), fileUrl: '', fileName: '', notes: '' });

export default function ReportForm({ submitLabel = 'Save report', onSave, onCancel }) {
  const form = useForm(newReport());
  const { values, set, bind } = form;
  const [saving, setSaving] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const labsQ = useFetch(() => labsApi.list(), []);
  const labs = labsQ.data?.labs || [];

  const submit = async (e) => {
    e.preventDefault();
    const errs = validateReport(values);
    if (Object.keys(errs).length) {
      form.setErrors(errs);
      form.focusFirstError(errs);
      toast.error('Please check the highlighted fields', { id: 'form-invalid' });
      return;
    }

    setSaving(true);
    try {
      await onSave({
        labId: values.labId,
        date: new Date(values.date).toISOString(),
        fileUrl: values.fileUrl,
        fileName: values.fileName,
        notes: values.notes.trim(),
      });
    } catch (err) {
      const fieldErrors = getFieldErrors(err);
      if (Object.keys(fieldErrors).length) {
        form.setErrors(fieldErrors);
        form.focusFirstError(fieldErrors);
      }
      toast.error(getErrorMessage(err));
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <Panel title="Report">
        {labsQ.loading ? (
          <Spinner />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            <SelectField label="Lab Name" required {...bind('labId')}>
              <option value="">Select lab…</option>
              {labs.map((l) => (
                <option key={l._id} value={l._id}>
                  {l.name}
                </option>
              ))}
            </SelectField>
            <TextField label="Report date" type="date" required {...bind('date')} />
            <div className="sm:col-span-2">
              <FileUpload
                label="Report file"
                required
                kind="report"
                accept="application/pdf,image/png,image/jpeg,image/webp"
                shape="row"
                hint="PDF or image (PNG/JPG)"
                error={form.errors.fileUrl}
                value={values.fileUrl}
                fileName={values.fileName}
                onChange={(url) => set('fileUrl', url)}
                onFileNameChange={(name) => set('fileName', name)}
              />
            </div>
            <TextAreaField label="Notes (optional)" rows={3} className="sm:col-span-2" {...bind('notes')} />
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
        title="Cancel this report?"
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