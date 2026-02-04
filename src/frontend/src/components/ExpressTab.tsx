import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { AudioRecorder } from './AudioRecorder';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useUploadExpression, useModerateExpression } from '../hooks/useQueries';
import { ExternalBlob, EmpathyType } from '../backend';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';

export function ExpressTab() {
  const navigate = useNavigate();
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'moderating' | 'success' | 'rejected'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedEmpathyType, setSelectedEmpathyType] = useState<EmpathyType | null>(null);

  const uploadMutation = useUploadExpression();
  const moderateMutation = useModerateExpression();

  const handleRecordingComplete = (blob: Blob) => {
    // Store the exact blob that was recorded for upload
    setAudioBlob(blob);
    setUploadStatus('idle');
  };

  const handleUpload = async () => {
    if (!audioBlob || !selectedEmpathyType) return;

    try {
      setUploadStatus('uploading');
      setUploadProgress(0);

      // Convert the recorded blob to Uint8Array without re-encoding
      const arrayBuffer = await audioBlob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // Create ExternalBlob with progress tracking
      const externalBlob = ExternalBlob.fromBytes(uint8Array).withUploadProgress((percentage) => {
        setUploadProgress(Math.round(percentage));
      });

      // Upload expression to backend with empathy type
      const expressionId = await uploadMutation.mutateAsync({ audioBlob: externalBlob, empathyType: selectedEmpathyType });

      // Moderate expression (simulated safety check)
      setUploadStatus('moderating');
      const isSafe = await simulateModerationCheck();
      
      await moderateMutation.mutateAsync({ id: expressionId, isSafe });

      if (isSafe) {
        setUploadStatus('success');
        // Navigate to home after successful submission
        setTimeout(() => {
          navigate({ to: '/home' });
        }, 2000);
      } else {
        setUploadStatus('rejected');
      }
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadStatus('idle');
    }
  };

  // Simulated moderation check (in real app, this would be an AI service)
  const simulateModerationCheck = async (): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    // For demo purposes, randomly mark 10% as unsafe
    return Math.random() > 0.1;
  };

  const handleRetry = () => {
    setAudioBlob(null);
    setUploadStatus('idle');
    setUploadProgress(0);
    setSelectedEmpathyType(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Share Your Expression</CardTitle>
        <CardDescription>
          Record a voice message to share how you're feeling (max 60 seconds)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Gentle guidance message */}
        <Alert>
          <AlertDescription>
            Take a moment to center yourself. When you're ready, share what's on your heart. 
            Your voice matters, and someone is here to listen with empathy and care.
          </AlertDescription>
        </Alert>

        <AudioRecorder
          onRecordingComplete={handleRecordingComplete}
          maxDuration={60}
          disabled={uploadStatus !== 'idle'}
        />

        {audioBlob && uploadStatus === 'idle' && (
          <div className="space-y-4">
            {/* Empathy request selection */}
            <div className="space-y-3">
              <Label className="text-base font-medium">
                What are you requesting from the listener? <span className="text-destructive">*</span>
              </Label>
              <RadioGroup
                value={selectedEmpathyType || ''}
                onValueChange={(value) => setSelectedEmpathyType(value as EmpathyType)}
              >
                <div className="flex items-start space-x-2">
                  <RadioGroupItem value={EmpathyType.silentPresence} id="presence" className="mt-1" />
                  <Label htmlFor="presence" className="font-normal cursor-pointer leading-relaxed">
                    <span className="font-medium">Presence</span> – I don't need words. I just want to be heard and held in presence.
                  </Label>
                </div>
                <div className="flex items-start space-x-2">
                  <RadioGroupItem value={EmpathyType.reflection} id="reflection" className="mt-1" />
                  <Label htmlFor="reflection" className="font-normal cursor-pointer leading-relaxed">
                    <span className="font-medium">Reflection</span> – Please reflect back what you hear I'm feeling, without advice or fixing.
                  </Label>
                </div>
                <div className="flex items-start space-x-2">
                  <RadioGroupItem value={EmpathyType.listening} id="needsGuessing" className="mt-1" />
                  <Label htmlFor="needsGuessing" className="font-normal cursor-pointer leading-relaxed">
                    <span className="font-medium">Needs Guessing</span> – Please help me identify the needs behind what I'm expressing.
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="flex justify-center">
              <Button 
                onClick={handleUpload} 
                size="lg" 
                className="min-w-[200px] btn-action"
                disabled={!selectedEmpathyType}
              >
                Upload Expression
              </Button>
            </div>
          </div>
        )}

        {uploadStatus === 'uploading' && (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>
              Uploading your expression... {uploadProgress}%
            </AlertDescription>
          </Alert>
        )}

        {uploadStatus === 'moderating' && (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>
              Checking content safety...
            </AlertDescription>
          </Alert>
        )}

        {uploadStatus === 'success' && (
          <Alert className="border-green-500/50 bg-green-500/10">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-600 dark:text-green-400">
              Your expression has been shared successfully! Returning to home...
            </AlertDescription>
          </Alert>
        )}

        {uploadStatus === 'rejected' && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <span>Your recording didn't pass our safety check. Please try recording again with appropriate content.</span>
              <Button 
                onClick={handleRetry} 
                size="sm" 
                className="btn-action"
              >
                Try Again
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
