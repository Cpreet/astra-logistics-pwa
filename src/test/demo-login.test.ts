import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/db/astra-db'
import { bootstrapLocalDatabase } from '@/db/bootstrap'
import { DEMO_LOGIN_PASSWORD } from '@/domain/demo-auth'
import { getUserByEmail } from '@/repositories/user-repository'

describe('demo login accounts', () => {
  beforeEach(async () => {
    await db.close()
    await db.delete()
    await db.open()
    await bootstrapLocalDatabase()
  })

  it('seeds ten active users with distinct roles', async () => {
    const users = await db.users.filter((user) => user.active).toArray()
    expect(users.length).toBe(10)
    const roles = new Set(users.map((user) => user.role))
    expect(roles.size).toBe(10)
  })

  it('resolves sales demo user by email for login', async () => {
    const user = await getUserByEmail('sales@astra.demo')
    expect(user?.role).toBe('sales_executive')
    expect(user?.email).toBe('sales@astra.demo')
  })

  it('documents the shared demo password constant', () => {
    expect(DEMO_LOGIN_PASSWORD).toBe('astra')
  })
})
