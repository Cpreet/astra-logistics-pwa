import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import {
  dismissActivation,
  getActivationState,
  isActivationDismissed,
  markActivationStep,
  type ActivationStep,
} from '@/services/activation-service'

export const activationKey = ['activation'] as const

export function useActivation() {
  const queryClient = useQueryClient()

  const state = useQuery({
    queryKey: activationKey,
    queryFn: async () => ({
      steps: await getActivationState(),
      dismissed: await isActivationDismissed(),
    }),
  })

  const markStep = useCallback(
    async (step: ActivationStep) => {
      await markActivationStep(step)
      await queryClient.invalidateQueries({ queryKey: activationKey })
    },
    [queryClient],
  )

  const dismiss = useMutation({
    mutationFn: dismissActivation,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: activationKey }),
  })

  return {
    steps: state.data?.steps ?? {},
    dismissed: state.data?.dismissed ?? false,
    loading: state.isLoading,
    markStep,
    dismiss: dismiss.mutate,
  }
}

/** Records offline usage the first time a change is saved without connectivity. */
export function useTrackOfflineSave() {
  const { markStep } = useActivation()
  return useCallback(() => {
    if (!navigator.onLine) {
      void markStep('worked_offline')
    }
  }, [markStep])
}
