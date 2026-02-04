import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { ListenTab } from '@/components/ListenTab';

export function Listen() {
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

      <ListenTab />
    </div>
  );
}
