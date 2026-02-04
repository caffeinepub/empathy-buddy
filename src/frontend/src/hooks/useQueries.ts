import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { ExternalBlob, type Expression, EmpathyType } from '../backend';
import { Principal } from '@icp-sdk/core/principal';

export function useUploadExpression() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ audioBlob, empathyType }: { audioBlob: ExternalBlob; empathyType: EmpathyType }): Promise<string> => {
      if (!actor) throw new Error('Actor not initialized');
      return await actor.uploadExpression(audioBlob, empathyType);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expressions'] });
    },
  });
}

export function useModerateExpression() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isSafe }: { id: string; isSafe: boolean }): Promise<void> => {
      if (!actor) throw new Error('Actor not initialized');
      return await actor.moderateExpression(id, isSafe);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expressions'] });
    },
  });
}

export function useAssignExpression() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (): Promise<Expression> => {
      if (!actor) throw new Error('Actor not initialized');
      const expression = await actor.assignRandomExpression(Principal.anonymous());
      if (!expression) {
        throw new Error('No expressions available');
      }
      return expression;
    },
  });
}

export function useRespondToExpression() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ expressionId, audioBlob }: { expressionId: string; audioBlob: ExternalBlob }): Promise<string> => {
      if (!actor) throw new Error('Actor not initialized');
      return await actor.respondToExpression(expressionId, audioBlob);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expressions'] });
      queryClient.invalidateQueries({ queryKey: ['responses'] });
    },
  });
}
