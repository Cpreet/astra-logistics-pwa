# ASTRA — Security Notes

**Read this before shipping anything to a real user.** ASTRA is a frontend-only offline-first MVP. It is a credible operational prototype, not a secured production system.

---

## 1. What is simulated — state it plainly

| Surface | Reality in the MVP |
|---------|--------------------|
| **Authentication** | **Demo only.** Seeded users, no password verification, session in local storage. Anyone with the device is any role they pick |
| Authorization | Real capability checks, but against an unverified identity |
| Sanctions / denied-party screening | Simulated adapter. **Not a compliance control** |
| Customs transmission | Simulated. Nothing is lodged with any authority |
| OCR | Deterministic simulation. No document is actually read |
| Email / SMS / push | Simulated. Nothing is sent |
| Sync transport | `MockLoopbackTransport` / `DisabledTransport`. No server exists |

The full register is [`spec.md`](./spec.md) §12. Every one of these renders with a visible badge and returns `simulated: true` in its result. **Removing a badge without replacing the implementation is a defect, not a cleanup.**

---

## 2. Controls that are real in the MVP

These are implemented and must stay implemented:

1. **Input validation** — Zod at the form *and* again at the repository. A bug in a form must not corrupt the database.
2. **Output escaping** — no `dangerouslySetInnerHTML` on user or document-derived content. Document previews render through object URLs in a sandboxed context, never as inline HTML.
3. **File restrictions** — PDF, PNG and JPEG only; ≤ 10 MB; checksum recorded; MIME type verified rather than trusted from the extension.
4. **Permission checks at the repository/service boundary**, not only in navigation. Hiding a nav item is not access control.
5. **Customer scoping** — a customer session's reads are constrained to its own `customerId` inside the repository, and tests attempt cross-customer reads to prove it.
6. **No credentials or secrets stored or committed** — no API keys in the bundle, none in the outbox payloads, none in seed data.
7. **No document contents in logs.** Technical error context is logged locally; payload bodies are not.
8. **Audit trail** — every important mutation records actor, before/after and reason, append-only.

### Customer-role exclusions (enforced, tested)

A customer session must never receive: buy rates · internal margins · vendor invoices · internal notes · internal incidents · any other customer's data.

---

## 3. Known limitations

1. **IndexedDB is not encrypted.** Anything stored locally — customer data, document Blobs, invoice figures — is readable by anyone with access to the device profile or the browser's dev tools.
2. **No session expiry, rotation or revocation.** The demo session persists until cleared.
3. **No server-side authorization.** Every rule is client-side and therefore advisory; a determined user can edit local state directly.
4. **No transport security to speak of** — there is no transport. When one is added, everything in §4 applies.
5. **No rate limiting, no abuse controls, no audit of reads.** The audit log covers mutations only.
6. **Blob storage counts against the origin quota.** A quota failure is surfaced as `E_QUOTA_EXCEEDED`; it is not silently swallowed, but it is also not gracefully recoverable beyond purging documents.
7. **Sequence blocks assume honest devices.** A tampered device could mint colliding numbers; the repository's duplicate check is the backstop.

---

## 4. Production-hardening requirements

Before this becomes a real product, all of the following are mandatory. None are optional.

### Identity and access
- Replace demo auth with a real identity provider (OIDC/OAuth 2.0), short-lived tokens, refresh rotation, and revocation.
- Enforce **every capability server-side**. Treat the client's checks as UX only.
- Add MFA for Administrator, Finance and Compliance roles.
- Add session expiry, idle timeout and device management.

### Data protection
- Encrypt local data at rest, or stop storing sensitive fields locally. Consider keeping document Blobs server-side with short-lived signed URLs and caching only metadata offline.
- Add a remote wipe / logout-everywhere path that clears IndexedDB.
- Classify fields: which may be cached offline at all, and for how long.

### Transport and API
- TLS everywhere; certificate pinning where the deployment allows.
- Authenticate and authorize every sync operation server-side, including `operationId` replay protection bound to the authenticated principal.
- Validate all payloads server-side against the same schemas — never trust `version`, `createdBy` or `syncStatus` from a client.
- Rate-limit sync and document upload endpoints.

### Application
- Content Security Policy without `unsafe-inline`; Subresource Integrity on any external asset.
- Server-side virus/malware scanning of uploaded documents before they are shared with anyone.
- Audit **reads** of sensitive data (documents, invoices, customer records), not only writes.
- Structured, centralised logging with PII redaction and retention limits.

### Compliance and integrations
- Replace the simulated sanctions adapter with a licensed screening provider, and record screening evidence with retention.
- Real customs gateways (ICS2/AMS) with their own credential handling and non-repudiation records.
- Data-protection review: GDPR/DPDP basis for processing, retention schedules, data-subject requests, and cross-border transfer terms — freight data is inherently cross-border.
- Confirm audit-retention duration meets the relevant customs and aviation-security regimes.

### Operations
- Dependency scanning and SBOM in CI.
- Secret scanning on every push.
- Penetration test before launch, focused on authorization bypass and customer-scope leakage.
- Documented incident-response and breach-notification process.

---

## 5. Reviewer checklist

For any PR touching data access, documents, finance or sync:

- [ ] Validation runs at the repository, not only the form
- [ ] Permission checked at the service/repository boundary
- [ ] Customer scope applied to every read of shipment, document, invoice and note data
- [ ] No user or document content rendered as HTML
- [ ] No secret, token or credential added to code, seed data or an outbox payload
- [ ] No document contents written to logs
- [ ] Audit entry written with actor and reason
- [ ] Any new simulated surface badged and registered in `spec.md` §12
- [ ] File type and size restrictions still enforced on any new upload path
