import type { BaseEntity } from '@/types/base'
import { createId } from '@/utils/id'
import { nowUtcIso } from '@/utils/time'

export function createBaseEntity(userId: string): BaseEntity {
  const now = nowUtcIso()
  return {
    id: createId(),
    createdAt: now,
    updatedAt: now,
    createdBy: userId,
    updatedBy: userId,
    version: 1,
    syncStatus: 'local',
    deletedAt: null,
  }
}

export function touchEntity<T extends BaseEntity>(entity: T, userId: string): T {
  return {
    ...entity,
    updatedAt: nowUtcIso(),
    updatedBy: userId,
    version: entity.version + 1,
    syncStatus: 'pending',
  }
}
