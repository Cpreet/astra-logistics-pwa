import { db } from '@/db/astra-db'
import type { User } from '@/types/user'

export async function listActiveUsers(): Promise<User[]> {
  return db.users.filter((user) => user.active).toArray()
}

export async function getUserById(id: string): Promise<User | undefined> {
  return db.users.get(id)
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  return db.users.where('email').equals(email.toLowerCase()).first()
}

export async function upsertUser(user: User): Promise<void> {
  await db.users.put(user)
}
