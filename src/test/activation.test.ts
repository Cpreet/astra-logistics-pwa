import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/db/astra-db'
import {
  activationProgress,
  getActivationState,
  markActivationStep,
} from '@/services/activation-service'

describe('activation tracking', () => {
  beforeEach(async () => {
    await db.close()
    await db.delete()
    await db.open()
  })

  it('starts with no completed steps', async () => {
    const progress = activationProgress(await getActivationState())
    expect(progress.completed).toBe(0)
    expect(progress.done).toBe(false)
  })

  it('records a step once and is idempotent', async () => {
    await markActivationStep('created_customer')
    const first = await getActivationState()
    await markActivationStep('created_customer')
    const second = await getActivationState()

    expect(second.created_customer).toBe(first.created_customer)
    expect(activationProgress(second).completed).toBe(1)
  })

  it('completes once every step is recorded', async () => {
    await markActivationStep('created_customer')
    await markActivationStep('created_inquiry')
    await markActivationStep('advanced_inquiry')
    await markActivationStep('worked_offline')

    expect(activationProgress(await getActivationState()).done).toBe(true)
  })
})
