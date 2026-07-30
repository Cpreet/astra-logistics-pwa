import { useQuery } from '@tanstack/react-query'
import { listMessagesForInquiry } from '@/repositories/inquiry-message-repository'

export const inquiryMessageKeys = {
  all: ['inquiry-messages'] as const,
  forInquiry: (inquiryId: string) => ['inquiry-messages', inquiryId] as const,
}

export function useInquiryMessages(inquiryId: string) {
  return useQuery({
    queryKey: inquiryMessageKeys.forInquiry(inquiryId),
    queryFn: () => listMessagesForInquiry(inquiryId),
    enabled: Boolean(inquiryId),
  })
}
