import { Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background/80 backdrop-blur-sm">
      <div className="container py-6 text-center text-sm text-muted-foreground">
        <p className="flex items-center justify-center gap-1.5">
          © 2025. Built with{' '}
          <Heart className="h-3.5 w-3.5 text-primary" fill="currentColor" />{' '}
          using{' '}
          <a
            href="https://caffeine.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </footer>
  );
}
