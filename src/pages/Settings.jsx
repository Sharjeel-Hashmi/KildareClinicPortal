import PageHeader from '../components/ui/PageHeader.jsx';
import ManageMedications from '../components/settings/ManageMedications.jsx';
import ManageLabs from '../components/settings/ManageLabs.jsx';
import ManageServices from '../components/settings/ManageServices.jsx';

export default function Settings() {
  return (
    <>
      <PageHeader title="Settings" subtitle="Manage the clinic's medicine, lab and service lists" />
      <div className="space-y-6">
        <ManageMedications />
        <ManageLabs />
        <ManageServices />
      </div>
    </>
  );
}