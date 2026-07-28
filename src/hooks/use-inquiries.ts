import { useQuery } from '@tanstack/react-query'
import { listInquiries } from '@/repositories/inquiry-repository'

export const inquiryKeys = {
  all: ['inquiries'] as const,
  detail: (id: string) => ['inquiries', id] as const,
}

export function useInquiries() {
  return useQuery({
    queryKey: inquiryKeys.all,
    queryFn: listInquiries,
  })
}
