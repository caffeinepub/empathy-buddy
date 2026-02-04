import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { ExpressTab } from '@/components/ExpressTab';

export function Express() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-2xl">
      <Button
        onClick={() => navigate({ to: '/home' })}
        variant="ghost"
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Home
      </Button>

      <ExpressTab />
    </div>
  );
}
