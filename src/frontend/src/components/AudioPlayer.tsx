import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Play, Pause, Loader2, AlertCircle } from 'lucide-react';
import { ExternalBlob } from '../backend';
import { Alert, AlertDescription } from './ui/alert';

interface AudioPlayerProps {
  audioBlob: ExternalBlob;
  onPlaybackComplete?: () => void;
  disabled?: boolean;
}

export function AudioPlayer({ audioBlob, onPlaybackComplete, disabled = false }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [hasAttemptedPlayback, setHasAttemptedPlayback] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hasLoadedSuccessfully, setHasLoadedSuccessfully] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const onPlaybackCompleteRef = useRef(onPlaybackComplete);

  // Keep the callback ref updated without triggering effects
  useEffect(() => {
    onPlaybackCompleteRef.current = onPlaybackComplete;
  }, [onPlaybackComplete]);

  useEffect(() => {
    // If audio has already loaded successfully, don't reload
    if (hasLoadedSuccessfully && audioRef.current) {
      return;
    }

    const loadAudio = async () => {
      try {
        setIsLoading(true);
        setHasError(false);

        // Get the direct URL from ExternalBlob and persist it
        const audioUrl = audioBlob.getDirectURL();
        audioUrlRef.current = audioUrl;
        
        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        audio.onloadedmetadata = () => {
          setDuration(audio.duration);
          setIsLoading(false);
          setHasLoadedSuccessfully(true);
        };

        audio.ontimeupdate = () => {
          setCurrentTime(audio.currentTime);
        };

        audio.onended = () => {
          setIsPlaying(false);
          setCurrentTime(0);
          // Use the ref to avoid dependency issues
          if (onPlaybackCompleteRef.current) {
            onPlaybackCompleteRef.current();
          }
        };

        audio.onerror = (e) => {
          console.error('Audio loading error:', e);
          setIsLoading(false);
          // Only set error if user has attempted playback
          if (hasAttemptedPlayback) {
            setHasError(true);
          }
        };

        // Preload the audio
        audio.load();
      } catch (error) {
        console.error('Failed to initialize audio:', error);
        setIsLoading(false);
        // Only set error if user has attempted playback
        if (hasAttemptedPlayback) {
          setHasError(true);
        }
      }
    };

    loadAudio();

    // Cleanup only when component unmounts, not on re-renders
    return () => {
      if (audioRef.current && !hasLoadedSuccessfully) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
    };
  }, [audioBlob, hasLoadedSuccessfully, hasAttemptedPlayback]);

  const togglePlayback = async () => {
    if (!audioRef.current || disabled) return;

    // Mark that user has attempted playback
    if (!hasAttemptedPlayback) {
      setHasAttemptedPlayback(true);
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
        setHasError(false); // Clear any previous errors on successful play
      } catch (err) {
        console.error('Playback error:', err);
        setHasError(true);
        setIsPlaying(false);
      }
    }
  };

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds) || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Only show error if user has attempted playback and it failed
  if (hasError && hasAttemptedPlayback) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Unable to load audio. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-medium">
          {isLoading ? 'Loading...' : 'Audio Expression'}
        </span>
        <span className="text-sm text-muted-foreground">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>

      <Progress value={progress} className="mb-6 h-2" />

      <div className="flex justify-center">
        <Button
          onClick={togglePlayback}
          disabled={isLoading || disabled}
          size="lg"
          className="min-w-[140px] btn-action"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading
            </>
          ) : isPlaying ? (
            <>
              <Pause className="mr-2 h-4 w-4" />
              Pause
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Play
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
