import { readSetting, writeSetting } from '@/repositories/settings-repository'
import { nowUtcIso } from '@/utils/time'

export const ACTIVATION_STEPS = [
  'created_customer',
  'created_inquiry',
  'advanced_inquiry',
  'worked_offline',
] as const

export type ActivationStep = (typeof ACTIVATION_STEPS)[number]

export type ActivationState = Partial<Record<ActivationStep, string>>

const ACTIVATION_KEY = 'activation_state'
const DISMISSED_KEY = 'activation_dismissed'

export async function getActivationState(): Promise<ActivationState> {
  return readSetting<ActivationState>(ACTIVATION_KEY, {})
}

export async function markActivationStep(step: ActivationStep): Promise<void> {
  const state = await getActivationState()
  if (state[step]) return
  await writeSetting(ACTIVATION_KEY, { ...state, [step]: nowUtcIso() })
}

export async function isActivationDismissed(): Promise<boolean> {
  return readSetting<boolean>(DISMISSED_KEY, false)
}

export async function dismissActivation(): Promise<void> {
  await writeSetting(DISMISSED_KEY, true)
}

export function activationProgress(state: ActivationState): {
  completed: number
  total: number
  done: boolean
} {
  const completed = ACTIVATION_STEPS.filter((step) => Boolean(state[step])).length
  return { completed, total: ACTIVATION_STEPS.length, done: completed === ACTIVATION_STEPS.length }
}
