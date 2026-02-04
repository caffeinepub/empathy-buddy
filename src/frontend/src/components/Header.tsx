import { Heart } from 'lucide-react';

export function Header() {
  return (
    <header className="border-b border-border/40 bg-background/80 backdrop-blur-sm">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-primary" fill="currentColor" />
          <span className="text-lg font-semibold">Empathy Buddy</span>
        </div>
      </div>
    </header>
  );
}
