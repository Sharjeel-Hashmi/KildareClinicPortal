import PageHeader from '../components/ui/PageHeader.jsx';
import ManageMedications from '../components/settings/ManageMedications.jsx';
import ManageLabs from '../components/settings/ManageLabs.jsx';

export default function Settings() {
  return (
    <>
      <PageHeader title="Settings" subtitle="Manage the clinic's medicine and lab lists" />
      <div className="space-y-6">
        <ManageMedications />
        <ManageLabs />
      </div>
    </>
  );
}