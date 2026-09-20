import Button from '../components/ui/Button.jsx';
import { EmptyState } from '../components/ui/States.jsx';
import { PiCompass } from 'react-icons/pi';

export default function NotFound() {
  return (
    <div className="rounded-xl border border-line bg-white">
      <EmptyState
        icon={PiCompass}
        title="Page not found"
        message="The page you’re looking for doesn’t exist or has moved."
        action={<Button to="/dashboard">Back to dashboard</Button>}
      />
    </div>
  );
}
