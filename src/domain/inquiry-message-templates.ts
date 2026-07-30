import type { Inquiry } from '@/types/inquiry'
import type { InquiryMessageChannel } from '@/types/inquiry-message'

export interface InquiryMessageTemplate {
  id: string
  channel: InquiryMessageChannel
  label: string
  subject?: string
  body: string
}

function lane(inquiry: Inquiry): string {
  return `${inquiry.origin.code} → ${inquiry.destination.code}`
}

/** Deterministic drafts pre-filled from the inquiry lane and cargo. */
export function buildInquiryMessageTemplates(inquiry: Inquiry): InquiryMessageTemplate[] {
  const laneLabel = lane(inquiry)
  return [
    {
      id: 'email-ack',
      channel: 'email',
      label: 'Acknowledge inquiry',
      subject: `Re: ${inquiry.inquiryNumber} — ${laneLabel}`,
      body: [
        `Thank you for your inquiry ${inquiry.inquiryNumber}.`,
        '',
        `We have logged the ${inquiry.transportMode} ${inquiry.direction} request ${laneLabel} and are preparing rates.`,
        '',
        `Cargo noted: ${inquiry.cargoSummary}`,
        '',
        'We will revert shortly with options.',
        '',
        'Kind regards,',
        'ASTRA Sales',
      ].join('\n'),
    },
    {
      id: 'email-details',
      channel: 'email',
      label: 'Request cargo details',
      subject: `${inquiry.inquiryNumber} — additional cargo details needed`,
      body: [
        `Regarding ${inquiry.inquiryNumber} (${laneLabel}), please confirm:`,
        '',
        '1. Pieces and dimensions',
        '2. Gross / chargeable weight',
        '3. Any DG or temperature control',
        '4. Preferred pickup window',
        '',
        'Thank you,',
        'ASTRA Sales',
      ].join('\n'),
    },
    {
      id: 'email-rate',
      channel: 'email',
      label: 'Share rate update',
      subject: `${inquiry.inquiryNumber} — rate update ${laneLabel}`,
      body: [
        `Please find a preliminary rate update for ${inquiry.inquiryNumber} (${laneLabel}).`,
        '',
        'Validity: 7 days from send.',
        'All rates are subject to space and final cargo details.',
        '',
        'Happy to hop on a call if helpful.',
        '',
        'Best regards,',
        'ASTRA Pricing',
      ].join('\n'),
    },
    {
      id: 'wa-ack',
      channel: 'whatsapp',
      label: 'Quick acknowledgement',
      body: `Hi — received ${inquiry.inquiryNumber} for ${laneLabel}. Working on rates and will update you here.`,
    },
    {
      id: 'wa-pickup',
      channel: 'whatsapp',
      label: 'Confirm pickup window',
      body: `Quick check on ${inquiry.inquiryNumber} (${laneLabel}): can you confirm preferred pickup date/time?`,
    },
    {
      id: 'wa-followup',
      channel: 'whatsapp',
      label: 'Follow up',
      body: `Following up on ${inquiry.inquiryNumber}. Any update on cargo details so we can finalise the quote?`,
    },
  ]
}
