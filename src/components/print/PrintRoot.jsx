import { usePrint } from '../../context/PrintContext.jsx';
import PatientSheet from './PatientSheet.jsx';
import ConsultationSheet from './ConsultationSheet.jsx';

// Hidden on screen; when window.print() runs, this is the ONLY thing shown (see AppLayout `print:hidden`).
export default function PrintRoot() {
  const { job } = usePrint();
  if (!job) return null;

  return (
    <div
      id="print-root"
      className="hidden bg-white text-black print:block"
      style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
    >
      {job.kind === 'patient' && <PatientSheet patient={job.data} />}
      {job.kind === 'consultation' && <ConsultationSheet consultation={job.data} />}
    </div>
  );
}
