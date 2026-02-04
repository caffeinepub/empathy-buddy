import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Heart } from 'lucide-react';

export function Onboarding() {
  const navigate = useNavigate();
  const [language, setLanguage] = useState<string>('en');

  const handleContinue = () => {
    navigate({ to: '/home' });
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="text-center">
        {/* Logo */}
        <div className="mb-6 inline-flex items-center justify-center rounded-full bg-primary/10 p-4">
          <Heart className="h-12 w-12 text-primary" fill="currentColor" />
        </div>

        {/* Title */}
        <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">
          Welcome to Empathy Buddy
        </h1>

        {/* Language Selection */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <label htmlFor="language-select" className="text-sm font-medium text-muted-foreground">
            Select your language
          </label>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger id="language-select" className="w-64">
              <SelectValue placeholder="Choose language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="es">Español</SelectItem>
              <SelectItem value="fr">Français</SelectItem>
              <SelectItem value="de">Deutsch</SelectItem>
              <SelectItem value="it">Italiano</SelectItem>
              <SelectItem value="pt">Português</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Explanation */}
        <div className="mb-8 rounded-lg bg-card p-6 text-left shadow-sm">
          <h2 className="mb-3 text-xl font-semibold">The Empathy Ritual</h2>
          <p className="text-muted-foreground leading-relaxed">
            Empathy Buddy is a space for anonymous voice expression and empathetic listening. 
            Share your thoughts and feelings through voice recordings, or listen to others and 
            respond with compassion. Every voice matters, every listener makes a difference.
          </p>
        </div>

        {/* Continue Button */}
        <Button
          onClick={handleContinue}
          size="lg"
          className="btn-action px-8 py-6 text-lg"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
