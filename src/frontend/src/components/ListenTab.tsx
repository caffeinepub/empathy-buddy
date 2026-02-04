import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { AudioPlayer } from './AudioPlayer';
import { AudioRecorder } from './AudioRecorder';
import { Loader2, Heart, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAssignExpression, useRespondToExpression } from '../hooks/useQueries';
import { ExternalBlob, type Expression, EmpathyType } from '../backend';

export function ListenTab() {
  const navigate = useNavigate();
  const [assignedExpression, setAssignedExpression] = useState<Expression | null>(null);
  const [responseBlob, setResponseBlob] = useState<Blob | null>(null);
  const [responseStatus, setResponseStatus] = useState<'idle' | 'uploading' | 'success'>('idle');
  const [hasCompletedPlayback, setHasCompletedPlayback] = useState(false);
  const [playbackCount, setPlaybackCount] = useState(0);

  const assignMutation = useAssignExpression();
  const respondMutation = useRespondToExpression();

  const handleGetExpression = async () => {
    try {
      const expression = await assignMutation.mutateAsync();
      if (expression) {
        setAssignedExpression(expression);
        setResponseBlob(null);
        setResponseStatus('idle');
        setHasCompletedPlayback(false);
        setPlaybackCount(0);
      }
    } catch (error) {
      console.error('Failed to get expression:', error);
    }
  };

  const handlePlaybackComplete = () => {
    // Only increment count and mark as completed after successful full playback
    setPlaybackCount(prev => {
      const newCount = prev + 1;
      // Mark as completed after first successful playback
      if (newCount === 1) {
        setHasCompletedPlayback(true);
      }
      return newCount;
    });
  };

  const handleResponseComplete = (blob: Blob) => {
    // Store the exact blob that was recorded
    setResponseBlob(blob);
  };

  const handleSubmitResponse = async () => {
    if (!responseBlob || !assignedExpression) return;

    try {
      setResponseStatus('uploading');

      // Convert the recorded blob to Uint8Array without re-encoding
      const arrayBuffer = await responseBlob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const externalBlob = ExternalBlob.fromBytes(uint8Array);

      await respondMutation.mutateAsync({
        expressionId: assignedExpression.id,
        audioBlob: externalBlob,
      });

      setResponseStatus('success');
      setTimeout(() => {
        navigate({ to: '/home' });
      }, 2000);
    } catch (error) {
      console.error('Failed to submit response:', error);
      setResponseStatus('idle');
    }
  };

  const handlePresenceComplete = () => {
    setResponseStatus('success');
    setTimeout(() => {
      navigate({ to: '/home' });
    }, 2000);
  };

  const getEmpathyGuidance = (empathyType: EmpathyType) => {
    switch (empathyType) {
      case EmpathyType.silentPresence:
        return {
          title: 'Presence',
          guidance: 'Your role is to listen fully and offer presence, without words.',
        };
      case EmpathyType.reflection:
        return {
          title: 'Reflection',
          guidance: 'Reflect back what you hear the person is feeling, without advice or fixing.',
        };
      case EmpathyType.listening:
        return {
          title: 'Needs Guessing',
          guidance: 'Gently guess the needs you hear behind what was expressed, using tentative language.',
        };
      default:
        return {
          title: 'Listen',
          guidance: 'Listen with empathy and compassion.',
        };
    }
  };

  const requiresVoiceResponse = (empathyType: EmpathyType) => {
    return empathyType === EmpathyType.reflection || empathyType === EmpathyType.listening;
  };

  const hasReachedPlaybackLimit = playbackCount >= 3;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Listen with Empathy</CardTitle>
        <CardDescription>
          Listen to someone's expression and respond with compassion
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!assignedExpression && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="mb-6 rounded-full bg-primary/10 p-6">
              <Heart className="h-12 w-12 text-primary" />
            </div>
            <p className="mb-6 text-center text-muted-foreground">
              Ready to listen to someone who needs empathy?
            </p>
            <Button
              onClick={handleGetExpression}
              size="lg"
              disabled={assignMutation.isPending}
              className="min-w-[200px] btn-action"
            >
              {assignMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Finding...
                </>
              ) : (
                'Get Expression'
              )}
            </Button>
            {assignMutation.isError && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No expressions available right now. Check back soon!
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {assignedExpression && responseStatus !== 'success' && (
          <div className="space-y-6">
            {/* Display empathy guidance */}
            <Alert>
              <AlertDescription>
                <div className="space-y-2">
                  <div className="font-semibold">
                    {getEmpathyGuidance(assignedExpression.empathyType).title}
                  </div>
                  <div>
                    {getEmpathyGuidance(assignedExpression.empathyType).guidance}
                  </div>
                </div>
              </AlertDescription>
            </Alert>

            {/* Audio player */}
            <div>
              <h3 className="mb-3 text-sm font-medium">Listen to this expression:</h3>
              <AudioPlayer 
                audioBlob={assignedExpression.audioBlobId} 
                onPlaybackComplete={handlePlaybackComplete}
                disabled={hasReachedPlaybackLimit}
              />
            </div>

            {/* Playback limit message - only shown after third completed playback */}
            {hasReachedPlaybackLimit && (
              <Alert className="border-primary/50 bg-primary/10">
                <AlertDescription className="text-center">
                  You've listened fully. Take a moment, then respond in the way that was requested.
                </AlertDescription>
              </Alert>
            )}

            {/* Response section - only shown after first completed playback */}
            {hasCompletedPlayback && (
              <>
                {requiresVoiceResponse(assignedExpression.empathyType) ? (
                  <>
                    <div>
                      <h3 className="mb-3 text-sm font-medium">Record your empathetic response:</h3>
                      <AudioRecorder
                        onRecordingComplete={handleResponseComplete}
                        maxDuration={60}
                        disabled={responseStatus === 'uploading'}
                      />
                    </div>

                    {responseBlob && responseStatus === 'idle' && (
                      <div className="flex justify-center">
                        <Button 
                          onClick={handleSubmitResponse} 
                          size="lg" 
                          className="min-w-[200px] btn-action"
                        >
                          Submit Response
                        </Button>
                      </div>
                    )}

                    {responseStatus === 'uploading' && (
                      <Alert>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <AlertDescription>
                          Sending your response...
                        </AlertDescription>
                      </Alert>
                    )}
                  </>
                ) : (
                  <div className="flex justify-center">
                    <Button 
                      onClick={handlePresenceComplete} 
                      size="lg" 
                      className="min-w-[200px] btn-action"
                    >
                      I listened with presence
                    </Button>
                  </div>
                )}
              </>
            )}

            {/* Instruction message - only shown before first completed playback */}
            {!hasCompletedPlayback && (
              <Alert>
                <AlertDescription className="text-muted-foreground">
                  Please listen to the full expression before responding.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {responseStatus === 'success' && (
          <Alert className="border-green-500/50 bg-green-500/10">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-600 dark:text-green-400">
              Thank you for sharing your empathy! Returning to home...
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
