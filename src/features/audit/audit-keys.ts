/**
 * Query keys for audit reads. Kept out of the component file so invalidating
 * the trail never depends on importing a React component, and so a mutation
 * anywhere can refresh every audit view with one prefix.
 */
export const auditKeys = {
  /** Prefix — invalidating this refreshes every audit query. */
  all: ['audit'] as const,
  entity: (entityId: string) => ['audit', 'entity', entityId] as const,
  recent: ['audit', 'recent'] as const,
}
