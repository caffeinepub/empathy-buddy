import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Mic, Square, Play, Pause, RotateCcw } from 'lucide-react';
import { cn } from '../lib/utils';

interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
  maxDuration: number;
  disabled?: boolean;
}

export function AudioRecorder({ onRecordingComplete, maxDuration, disabled }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioURL) URL.revokeObjectURL(audioURL);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [audioURL]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        // Create blob with proper mime type
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
        
        // Store the blob for upload
        setAudioBlob(blob);
        
        // Create URL for preview playback
        const url = URL.createObjectURL(blob);
        setAudioURL(url);
        
        // Pass the same blob to parent
        onRecordingComplete(blob);
        
        // Clean up stream
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          const newTime = prev + 1;
          if (newTime >= maxDuration) {
            stopRecording();
            return maxDuration;
          }
          return newTime;
        });
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const togglePlayback = () => {
    if (!audioURL) return;

    if (!audioRef.current) {
      audioRef.current = new Audio(audioURL);
      audioRef.current.onended = () => setIsPlaying(false);
      audioRef.current.onerror = (e) => {
        console.error('Audio playback error:', e);
        setIsPlaying(false);
      };
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(err => {
        console.error('Failed to play audio:', err);
        setIsPlaying(false);
      });
      setIsPlaying(true);
    }
  };

  const resetRecording = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (audioURL) {
      URL.revokeObjectURL(audioURL);
    }
    setAudioURL(null);
    setAudioBlob(null);
    setRecordingTime(0);
    setIsPlaying(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = (recordingTime / maxDuration) * 100;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border-2 border-border bg-card p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm font-medium">
            {isRecording ? 'Recording...' : audioBlob ? 'Recording Complete' : 'Ready to Record'}
          </span>
          <span className="text-sm font-medium text-muted-foreground">
            {formatTime(recordingTime)} / {formatTime(maxDuration)}
          </span>
        </div>

        <Progress value={progress} className="mb-6 h-2" />

        <div className="flex flex-wrap items-center justify-center gap-3">
          {!isRecording && !audioBlob && (
            <Button
              onClick={startRecording}
              disabled={disabled}
              size="lg"
              className="min-w-[140px] btn-action"
            >
              <Mic className="mr-2 h-4 w-4" />
              Start Recording
            </Button>
          )}

          {isRecording && (
            <Button
              onClick={stopRecording}
              variant="destructive"
              size="lg"
              className="min-w-[140px] shadow-md hover:shadow-lg transition-shadow"
            >
              <Square className="mr-2 h-4 w-4" />
              Stop
            </Button>
          )}

          {audioBlob && (
            <>
              <Button
                onClick={togglePlayback}
                size="lg"
                className="btn-action"
              >
                {isPlaying ? (
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
              <Button
                onClick={resetRecording}
                size="lg"
                disabled={disabled}
                className="btn-action"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Re-record
              </Button>
            </>
          )}
        </div>

        {isRecording && (
          <div className="mt-4 flex justify-center">
            <div className={cn(
              "h-3 w-3 rounded-full bg-destructive animate-pulse"
            )} />
          </div>
        )}
      </div>
    </div>
  );
}
