import PageHeader from '../components/ui/PageHeader.jsx';
import ManageMedications from '../components/settings/ManageMedications.jsx';
import ManageLabs from '../components/settings/ManageLabs.jsx';
import ManageServices from '../components/settings/ManageServices.jsx';
import ClinicStamp from '../components/settings/ClinicStamp.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { isSuperAdmin } from '../utils/roles.js';

export default function Settings() {
  const { user } = useAuth();
  return (
    <>
      <PageHeader title="Settings" subtitle="Manage the clinic's medicine, lab and service lists" />
      <div className="space-y-6">
        {isSuperAdmin(user) && <ClinicStamp />}
        <ManageMedications />
        <ManageLabs />
        <ManageServices />
      </div>
    </>
  );
}