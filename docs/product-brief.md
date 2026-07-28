# ASTRA — Product Brief (source requirement)

> **This is the original, unedited product brief.** It is the source of truth for *what* must be built.
> It is reproduced verbatim; do not edit it to match the code.
>
> Where the brief needed interpretation or extension to be buildable against 2026 market practice,
> the reasoning is in [`market-research.md`](./market-research.md) (`D-01`–`D-30`) and the resulting
> contract is in [`spec.md`](./spec.md). Nothing in the brief has been dropped — see
> `spec.md` §21 for the requirement-to-implementation traceability matrix.

---

You are a senior staff software engineer and product architect.

Build a complete, polished, offline-first logistics ERP Progressive Web Application called:

ASTRA
AI-Powered Freight Intelligence Platform

Create the project from scratch in the current repository.

The initial implementation must focus on the Air Freight Management module while keeping the domain model extensible for:

- Air freight
- Sea freight
- Road transport
- Rail freight
- Courier shipments
- Import operations
- Export operations

Do not build a collection of disconnected demo screens. Build a coherent application with working navigation, persistent local data, operational workflows, state transitions, validation, audit history, financial calculations and offline synchronization behaviour.

======================================================================
1. PRODUCT OBJECTIVE
======================================================================

ASTRA manages the complete freight-forwarding lifecycle:

1. Customer inquiry
2. CRM lead creation
3. Sales quotation
4. Customer approval
5. Booking confirmation
6. Shipment creation
7. Document collection
8. OCR extraction
9. Data validation
10. Compliance validation
11. Shipment priority scoring
12. Carrier selection
13. Carrier booking
14. Cargo pickup
15. Warehouse acceptance
16. Export customs clearance
17. Flight or vessel departure
18. Real-time tracking
19. Delay prediction
20. Customer notifications
21. Arrival
22. Import customs clearance
23. Delivery planning
24. Final delivery
25. Proof of delivery
26. Billing
27. Accounts receivable
28. Vendor payments
29. Financial accounting and profitability
30. Operational and management reporting

The application should help freight-forwarding teams:

- Track every shipment from inquiry to financial closure
- Work when the device is offline
- Store pending changes safely
- Detect operational exceptions
- Manage documents and compliance
- Calculate buy charges, sell charges, margin and profit
- Preserve a complete audit trail
- Surface delayed shipments and SLA risks
- Resolve sync conflicts
- Give customers visibility into shipments, invoices and documents

======================================================================
2. IMPLEMENTATION MODE
======================================================================

Before writing code:

1. Inspect the repository.
2. Produce a concise implementation plan in `docs/implementation-plan.md`.
3. Produce a domain model in `docs/domain-model.md`.
4. Produce an offline-sync design in `docs/offline-sync.md`.
5. Then begin implementation without waiting for another response.

Do not stop after planning.

Build the application incrementally and keep the repository runnable after each phase.

Use small, meaningful commits such as:

- chore: initialize ASTRA React PWA
- feat: add Dexie persistence layer
- feat: implement customer management
- feat: add quotation workflow
- feat: implement shipment lifecycle
- feat: add document review workflow
- feat: implement finance calculations
- feat: add offline synchronization queue
- test: cover shipment state transitions
- docs: add setup and architecture guide

Do not put the entire application into one commit.

======================================================================
3. REQUIRED TECHNOLOGY STACK
======================================================================

Use:

- React
- TypeScript with strict mode
- Vite
- React Router
- Dexie
- IndexedDB
- vite-plugin-pwa
- React Hook Form
- Zod
- TanStack Query where useful
- date-fns
- Lucide icons
- Vitest
- React Testing Library
- fake-indexeddb for persistence tests

For styling:

- Use Tailwind CSS
- Build reusable accessible components
- You may use shadcn/ui patterns, but do not make the application dependent on a hosted component service
- Avoid introducing a large dependency for functionality that can be implemented simply

Package manager:

- npm

Node requirement:

- Node.js 20 or newer

The application must work as a frontend-only offline-first MVP.

Do not require a real backend to demonstrate the core product.

However, design repository and synchronization interfaces so a REST or GraphQL backend can be added later without rewriting the UI or domain logic.

======================================================================
4. ARCHITECTURAL PRINCIPLES
======================================================================

Follow these principles:

1. IndexedDB is the local operational database.
2. The application shell must load without a network connection.
3. User mutations must be written locally first.
4. Synchronization must occur asynchronously.
5. Domain logic must not live inside page components.
6. State transitions must be validated centrally.
7. Financial values must be calculated through reusable services.
8. Every important mutation must create an audit log.
9. AI functionality must degrade gracefully to deterministic rules.
10. The application must never pretend that a simulated integration is real.
11. Store timestamps in ISO 8601 UTC format.
12. Display dates and numbers using the user’s locale.
13. Use stable UUID identifiers.
14. Avoid direct IndexedDB calls from UI components.
15. Keep transport, repository and domain layers separate.
16. All queued operations must be idempotent.
17. Historical shipment events must be append-only.
18. Financially closed shipments must not be silently mutated.

Suggested layering:

src/
  app/
  components/
  db/
  domain/
  features/
  hooks/
  layouts/
  pages/
  repositories/
  services/
  sync/
  test/
  types/
  utils/

Use feature-oriented folders within `features`.

======================================================================
5. USER ROLES
======================================================================

Support these roles:

1. Administrator
   - Full access
   - User and settings management
   - Can resolve synchronization conflicts

2. Sales Executive
   - Customers
   - Inquiries
   - Quotations
   - Bookings

3. Pricing Executive
   - Rate calculations
   - Buy and sell charges
   - Margin review
   - Pricing approvals

4. Operations Executive
   - Shipment creation
   - Carrier booking
   - Pickup
   - Tracking
   - Delivery coordination

5. Documentation Executive
   - Document upload
   - OCR review
   - Document verification
   - Missing-document follow-up

6. Compliance Officer
   - Compliance review
   - HS code validation
   - Dangerous-goods checks
   - Shipment holds and releases

7. Warehouse Executive
   - Cargo receipt
   - Inspection
   - Quantity and damage reporting

8. Finance Executive
   - Customer invoices
   - Receivables
   - Vendor invoices
   - Payments
   - Profitability

9. Manager
   - Dashboards
   - SLA monitoring
   - Approvals
   - Reports
   - Incident escalation

10. Customer
    - Read-only customer portal
    - Own shipments
    - Tracking
    - Documents
    - Invoices
    - Payment status

For the frontend-only MVP, implement demo authentication using seeded users.

Clearly label it as demo authentication in the README. Do not describe it as production-grade authentication.

Implement reusable permission guards even though authentication is simulated.

======================================================================
6. CORE DOMAIN MODEL
======================================================================

Every persisted entity should contain, where relevant:

- id
- createdAt
- updatedAt
- createdBy
- updatedBy
- version
- syncStatus
- deletedAt for soft deletion where appropriate

Use the following sync statuses:

- local
- pending
- syncing
- synced
- failed
- conflict

----------------------------------------------------------------------
6.1 User
----------------------------------------------------------------------

Fields:

- id
- name
- email
- role
- active
- avatarUrl
- lastLoginAt

----------------------------------------------------------------------
6.2 Customer
----------------------------------------------------------------------

Fields:

- id
- customerCode
- legalName
- tradingName
- customerType
- taxIdentifier
- registrationNumber
- creditLimit
- paymentTermsDays
- currency
- status
- primaryContactId
- billingAddress
- shippingAddresses
- complianceStatus
- notes

Customer statuses:

- lead
- active
- credit_hold
- inactive

Create separate customer contacts where appropriate.

----------------------------------------------------------------------
6.3 Inquiry
----------------------------------------------------------------------

Fields:

- id
- inquiryNumber
- customerId
- transportMode
- direction
- origin
- destination
- cargoSummary
- requestedPickupDate
- requestedDeliveryDate
- specialInstructions
- assignedSalesUserId
- status

Statuses:

- new
- qualified
- quotation_in_progress
- quoted
- converted
- lost
- cancelled

----------------------------------------------------------------------
6.4 Quotation
----------------------------------------------------------------------

Fields:

- id
- quotationNumber
- revision
- customerId
- inquiryId
- transportMode
- direction
- origin
- destination
- cargo
- currency
- exchangeRate
- validFrom
- validUntil
- buyTotal
- sellTotal
- taxTotal
- marginAmount
- marginPercentage
- terms
- notes
- status
- approvalRequired
- approvedBy

Quotation line fields:

- id
- quotationId
- chargeCode
- description
- category
- unit
- quantity
- buyRate
- sellRate
- taxRate
- buyAmount
- sellAmount
- marginAmount

Quotation statuses:

- draft
- pricing_review
- approved
- sent
- accepted
- rejected
- expired
- revised
- converted
- cancelled

Rules:

- An accepted quotation may be converted into a booking.
- An expired quotation cannot be accepted.
- Revising a sent quotation creates a new revision.
- Margin below the configurable threshold requires pricing approval.
- Do not overwrite historical revisions.

----------------------------------------------------------------------
6.5 Booking
----------------------------------------------------------------------

Fields:

- id
- bookingNumber
- quotationId
- customerId
- customerReference
- shipperId
- consigneeId
- transportMode
- direction
- bookingDate
- requestedPickupDate
- requestedDeliveryDate
- status

Statuses:

- draft
- confirmed
- converted_to_shipment
- cancelled

----------------------------------------------------------------------
6.6 Shipment
----------------------------------------------------------------------

Fields:

- id
- shipmentNumber
- jobNumber
- referenceNumber
- bookingId
- quotationId
- customerId
- shipperId
- consigneeId
- transportMode
- direction
- shipmentType
- serviceLevel
- incoterm
- origin
- destination
- carrierId
- warehouseId
- flightNumber
- flightDate
- mawb
- hawb
- vesselName
- voyageNumber
- containerNumbers
- estimatedDepartureAt
- actualDepartureAt
- estimatedArrivalAt
- actualArrivalAt
- expectedDeliveryAt
- deliveredAt
- status
- priority
- priorityScore
- complianceStatus
- documentationStatus
- financialStatus
- assignedOperationsUserId
- SLA target
- delayMinutes
- notes

Transport modes:

- air
- sea
- road
- rail
- courier

Directions:

- import
- export
- domestic

Shipment statuses:

- draft
- created
- documents_pending
- documents_under_review
- compliance_review
- compliance_hold
- ready_for_carrier_booking
- carrier_booked
- pickup_scheduled
- picked_up
- warehouse_received
- export_customs
- customs_cleared
- departed
- in_transit
- arrived
- import_customs
- delivery_scheduled
- out_for_delivery
- delivered
- proof_of_delivery_received
- billing_pending
- financially_closed
- closed
- cancelled

Do not let pages assign arbitrary shipment statuses.

Implement a shipment state-machine service that validates every transition.

Each transition must:

- Verify the requested transition is allowed
- Update the shipment
- Append a shipment event
- Add an audit-log entry
- Queue the mutation for synchronization
- Generate relevant notifications
- Generate an incident when the transition fails under defined conditions

----------------------------------------------------------------------
6.7 Cargo
----------------------------------------------------------------------

Fields:

- id
- shipmentId
- commodityDescription
- hsCode
- pieces
- packageType
- grossWeightKg
- chargeableWeightKg
- volumetricWeightKg
- volumeCbm
- dimensions
- declaredValue
- currency
- dangerousGoods
- dangerousGoodsClass
- unNumber
- temperatureControlled
- minimumTemperature
- maximumTemperature
- stackable
- specialHandlingInstructions

Validation:

- Values cannot be negative.
- Chargeable weight is the greater of actual and volumetric weight where applicable.
- Dangerous goods require declaration documentation.
- Temperature-controlled cargo requires a temperature range.
- Flag unrealistic or inconsistent weight and dimension combinations.

----------------------------------------------------------------------
6.8 Carrier
----------------------------------------------------------------------

Fields:

- id
- carrierCode
- name
- carrierType
- serviceRegions
- contactDetails
- active
- reliabilityScore
- averageDelayMinutes
- costScore
- SLA performance

Carrier types:

- airline
- shipping_line
- road_carrier
- rail_operator
- courier

----------------------------------------------------------------------
6.9 Warehouse
----------------------------------------------------------------------

Fields:

- id
- warehouseCode
- name
- address
- airportOrPortCode
- capacity
- contactDetails
- active

----------------------------------------------------------------------
6.10 Shipment Event
----------------------------------------------------------------------

Shipment events are append-only.

Fields:

- id
- shipmentId
- eventType
- eventCode
- title
- description
- location
- occurredAt
- recordedAt
- source
- sourceReference
- latitude
- longitude
- visibility
- createdBy
- metadata

Sources:

- manual
- carrier_api
- gps
- system
- customer
- simulated

Visibility:

- internal
- customer
- both

----------------------------------------------------------------------
6.11 Document
----------------------------------------------------------------------

Fields:

- id
- shipmentId
- customerId
- documentType
- fileName
- mimeType
- size
- localBlob
- remoteUrl
- checksum
- uploadedAt
- uploadedBy
- status
- ocrStatus
- ocrConfidence
- extractedData
- validationErrors
- expiryDate
- verifiedAt
- verifiedBy
- rejectionReason
- syncStatus

Supported document types:

- commercial_invoice
- packing_list
- hawb
- mawb
- certificate_of_origin
- export_license
- dangerous_goods_declaration
- insurance_certificate
- delivery_order
- customs_declaration
- proof_of_delivery
- inspection_report
- other

Document statuses:

- uploaded
- processing
- review_required
- verified
- rejected
- expired

OCR statuses:

- not_started
- queued
- processing
- completed
- low_confidence
- failed

For the MVP:

- Accept PDF, PNG and JPEG files.
- Store document metadata and optional local Blob in IndexedDB.
- Generate previews safely.
- Simulate OCR using a deterministic service.
- Let the user edit extracted fields before verification.
- Mark simulated OCR results clearly.
- Do not claim that real OCR has been performed.

----------------------------------------------------------------------
6.12 Compliance Check
----------------------------------------------------------------------

Fields:

- id
- shipmentId
- checkType
- status
- severity
- ruleCode
- message
- checkedAt
- checkedBy
- resolvedAt
- resolvedBy
- resolution
- metadata

Statuses:

- pending
- passed
- warning
- failed
- overridden

Checks should include:

- Required invoice present
- Packing list present
- AWB documentation present
- HS code present
- Export license present when required
- Dangerous-goods declaration present
- Document expiry
- Cargo weight consistency
- Customer compliance status

Do not implement real sanctions screening.

Instead create a sanctions-screening adapter with a clearly labelled simulated result.

----------------------------------------------------------------------
6.13 Charge
----------------------------------------------------------------------

Fields:

- id
- shipmentId
- quotationId
- chargeCode
- description
- chargeType
- category
- vendorId
- quantity
- unit
- currency
- exchangeRate
- buyRate
- sellRate
- taxRate
- buyAmount
- sellAmount
- taxAmount
- marginAmount
- approved
- source

Charge types:

- buy
- sell
- both

Example categories:

- air_freight
- fuel_surcharge
- handling
- documentation
- security
- customs
- pickup
- delivery
- warehouse
- insurance
- other

Financial service must calculate:

- Total buy
- Total sell before tax
- Total tax
- Total customer invoice
- Gross margin
- Margin percentage

Use decimal-safe calculations.

Do not rely on normal floating-point arithmetic for monetary totals. Store monetary values as integer minor units or use a tested decimal utility.

----------------------------------------------------------------------
6.14 Invoice
----------------------------------------------------------------------

Fields:

- id
- invoiceNumber
- shipmentId
- customerId
- invoiceType
- currency
- subtotal
- taxTotal
- total
- paidAmount
- balanceAmount
- issueDate
- dueDate
- status
- lineItems
- notes

Invoice types:

- customer
- vendor
- credit_note

Statuses:

- draft
- approved
- issued
- partially_paid
- paid
- overdue
- disputed
- void

Rules:

- Detect duplicate invoice numbers.
- Issued invoices cannot be directly deleted.
- Payment application updates the invoice balance.
- Paid invoices cannot receive payments beyond their remaining balance.
- Overdue status is derived from due date and outstanding balance.

----------------------------------------------------------------------
6.15 Payment
----------------------------------------------------------------------

Fields:

- id
- paymentNumber
- invoiceId
- customerId
- vendorId
- paymentType
- amount
- currency
- paymentDate
- paymentMethod
- transactionReference
- status
- notes

Payment types:

- receivable
- payable
- refund

Statuses:

- pending
- completed
- failed
- reversed

----------------------------------------------------------------------
6.16 Notification
----------------------------------------------------------------------

Fields:

- id
- userId
- customerId
- shipmentId
- channel
- title
- message
- severity
- status
- createdAt
- readAt
- sentAt
- failureReason

Channels:

- in_app
- email_simulated
- sms_simulated
- push_simulated

Only in-app notifications must actually function in the MVP.

Other channels should be represented through an adapter and marked as simulated.

----------------------------------------------------------------------
6.17 Incident
----------------------------------------------------------------------

Fields:

- id
- incidentNumber
- shipmentId
- module
- errorCode
- title
- description
- priority
- status
- detectedAt
- acknowledgedAt
- assignedTo
- automaticActions
- escalationAt
- resolution
- resolvedAt
- resolvedBy
- closedAt
- metadata

Priorities:

P1 Critical:
- Customs hold
- Dangerous-goods violation
- Simulated sanctions match
- Major application outage

P2 High:
- Flight cancellation
- Shipment delay greater than 24 hours
- Missed customer SLA

P3 Medium:
- Missing invoice
- OCR failure
- Document mismatch

P4 Low:
- Dashboard issue
- Report-generation error

Statuses:

- open
- acknowledged
- investigating
- waiting_for_customer
- resolved
- closed

Display SLA targets:

- P1: immediate response, escalation every 15 minutes
- P2: response within 30 minutes, hourly escalation
- P3: response within 2 hours, escalation every 4 hours
- P4: response within 1 business day, daily escalation

For the local MVP, simulate escalation timers without attempting to send external communications.

----------------------------------------------------------------------
6.18 Audit Log
----------------------------------------------------------------------

Audit logs are append-only.

Fields:

- id
- entityType
- entityId
- action
- actorId
- occurredAt
- previousValues
- newValues
- reason
- source
- operationId

The user should be able to view the audit history on:

- Customers
- Quotations
- Shipments
- Documents
- Compliance checks
- Invoices
- Payments
- Incidents

----------------------------------------------------------------------
6.19 Sync Queue
----------------------------------------------------------------------

Fields:

- id
- operationId
- entityType
- entityId
- action
- payload
- baseVersion
- status
- attempts
- nextAttemptAt
- createdAt
- updatedAt
- lastError
- dependencyOperationIds

Statuses:

- pending
- processing
- completed
- failed
- conflict
- cancelled

======================================================================
7. OFFLINE-FIRST SYNCHRONIZATION
======================================================================

Implement a real local synchronization subsystem, even though the remote endpoint is simulated.

The application must:

- Create and edit records while offline
- Persist changes across browser restarts
- Queue mutations
- Show pending mutation count
- Retry failed operations
- Use exponential backoff
- Avoid duplicate application of the same operation
- Process dependent operations in order
- Expose sync history
- Allow manual retry
- Allow cancellation of safe pending operations
- Pause synchronization
- Resume synchronization
- Display last successful sync time
- Detect version conflicts
- Provide a conflict-resolution screen

Create these interfaces:

- LocalRepository
- SyncTransport
- SyncEngine
- ConflictResolver
- ConnectivityService

Create two SyncTransport implementations:

1. MockLoopbackTransport
   - Simulates a successful server
   - Stores server-like state separately
   - Supports deterministic delays and failures

2. DisabledTransport
   - Keeps operations queued
   - Used to demonstrate fully offline behaviour

Add a development sync simulator where the user can trigger:

- Offline mode
- Slow connection
- One failed request
- Repeated failures
- Version conflict
- Successful recovery

Conflict-resolution UI must show:

- Entity
- Local version
- Simulated remote version
- Differing fields
- Keep local
- Accept remote
- Merge selected fields
- Resolution audit record

Do not resolve financial or compliance conflicts silently.

======================================================================
8. APPLICATION SCREENS
======================================================================

Create a desktop layout with a collapsible left sidebar and a responsive mobile layout with bottom navigation.

Primary navigation:

- Dashboard
- Customers
- Inquiries
- Quotations
- Shipments
- Tracking
- Documents
- Compliance
- Finance
- Incidents
- Reports
- Notifications
- Sync Centre
- Settings

Mobile bottom navigation:

- Dashboard
- Shipments
- Tracking
- Documents
- More

The “More” screen should include:

- Invoices
- Payments
- Notifications
- Internal shipment notes/chat
- Sync status
- Settings

----------------------------------------------------------------------
8.1 Login
----------------------------------------------------------------------

Provide seeded demo accounts for each role.

The login page should:

- Display ASTRA branding
- Allow choosing a seeded account
- Remember the active demo session locally
- Explain that authentication is simulated for the MVP

----------------------------------------------------------------------
8.2 Dashboard
----------------------------------------------------------------------

Show:

- Active shipments
- Delivered shipments
- Delayed shipments
- Pending documentation
- Compliance percentage
- Revenue
- Cost
- Profit
- Margin percentage
- Customer SLA performance
- Carrier performance
- Average customs-clearance time
- Open P1/P2 incidents
- Pending synchronization operations

Add:

- Shipment status distribution
- Revenue versus cost
- Recent shipment activity
- Critical alerts
- Upcoming departures and arrivals
- Documentation exceptions

Charts must derive from local data, not hardcoded chart values.

----------------------------------------------------------------------
8.3 Customers
----------------------------------------------------------------------

Implement:

- Search
- Filters
- Sort
- Pagination or virtualization where useful
- Customer creation
- Customer edit
- Customer detail
- Contacts
- Addresses
- Credit details
- Shipment history
- Quotation history
- Invoice balance
- Audit history

----------------------------------------------------------------------
8.4 Quotations
----------------------------------------------------------------------

Implement:

- Quotation list
- Create quotation wizard
- Cargo input
- Origin and destination
- Charge-line editor
- Buy/sell calculations
- Margin warnings
- Validity dates
- Revision history
- Approval workflow
- Mark as sent
- Accept or reject
- Convert accepted quotation into booking

The quotation-to-booking conversion must be transactional.

----------------------------------------------------------------------
8.5 Shipments
----------------------------------------------------------------------

Shipment list columns:

- Shipment number
- Customer
- Mode
- Direction
- Origin
- Destination
- Carrier
- Current status
- Priority
- ETA
- Delay
- Documentation status
- Compliance status
- Sync status

Filters:

- Status
- Mode
- Import/export
- Customer
- Carrier
- Priority
- Delayed
- Documentation exception
- Compliance hold
- Date range

Shipment detail tabs:

1. Overview
2. Timeline
3. Cargo
4. Documents
5. Compliance
6. Carrier and routing
7. Charges
8. Invoices and payments
9. Incidents
10. Audit history
11. Internal notes

Display a prominent next-action panel.

Only show actions permitted for the shipment’s current state and active user role.

----------------------------------------------------------------------
8.6 Tracking
----------------------------------------------------------------------

Do not depend on a paid mapping API.

Create:

- Route summary
- Origin and destination
- Current location label
- Milestone timeline
- Estimated versus actual dates
- Delay status
- Last update source
- Last update time
- Tracking freshness indicator

Optionally include a lightweight static map placeholder or SVG route visualization.

Allow operations users to add a manual tracking event.

Simulate carrier updates for seeded shipments.

----------------------------------------------------------------------
8.7 Document Workbench
----------------------------------------------------------------------

Provide:

- Drag-and-drop upload
- Required-document checklist
- File preview
- OCR status
- Extracted fields
- Confidence score
- Validation issues
- Verify
- Reject
- Replace
- Download local file
- Mark missing
- Request document through simulated notification
- Filter by low confidence
- Filter by missing document
- Filter by shipment

Create a review queue for documents requiring human intervention.

----------------------------------------------------------------------
8.8 Compliance
----------------------------------------------------------------------

Provide:

- Compliance queue
- Failed checks
- Warning checks
- Shipment holds
- Required-document gaps
- Dangerous-goods cases
- Manual override with mandatory reason
- Release hold action
- Audit trail

A failed blocking compliance rule must prevent carrier booking or departure.

----------------------------------------------------------------------
8.9 Finance
----------------------------------------------------------------------

Provide:

- Charge editor
- Buy-versus-sell comparison
- Margin calculation
- Customer invoice list
- Vendor invoice list
- Receivables
- Payables
- Payment recording
- Outstanding balance
- Overdue invoice view
- Shipment profitability
- Customer profitability
- Carrier cost analysis

Prevent financial closure until:

- Required customer invoice is issued
- All mandatory charges are approved
- Shipment is delivered
- Proof of delivery exists
- Blocking financial inconsistencies are resolved

----------------------------------------------------------------------
8.10 Incidents and Alerts
----------------------------------------------------------------------

Provide:

- Priority queue
- SLA countdown
- Status filtering
- Assignment
- Acknowledge
- Add investigation notes
- Resolve
- Close
- Escalation history
- Link to shipment and source module

Generate incidents automatically for selected cases:

- Low-confidence OCR after retry
- Missing required document
- Compliance failure
- Carrier cancellation
- Shipment delayed by more than 24 hours
- Sync operation repeatedly failing
- Financial mismatch

Prevent duplicate open incidents for the same underlying condition.

----------------------------------------------------------------------
8.11 Reports
----------------------------------------------------------------------

Create local reports for:

- Shipment count by status
- Shipment count by transport mode
- On-time delivery rate
- Delayed shipments
- Documentation completeness
- Compliance pass rate
- Revenue
- Cost
- Gross profit
- Margin percentage
- Profitability by customer
- Profitability by shipment
- Carrier performance
- Customs-clearance duration
- Open incidents by priority

Allow exporting appropriate reports to CSV.

----------------------------------------------------------------------
8.12 Customer Portal
----------------------------------------------------------------------

Provide a role-restricted customer view.

Customers can see only their own:

- Shipments
- Tracking timeline
- Customer-visible events
- Approved documents
- Invoices
- Payment status
- Notifications

Customers must not see:

- Buy rates
- Internal margins
- Vendor invoices
- Internal notes
- Internal incidents
- Other customers’ information

======================================================================
9. AUTOMATION AND AI SIMULATION
======================================================================

Create adapter interfaces for:

- OCR provider
- Delay-prediction provider
- Priority-scoring provider
- Carrier-tracking provider
- Notification provider
- Sanctions/compliance provider

Provide deterministic local implementations.

The AI simulation must behave consistently and be testable.

OCR simulation:

- Generate extracted fields based on file metadata and fixture data
- Produce confidence scores
- Route low-confidence results to review
- Retry a maximum of two times
- Generate an incident when confidence remains below threshold

Priority scoring should consider:

- Current delay
- Customer SLA
- Shipment value
- Compliance hold
- Missing documents
- Dangerous goods
- Time until scheduled departure

Delay prediction should:

- Use deterministic rules
- Return predicted ETA
- Explain contributing factors
- Fall back to scheduled ETA when data is insufficient

Every AI-generated result must include:

- provider
- model or rule version
- generatedAt
- confidence
- explanation
- requiresHumanReview

Do not hide uncertainty.

======================================================================
10. TRANSACTIONS AND CONSISTENCY
======================================================================

Use Dexie transactions for multi-entity operations such as:

- Accept quotation and create booking
- Convert booking into shipment
- Transition shipment and append event
- Verify document and update documentation status
- Apply payment and update invoice
- Resolve conflict and write audit log
- Close shipment and write financial status

Operations must either complete fully or leave the database unchanged.

======================================================================
11. SEED DATA
======================================================================

Create realistic seed data including:

- 10 users across different roles
- 8 customers
- 8 carriers
- 4 warehouses
- 15 inquiries
- 12 quotations in varied statuses
- 3 quotation revisions
- 20 shipments across lifecycle stages
- Import and export examples
- Mostly air-freight shipments
- At least one sea shipment
- At least one road shipment
- Cargo with normal goods
- Dangerous goods example
- Temperature-controlled example
- 50 or more shipment events
- Verified documents
- Missing documents
- Low-confidence OCR documents
- Compliance warnings
- Compliance hold
- Customer and vendor invoices
- Partial and completed payments
- Overdue invoice
- P1, P2, P3 and P4 incidents
- Pending sync operations
- Failed sync operation
- Version conflict example

Include this representative shipment:

- Shipment number: EX/BLR/24/000123
- Shipment type: Air Export
- Status: In Transit
- Origin: Bengaluru, BLR
- Destination: New York, JFK
- Carrier: Qatar Airways, QR
- Flight: QR1145
- MAWB: 157-12345678
- Chargeable weight: 1,350 kg
- Gross weight: 1,250 kg
- Pieces: 120
- Shipper: ABC Exports Pvt Ltd
- Consignee: XYZ Imports LLC

Seed generation must be idempotent.

Provide a “Reset Demo Data” action with confirmation.

======================================================================
12. USER EXPERIENCE
======================================================================

The interface should feel like professional freight-operations software.

Visual direction:

- Clean and information-dense
- Strong hierarchy
- Neutral background
- Clear operational status colours
- High contrast
- Compact but readable tables
- Responsive
- Keyboard accessible
- Touch friendly on mobile

Status colours should be consistent across the system.

Never communicate status using colour alone.

Use:

- Text labels
- Icons
- Badges
- Accessible descriptions

Provide:

- Loading states
- Empty states
- Error states
- Offline banners
- Sync indicators
- Confirmation dialogs
- Destructive-action warnings
- Toast notifications
- Field-level validation
- Unsaved-change protection

Tables should support horizontal overflow on smaller screens without breaking the layout.

Avoid decorative gradients, excessive animation and generic startup-style landing pages.

This is an operational ERP, not a marketing website.

======================================================================
13. PWA REQUIREMENTS
======================================================================

Configure:

- Web app manifest
- App name and short name
- Installable icons
- Theme colour
- Standalone display mode
- Service worker
- Offline application-shell caching
- Offline fallback
- Safe update notification
- Install prompt handling

The application must:

- Launch when offline after the first visit
- Retain local data after refresh
- Retain the active session
- Display network status
- Display pending sync count
- Recover after connectivity returns

Do not cache sensitive or mutable API responses blindly.

======================================================================
14. ERROR HANDLING
======================================================================

Implement an application error boundary.

Create typed domain errors for:

- Validation failure
- Invalid state transition
- Missing entity
- Permission failure
- Duplicate record
- Sync failure
- Version conflict
- Financial inconsistency
- Compliance block
- Storage failure

Do not swallow exceptions.

Present actionable error messages to the user.

Log technical context locally without exposing secrets.

======================================================================
15. SECURITY AND PRIVACY
======================================================================

Even though this is a frontend-only MVP:

- Validate all form input with Zod
- Escape rendered user content
- Avoid unsafe HTML
- Restrict file types
- Restrict file size
- Do not store credentials
- Do not include API secrets
- Do not log document contents unnecessarily
- Prevent customer-role data leakage
- Add permission checks at repository/service boundaries, not only in navigation
- Mark demo authentication clearly
- Add a production-security section to the README

======================================================================
16. TESTING
======================================================================

Write meaningful tests.

Unit tests:

- Quotation totals
- Margin calculation
- Tax calculation
- Chargeable-weight calculation
- Shipment transition validation
- Quotation transition validation
- Compliance rules
- Required-document logic
- Priority scoring
- Delay prediction
- Incident deduplication
- Invoice balance calculation
- Payment over-allocation prevention
- Sync backoff
- Conflict detection

Integration tests:

- Create customer
- Create inquiry
- Create quotation
- Accept quotation
- Convert quotation into booking
- Convert booking into shipment
- Upload document
- Verify document
- Pass compliance
- Book carrier
- Advance shipment through delivery
- Create invoice
- Record payment
- Financially close shipment
- Verify audit records
- Verify queued sync operations

Persistence tests:

- Data survives database recreation
- Pending operations survive reload
- Seed data does not duplicate
- Reset demo data works
- Blob metadata persists

UI smoke tests:

- Login works
- Dashboard loads
- Shipment list renders
- Shipment detail renders
- Offline banner appears
- Sync centre displays pending work
- Customer user cannot see internal financial data

Aim for high-value behavioural coverage rather than superficial snapshot tests.

======================================================================
17. DOCUMENTATION
======================================================================

Create:

- README.md
- docs/implementation-plan.md
- docs/domain-model.md
- docs/offline-sync.md
- docs/state-machines.md
- docs/security-notes.md
- docs/future-backend.md

README must include:

- Product overview
- Screenshots section placeholder
- Technology stack
- Installation
- Development commands
- Test commands
- Production build
- PWA testing
- Demo accounts
- Seed data
- Offline behaviour
- Sync simulator
- Project structure
- Architectural decisions
- Known limitations
- Production-hardening requirements

Include Mermaid diagrams for:

- High-level architecture
- Core entity relationships
- Quotation workflow
- Shipment lifecycle
- Offline sync lifecycle

======================================================================
18. REQUIRED NPM SCRIPTS
======================================================================

Add:

- npm run dev
- npm run build
- npm run preview
- npm run typecheck
- npm run lint
- npm run test
- npm run test:watch
- npm run test:coverage

All scripts must work.

Do not leave a script in package.json unless its underlying configuration exists.

======================================================================
19. IMPLEMENTATION ORDER
======================================================================

Implement in these phases:

Phase 1: Foundation
- Vite React TypeScript setup
- Linting
- Routing
- Design system
- PWA setup
- Application shell
- Demo authentication

Phase 2: Persistence
- Dexie database
- Entity types
- Repositories
- Seed service
- Audit service

Phase 3: Customers and Quotations
- Customer management
- Inquiries
- Quotation builder
- Financial calculations
- Quotation workflow

Phase 4: Shipment Operations
- Booking conversion
- Shipment creation
- State machine
- Cargo
- Timeline
- Tracking

Phase 5: Documents and Compliance
- Document upload
- OCR simulation
- Review queue
- Required-document rules
- Compliance checks
- Shipment holds

Phase 6: Finance
- Charges
- Customer invoices
- Vendor invoices
- Payments
- Profitability
- Financial closure

Phase 7: Exceptions and Sync
- Incidents
- Notifications
- Sync queue
- Retry logic
- Conflict resolution
- Connectivity simulator

Phase 8: Dashboards and Customer Portal
- KPI cards
- Charts
- Reports
- CSV exports
- Customer-restricted views

Phase 9: Quality
- Tests
- Accessibility pass
- Performance review
- Documentation
- Production build verification

Do not start a later phase while the current phase has TypeScript or build failures.

======================================================================
20. ACCEPTANCE CRITERIA
======================================================================

The implementation is complete only when:

1. The project installs with `npm install`.
2. `npm run dev` launches the application.
3. `npm run build` succeeds.
4. `npm run typecheck` succeeds.
5. `npm run test` succeeds.
6. The application is installable as a PWA.
7. The application loads offline after its initial visit.
8. Users can create data while offline.
9. Offline mutations appear in the sync queue.
10. Queued mutations can be retried.
11. A simulated conflict can be resolved through the UI.
12. Seeded users can log in.
13. Permissions change based on the active role.
14. Customers can be created and edited.
15. Quotations calculate totals and margins correctly.
16. Accepted quotations can become bookings.
17. Bookings can become shipments.
18. Shipment state transitions are validated.
19. Shipment events are append-only.
20. Documents can be uploaded and reviewed.
21. Low-confidence OCR enters the review queue.
22. Compliance failures can block progression.
23. Charges generate correct profitability figures.
24. Invoices and payments update balances correctly.
25. Delivered shipments can reach financial closure.
26. Incidents are generated for important failures.
27. Dashboard values derive from persisted data.
28. Customer users cannot see internal rates or margins.
29. Important changes appear in audit history.
30. The README accurately explains limitations and setup.

======================================================================
21. FINAL VERIFICATION
======================================================================

Before completing the work:

1. Run installation from a clean dependency state.
2. Run the type checker.
3. Run linting.
4. Run all tests.
5. Run the production build.
6. Inspect the browser console for errors.
7. Test offline mode.
8. Test refresh while offline.
9. Test adding data offline.
10. Test recovery after returning online.
11. Test a version conflict.
12. Test each seeded user role.
13. Review mobile layouts at common viewport sizes.
14. Verify no secrets or credentials are committed.
15. Verify the Git working tree is clean.

Finish by producing:

- A concise implementation summary
- A list of completed modules
- Commands used to verify the project
- Test results
- Known limitations
- Recommended next backend milestone

Do not report a feature as completed unless it is implemented and verified.