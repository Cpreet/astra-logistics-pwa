import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format, formatDistanceToNowStrict } from 'date-fns'
import { Mail, MessageCircle, Send, Sparkles } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PageHeader } from '@/components/layout/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Field, Input, Textarea } from '@/components/ui/field'
import { Segmented } from '@/components/ui/segmented'
import { InquiryStatusBadge } from '@/components/ui/status-badge'
import { useToast } from '@/components/ui/toast'
import { buildInquiryMessageTemplates } from '@/domain/inquiry-message-templates'
import { useAuth } from '@/features/auth/auth-context'
import { inquiryMessageKeys, useInquiryMessages } from '@/hooks/use-inquiry-messages'
import { inquiryKeys } from '@/hooks/use-inquiries'
import { outboxKey } from '@/hooks/use-outbox'
import { getCustomerById, listContactsForCustomer } from '@/repositories/customer-repository'
import { getInquiryById } from '@/repositories/inquiry-repository'
import {
  createInquiryMessage,
  recordInboundInquiryMessage,
  sendInquiryMessage,
} from '@/repositories/inquiry-message-repository'
import type { InquiryMessage, InquiryMessageChannel } from '@/types/inquiry-message'
import { cn } from '@/utils/cn'

type ChannelTab = InquiryMessageChannel

function channelLabel(channel: InquiryMessageChannel): string {
  return channel === 'email' ? 'Email' : 'WhatsApp'
}

function statusTone(status: InquiryMessage['status']): 'neutral' | 'warning' | 'success' | 'danger' | 'info' {
  switch (status) {
    case 'draft':
      return 'neutral'
    case 'queued':
      return 'warning'
    case 'sent':
    case 'received':
      return 'success'
    case 'failed':
      return 'danger'
    default:
      return 'info'
  }
}

export function InquiryCommunicationsPage() {
  const { id = '' } = useParams()
  const { user, can } = useAuth()
  const queryClient = useQueryClient()
  const { notify } = useToast()
  const [channel, setChannel] = useState<ChannelTab>('email')
  const [toAddress, setToAddress] = useState('')
  const [contactName, setContactName] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [templateId, setTemplateId] = useState<string | null>(null)
  const [trailFilter, setTrailFilter] = useState<'all' | ChannelTab>('all')

  const { data: inquiry, isLoading } = useQuery({
    queryKey: inquiryKeys.detail(id),
    queryFn: () => getInquiryById(id),
    enabled: Boolean(id),
  })

  const { data: customer } = useQuery({
    queryKey: ['customers', inquiry?.customerId],
    queryFn: () => getCustomerById(inquiry!.customerId),
    enabled: Boolean(inquiry?.customerId),
  })

  const { data: contacts = [] } = useQuery({
    queryKey: ['customer-contacts', inquiry?.customerId],
    queryFn: () => listContactsForCustomer(inquiry!.customerId),
    enabled: Boolean(inquiry?.customerId),
  })

  const { data: messages = [], isLoading: messagesLoading } = useInquiryMessages(id)

  const primaryContact = useMemo(
    () => contacts.find((contact) => contact.isPrimary) ?? contacts[0],
    [contacts],
  )

  const templates = useMemo(
    () => (inquiry ? buildInquiryMessageTemplates(inquiry).filter((t) => t.channel === channel) : []),
    [inquiry, channel],
  )

  // Prefill recipient from the customer contact when the channel changes.
  useEffect(() => {
    if (!primaryContact) return
    if (channel === 'email') {
      setToAddress(primaryContact.email)
      setContactName(primaryContact.name)
    } else {
      setToAddress(primaryContact.phone ?? '')
      setContactName(primaryContact.name)
    }
  }, [channel, primaryContact])

  const applyTemplate = (id: string) => {
    const template = templates.find((item) => item.id === id)
    if (!template) return
    setTemplateId(template.id)
    setBody(template.body)
    if (template.subject) setSubject(template.subject)
  }

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: inquiryMessageKeys.forInquiry(id) })
    await queryClient.invalidateQueries({ queryKey: outboxKey })
  }

  const saveDraft = useMutation({
    mutationFn: async () => {
      if (!user || !inquiry) throw new Error('Not signed in')
      return createInquiryMessage(user.id, {
        inquiryId: inquiry.id,
        customerId: inquiry.customerId,
        channel,
        subject: channel === 'email' ? subject : null,
        body,
        toAddress,
        contactName,
        templateId,
        asDraft: true,
      })
    },
    onSuccess: async () => {
      await invalidate()
      notify({
        tone: 'success',
        message: 'Draft saved',
        description: navigator.onLine ? 'Queued for sync' : 'Saved offline on this device',
      })
    },
    onError: (error) =>
      notify({
        tone: 'error',
        message: 'Could not save draft',
        description: error instanceof Error ? error.message : undefined,
      }),
  })

  const saveAndSend = useMutation({
    mutationFn: async () => {
      if (!user || !inquiry) throw new Error('Not signed in')
      const created = await createInquiryMessage(user.id, {
        inquiryId: inquiry.id,
        customerId: inquiry.customerId,
        channel,
        subject: channel === 'email' ? subject : null,
        body,
        toAddress,
        contactName,
        templateId,
        asDraft: false,
      })
      return sendInquiryMessage(user.id, created.id)
    },
    onSuccess: async (sent) => {
      await invalidate()
      setBody('')
      if (channel === 'email') setSubject('')
      setTemplateId(null)
      notify({
        tone: 'success',
        message: `${channelLabel(sent.channel)} marked sent`,
        description: 'Simulated delivery — no external provider in this MVP',
      })
    },
    onError: (error) =>
      notify({
        tone: 'error',
        message: 'Could not send',
        description: error instanceof Error ? error.message : undefined,
      }),
  })

  const sendExisting = useMutation({
    mutationFn: (messageId: string) => {
      if (!user) throw new Error('Not signed in')
      return sendInquiryMessage(user.id, messageId)
    },
    onSuccess: async () => {
      await invalidate()
      notify({
        tone: 'success',
        message: 'Marked sent (simulated)',
        description: 'No real email or WhatsApp provider is connected',
      })
    },
    onError: (error) =>
      notify({
        tone: 'error',
        message: 'Send failed',
        description: error instanceof Error ? error.message : undefined,
      }),
  })

  const logReply = useMutation({
    mutationFn: async () => {
      if (!user || !inquiry || !primaryContact) throw new Error('Missing contact')
      return recordInboundInquiryMessage(user.id, {
        inquiryId: inquiry.id,
        customerId: inquiry.customerId,
        channel,
        body:
          channel === 'email'
            ? `Thanks — please proceed with pricing for ${inquiry.inquiryNumber}.`
            : `Thanks, please share the rates for ${inquiry.origin.code}-${inquiry.destination.code}.`,
        fromAddress: channel === 'email' ? primaryContact.email : (primaryContact.phone ?? '+000'),
        contactName: primaryContact.name,
        subject: channel === 'email' ? `Re: ${inquiry.inquiryNumber}` : null,
      })
    },
    onSuccess: async () => {
      await invalidate()
      notify({ tone: 'success', message: 'Inbound reply logged (demo)' })
    },
  })

  if (isLoading) {
    return <p className="text-sm text-muted">Loading communications…</p>
  }

  if (!inquiry) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted">This inquiry no longer exists.</p>
        <Link to="/inquiries" className="text-sm font-medium text-brand hover:underline">
          Back to inquiries
        </Link>
      </div>
    )
  }

  const trail = messages.filter((message) =>
    trailFilter === 'all' ? true : message.channel === trailFilter,
  )
  const canWrite = can('inquiries.write')

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={inquiry.inquiryNumber}
        title="Communications"
        description={`${inquiry.origin.code} → ${inquiry.destination.code} · ${customer?.legalName ?? 'Customer'}`}
        backTo={`/inquiries/${inquiry.id}`}
        backLabel="Inquiry"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <InquiryStatusBadge status={inquiry.status} />
            <Badge tone="warning">Simulated</Badge>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Draft pane */}
        <Card className="flex flex-col">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-sm">Compose</CardTitle>
              <p className="mt-0.5 text-xs text-muted">
                Draft stays on this device until you send. Delivery is simulated.
              </p>
            </div>
            <Segmented
              label="Channel"
              value={channel}
              onChange={(next) => {
                setChannel(next)
                setTemplateId(null)
                setBody('')
                setSubject('')
              }}
              options={[
                { value: 'email', label: 'Email' },
                { value: 'whatsapp', label: 'WhatsApp' },
              ]}
            />
          </div>

          {canWrite ? (
            <form
              className="flex flex-1 flex-col gap-3"
              onSubmit={(event) => {
                event.preventDefault()
                saveAndSend.mutate()
              }}
            >
              <Field label={channel === 'email' ? 'To' : 'WhatsApp number'} htmlFor="comm-to">
                <Input
                  id="comm-to"
                  value={toAddress}
                  onChange={(event) => setToAddress(event.target.value)}
                  placeholder={channel === 'email' ? 'name@company.com' : '+44…'}
                  autoComplete="off"
                />
              </Field>

              {channel === 'email' ? (
                <Field label="Subject" htmlFor="comm-subject">
                  <Input
                    id="comm-subject"
                    value={subject}
                    onChange={(event) => setSubject(event.target.value)}
                    placeholder="Subject line"
                  />
                </Field>
              ) : null}

              <div>
                <p className="mb-1.5 text-xs font-medium text-muted">Templates</p>
                <div className="flex flex-wrap gap-1.5">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => applyTemplate(template.id)}
                      className={cn(
                        'inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs transition-colors',
                        templateId === template.id
                          ? 'border-brand bg-brand-soft text-brand'
                          : 'border-line bg-surface text-muted hover:text-ink',
                      )}
                    >
                      <Sparkles className="size-3" aria-hidden />
                      {template.label}
                    </button>
                  ))}
                </div>
              </div>

              <Field label="Message" htmlFor="comm-body">
                <Textarea
                  id="comm-body"
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  rows={channel === 'email' ? 10 : 6}
                  placeholder={
                    channel === 'email'
                      ? 'Write the email…'
                      : 'Keep it short — WhatsApp style…'
                  }
                />
              </Field>

              <div className="mt-auto flex flex-col-reverse gap-2 border-t border-line pt-3 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  loading={saveDraft.isPending}
                  onClick={() => saveDraft.mutate()}
                >
                  Save draft
                </Button>
                <Button type="submit" loading={saveAndSend.isPending}>
                  <Send className="size-4" aria-hidden />
                  Send (simulated)
                </Button>
              </div>
            </form>
          ) : (
            <p className="text-sm text-muted">Your role can view the trail but not compose.</p>
          )}
        </Card>

        {/* Trail pane */}
        <Card className="flex min-h-[28rem] flex-col">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-sm">Trail</CardTitle>
              <p className="mt-0.5 text-xs text-muted">
                Everything logged against this inquiry — email and WhatsApp.
              </p>
            </div>
            <Segmented
              label="Trail filter"
              value={trailFilter}
              onChange={setTrailFilter}
              options={[
                { value: 'all', label: 'All', count: messages.length },
                {
                  value: 'email',
                  label: 'Email',
                  count: messages.filter((m) => m.channel === 'email').length,
                },
                {
                  value: 'whatsapp',
                  label: 'WhatsApp',
                  count: messages.filter((m) => m.channel === 'whatsapp').length,
                },
              ]}
            />
          </div>

          {messagesLoading ? (
            <p className="text-sm text-muted">Loading trail…</p>
          ) : trail.length === 0 ? (
            <EmptyState
              title="No messages yet"
              description="Draft an email or WhatsApp note on the left. It will appear here when saved."
              value="A trail keeps the commercial conversation next to the lane request."
              action={
                canWrite && primaryContact ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={logReply.isPending}
                    onClick={() => logReply.mutate()}
                  >
                    Log a demo reply
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <ul className="flex flex-1 flex-col gap-3 overflow-y-auto">
              {trail.map((message) => (
                <li
                  key={message.id}
                  className={cn(
                    'rounded-lg border border-line p-3',
                    message.direction === 'inbound' ? 'bg-raised' : 'bg-surface',
                  )}
                >
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    {message.channel === 'email' ? (
                      <Mail className="size-3.5 text-faint" aria-hidden />
                    ) : (
                      <MessageCircle className="size-3.5 text-faint" aria-hidden />
                    )}
                    <span className="text-xs font-medium text-ink">
                      {channelLabel(message.channel)} ·{' '}
                      {message.direction === 'outbound' ? 'Outbound' : 'Inbound'}
                    </span>
                    <Badge tone={statusTone(message.status)}>{message.status}</Badge>
                    {message.simulated ? <Badge tone="warning">Simulated</Badge> : null}
                    <span className="ml-auto text-xs text-faint">
                      {formatDistanceToNowStrict(new Date(message.createdAt))} ago
                    </span>
                  </div>

                  {message.subject ? (
                    <p className="mb-1 text-sm font-medium text-ink">{message.subject}</p>
                  ) : null}

                  <p className="whitespace-pre-wrap text-sm text-muted">{message.body}</p>

                  <dl className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-faint">
                    <div>
                      <dt className="inline">To </dt>
                      <dd className="inline text-muted">{message.toAddress}</dd>
                    </div>
                    {message.fromAddress ? (
                      <div>
                        <dt className="inline">From </dt>
                        <dd className="inline text-muted">{message.fromAddress}</dd>
                      </div>
                    ) : null}
                    {message.sentAt ? (
                      <div>
                        <dt className="inline">Sent </dt>
                        <dd className="inline text-muted">
                          {format(new Date(message.sentAt), 'PP p')}
                        </dd>
                      </div>
                    ) : null}
                  </dl>

                  {canWrite && (message.status === 'draft' || message.status === 'queued') ? (
                    <div className="mt-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        loading={sendExisting.isPending}
                        onClick={() => sendExisting.mutate(message.id)}
                      >
                        <Send className="size-3.5" aria-hidden />
                        Send draft
                      </Button>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}

          {trail.length > 0 && canWrite && primaryContact ? (
            <div className="mt-3 border-t border-line pt-3">
              <Button
                variant="ghost"
                size="sm"
                loading={logReply.isPending}
                onClick={() => logReply.mutate()}
              >
                Log demo customer reply
              </Button>
            </div>
          ) : null}
        </Card>
      </div>
    </div>
  )
}
