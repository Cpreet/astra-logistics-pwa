import { useQuery } from '@tanstack/react-query'
import { listCustomers } from '@/repositories/customer-repository'

export const customerKeys = {
  all: ['customers'] as const,
  detail: (id: string) => ['customers', id] as const,
}

export function useCustomers() {
  return useQuery({
    queryKey: customerKeys.all,
    queryFn: listCustomers,
  })
}
