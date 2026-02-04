import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Mic, Headphones, Archive } from 'lucide-react';

export function Home() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-2xl">
      <div className="text-center">
        {/* Main Question */}
        <h1 className="mb-12 text-3xl font-bold tracking-tight md:text-4xl">
          Do you want to express or listen?
        </h1>

        {/* Navigation Buttons */}
        <div className="flex flex-col gap-4">
          <Button
            onClick={() => navigate({ to: '/express' })}
            size="lg"
            className="btn-action flex items-center justify-center gap-3 py-8 text-xl"
          >
            <Mic className="h-6 w-6" />
            Express
          </Button>

          <Button
            onClick={() => navigate({ to: '/listen' })}
            size="lg"
            className="btn-action flex items-center justify-center gap-3 py-8 text-xl"
          >
            <Headphones className="h-6 w-6" />
            Listen
          </Button>

          <Button
            onClick={() => navigate({ to: '/archive' })}
            size="lg"
            className="btn-action flex items-center justify-center gap-3 py-8 text-xl"
          >
            <Archive className="h-6 w-6" />
            Archive
          </Button>
        </div>
      </div>
    </div>
  );
}
