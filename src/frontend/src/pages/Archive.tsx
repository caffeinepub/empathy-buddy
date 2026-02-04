import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export function Archive() {
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

      <div className="rounded-lg bg-card p-8 text-center shadow-sm">
        <h1 className="mb-4 text-3xl font-bold">Archive</h1>
        <p className="text-muted-foreground">
          Archive view placeholder - stored expressions and responses will be displayed here.
        </p>
      </div>
    </div>
  );
}
