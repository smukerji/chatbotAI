# Multi-Agent System (MAS) Architecture
## Clinic Management Platform — Client Presentation

---

## 1. System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          EXTERNAL INTERFACES                                │
│                                                                             │
│   Patient / Web App      Clinic Staff Portal      Admin Dashboard          │
│        │                        │                        │                 │
└────────┼────────────────────────┼────────────────────────┼─────────────────┘
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ORCHESTRATOR (Master Agent)                          │
│                                                                             │
│   • Intent Classification       • Session Memory (short-term)              │
│   • Agent Routing               • Conversation History                     │
│   • Context Injection           • x-clinic-id Header Management            │
│   • Response Aggregation        • Auth Token Forwarding                    │
└──────────────┬──────────────────────────────────────────────────────────────┘
               │
    ┌──────────┼──────────────────────────────────────┐
    │          │                │                     │
    ▼          ▼                ▼                     ▼
┌────────┐ ┌────────┐    ┌──────────┐         ┌─────────────┐
│Identity│ │Catalog │    │ Booking  │         │  Clinic Ops │
│ Agent  │ │ Agent  │    │  Agent   │         │    Agent    │
└────────┘ └────────┘    └──────────┘         └─────────────┘
```

---

## 2. Agent Breakdown

### 2.1 Orchestrator — Master Agent

**Role:** Central controller. Receives all user messages, classifies intent, routes to the right specialist agent, injects shared memory/context, and assembles the final response.

```
┌─────────────────────────────────────────────────────────┐
│                    ORCHESTRATOR                         │
│                                                         │
│  ┌──────────────────┐    ┌──────────────────────────┐  │
│  │  Intent Router   │    │    Session Memory Store  │  │
│  │                  │    │                          │  │
│  │  - Identity ops  │    │  • userId                │  │
│  │  - Catalog query │    │  • clinicId (x-clinic-id)│  │
│  │  - Booking mgmt  │    │  • role / permissions    │  │
│  │  - Clinic ops    │    │  • conversation turns    │  │
│  │  - Multi-step    │    │  • last booking ref      │  │
│  └──────────────────┘    └──────────────────────────┘  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │              Context Injector                    │  │
│  │  Attaches: auth token + x-clinic-id to all calls │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

**Memory layers:**
- Short-term: current conversation session (in-memory / Redis TTL)
- Mid-term: recent bookings, last-used clinic, preferred filters (Redis persistent)
- Long-term: user preferences, frequent concerns, saved packages (DB / vector store)

---

### 2.2 Identity Agent

**Role:** Handles all authentication, authorization, and clinic context resolution before any downstream call.

```
┌─────────────────────────────────────────────────────────┐
│                   IDENTITY AGENT                        │
│                                                         │
│  MCP Tools Used:                                        │
│  ├── get_authenticated_user_profile                     │
│  └── list_accessible_clinics                            │
│                                                         │
│  Responsibilities:                                      │
│  • Verify user identity on session start                │
│  • Resolve effective x-clinic-id from headers          │
│  • Enumerate accessible clinics + roles                 │
│  • Populate Orchestrator session memory                 │
│  • Gate access before any clinic-scoped tool call       │
│                                                         │
│  Memory Written:                                        │
│  • userId, email, status, confirmation flags            │
│  • clinicId → role map                                  │
│  • active clinicId (x-clinic-id)                        │
│  • contactFields (if requested)                         │
└─────────────────────────────────────────────────────────┘
```

**Decision flow:**
```
User message arrives
       │
       ▼
Identity Agent checks session memory
       │
  [Has identity?] ──YES──► proceed to routing
       │
      NO
       │
       ▼
get_authenticated_user_profile
       │
       ▼
list_accessible_clinics
       │
       ▼
Write to session memory → return to Orchestrator
```

---

### 2.3 Catalog Agent

**Role:** Answers all questions about treatments, concerns, solutions, products, and packages. Read-only. Safe to call without ABAC restrictions.

```
┌─────────────────────────────────────────────────────────┐
│                    CATALOG AGENT                        │
│                                                         │
│  MCP Tools Used:                                        │
│  ├── get_concerns          ├── get_solutions            │
│  ├── get_concern_detail    ├── get_solution_detail      │
│  ├── get_products          ├── get_packages             │
│  ├── get_product_detail    └── get_package_detail       │
│                                                         │
│  Sub-agents / Flows:                                    │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Concern Navigator                              │   │
│  │  concern list → concern detail → solutions      │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Treatment Recommender                          │   │
│  │  concern → solution → product → package         │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Package Inspector                              │   │
│  │  package detail → pricing → products inside     │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Memory Written:                                        │
│  • Last browsed concern / solution / product            │
│  • Recommended packages for current session             │
└─────────────────────────────────────────────────────────┘
```

**Call chain example (Treatment Recommendation):**
```
"What treatments do you have for acne?"
        │
        ▼
get_concerns → find "Acne" concern
        │
        ▼
get_concern_detail(concernId) → get linked solutionIds
        │
        ▼
get_solution_detail(solutionId) → get linked productIds
        │
        ▼
get_product_detail(productId) → get linked packageIds
        │
        ▼
get_package_detail(packageId) → return pricing + description
```

---

### 2.4 Booking Agent

**Role:** Full lifecycle management of appointments. Clinic-scoped. All calls require `x-clinic-id`. Enforces ABAC. Contains the only mutating tools in the system.

```
┌─────────────────────────────────────────────────────────┐
│                    BOOKING AGENT                        │
│                                                         │
│  MCP Tools Used:                                        │
│  ├── list_bookings          [READ]                      │
│  ├── get_booking_detail     [READ]                      │
│  ├── create_booking         [MUTATE ⚠️]                 │
│  ├── update_booking         [MUTATE ⚠️]                 │
│  └── delete_booking         [MUTATE ⚠️ IRREVERSIBLE]    │
│                                                         │
│  Sub-flows:                                             │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Booking Query Flow                              │  │
│  │  list_bookings(range) → get_booking_detail(id)   │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Booking Creation Flow                           │  │
│  │  1. Verify identity (Identity Agent)             │  │
│  │  2. Resolve slot + doctor (Clinic Ops Agent)     │  │
│  │  3. Confirm package/product (Catalog Agent)      │  │
│  │  4. create_booking(all required params)          │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Reschedule Flow                                 │  │
│  │  get_booking_detail → update_booking             │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Cancellation Flow                               │  │
│  │  get_booking_detail → update_booking(cancel)     │  │
│  │  [delete_booking only on explicit hard delete]   │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  Memory Written:                                        │
│  • Last bookingId created / updated                     │
│  • Pending appointment dates                            │
│  • bookingStatusRefId history                           │
│  • Conversation log payload per booking                 │
└─────────────────────────────────────────────────────────┘
```

**Guard rails on mutating ops:**
```
create / update / delete requested
        │
        ▼
  [Identity confirmed?] ──NO──► reject, re-auth
        │
       YES
        │
        ▼
  [ABAC role allows?]  ──NO──► return 403 message
        │
       YES
        │
        ▼
  [delete_booking?]  ──YES──► explicit confirmation step
        │                      (human-in-the-loop gate)
       NO
        │
        ▼
   Execute tool call
```

---

### 2.5 Clinic Ops Agent

**Role:** Manages clinic registry, staff/doctor roster, slot availability, and clinic configuration. Supports the Booking Agent with pre-booking checks.

```
┌─────────────────────────────────────────────────────────┐
│                  CLINIC OPS AGENT                       │
│                                                         │
│  MCP Tools Used:                                        │
│  ├── get_clinics                                        │
│  ├── get_clinic_detail                                  │
│  └── list_clinic_related_users                          │
│                                                         │
│  Responsibilities:                                      │
│  • Fetch all clinic records + metadata                  │
│  • Resolve clinicCalendarSlotIds for bookings           │
│  • Lookup doctors, staff, patients (ABAC-gated)         │
│  • Provide clinic publish status for catalog display    │
│  • Support multi-clinic admin workflows                 │
│                                                         │
│  Sub-flows:                                             │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Roster Lookup                                   │  │
│  │  list_clinic_related_users → filter by role      │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Slot Resolution (for Booking Agent)             │  │
│  │  get_clinic_detail → extract calendar slots      │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  Memory Written:                                        │
│  • Available doctors list (for current session)         │
│  • Clinic concern/treatment mappings                    │
│  • Publish status per clinic                            │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Memory Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          MEMORY LAYERS                                      │
│                                                                             │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────┐ │
│  │   SHORT-TERM         │  │     MID-TERM          │  │   LONG-TERM      │ │
│  │   (In-process / TTL) │  │   (Redis persistent)  │  │  (DB + Vector)   │ │
│  │                      │  │                       │  │                  │ │
│  │ • Current session    │  │ • Last 10 bookings    │  │ • User prefs     │ │
│  │ • Auth token         │  │ • Active clinicId     │  │ • Frequent       │ │
│  │ • x-clinic-id        │  │ • Recent concerns     │  │   concerns       │ │
│  │ • Conversation turns │  │ • Browsed packages    │  │ • Saved packages │ │
│  │ • Last tool result   │  │ • Pending bookingIds  │  │ • Doctor prefs   │ │
│  │                      │  │ • Role map            │  │ • Locale prefs   │ │
│  │  TTL: session end    │  │  TTL: 24h             │  │  TTL: permanent  │ │
│  └──────────────────────┘  └──────────────────────┘  └──────────────────┘ │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    SHARED CONTEXT STORE                             │   │
│  │                                                                     │   │
│  │  Key              │ Set by           │ Read by                      │   │
│  │  ─────────────────┼──────────────────┼──────────────────────────   │   │
│  │  userId           │ Identity Agent   │ All agents                  │   │
│  │  x-clinic-id      │ Identity Agent   │ Booking, Clinic Ops         │   │
│  │  role             │ Identity Agent   │ Booking Agent (ABAC)        │   │
│  │  lastConcernId    │ Catalog Agent    │ Booking Agent               │   │
│  │  lastProductId    │ Catalog Agent    │ Booking Agent               │   │
│  │  lastPackageId    │ Catalog Agent    │ Booking Agent               │   │
│  │  availableDoctors │ Clinic Ops Agent │ Booking Agent               │   │
│  │  slotIds          │ Clinic Ops Agent │ Booking Agent               │   │
│  │  lastBookingId    │ Booking Agent    │ Orchestrator                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Full System Architecture (End-to-End)

```
                        ┌─────────────────────────────────────┐
                        │         CLIENT INTERFACES           │
                        │                                     │
                        │  Chat UI  │  Web App  │  Mobile     │
                        └─────────────────┬───────────────────┘
                                          │ HTTPS / WebSocket
                        ┌─────────────────▼───────────────────┐
                        │            API GATEWAY              │
                        │  • Auth middleware (JWT)             │
                        │  • x-clinic-id header injection      │
                        │  • Rate limiting                     │
                        │  • Request logging                   │
                        └─────────────────┬───────────────────┘
                                          │
                        ┌─────────────────▼───────────────────┐
                        │         ORCHESTRATOR AGENT          │
                        │                                     │
                        │  ┌────────────┐ ┌───────────────┐  │
                        │  │  Intent    │ │    Session     │  │
                        │  │ Classifier │ │    Memory      │  │
                        │  └────────────┘ └───────────────┘  │
                        │  ┌────────────┐ ┌───────────────┐  │
                        │  │  Router    │ │    Context     │  │
                        │  │            │ │   Injector     │  │
                        │  └────────────┘ └───────────────┘  │
                        └──┬────────┬──────────┬─────────┬───┘
                           │        │          │         │
               ┌───────────▼─┐  ┌───▼──────┐  │  ┌──────▼──────┐
               │  IDENTITY   │  │ CATALOG  │  │  │  CLINIC OPS │
               │   AGENT     │  │  AGENT   │  │  │    AGENT    │
               │             │  │          │  │  │             │
               │ get_auth_   │  │get_conce-│  │  │ get_clinics │
               │ user_profile│  │rns       │  │  │ get_clinic_ │
               │             │  │get_solut-│  │  │ detail      │
               │ list_access-│  │ions      │  │  │ list_clinic_│
               │ ible_clinics│  │get_produ-│  │  │ related_    │
               │             │  │cts       │  │  │ users       │
               └──────┬──────┘  │get_packa-│  │  └──────┬──────┘
                      │         │ges + all │  │         │
                      │         │ *_detail │  │         │
                      │         └────┬─────┘  │         │
                      │              │        │         │
                      │              │  ┌─────▼──────┐  │
                      │              │  │  BOOKING   │  │
                      │              │  │   AGENT    │  │
                      │              │  │            │  │
                      │              │  │list_booking│  │
                      │              │  │get_booking_│  │
                      │              │  │detail      │  │
                      │              │  │create_book-│  │
                      │              │  │ing ⚠️       │  │
                      │              │  │update_book-│  │
                      │              │  │ing ⚠️       │  │
                      │              │  │delete_book-│  │
                      │              │  │ing ⚠️🚫     │  │
                      │              │  └──────┬─────┘  │
                      │              │         │        │
                      └──────────────┼─────────┘        │
                                     │                  │
                       ┌─────────────▼──────────────────▼────┐
                       │           MCP TOOL LAYER             │
                       │      (18 tools via JSON-RPC)         │
                       │  Auth: noauth scheme + ABAC runtime  │
                       └──────────────────┬───────────────────┘
                                          │
                       ┌──────────────────▼───────────────────┐
                       │          BACKEND SERVICES            │
                       │                                      │
                       │  Clinic DB  │  Booking DB  │  CDN    │
                       └──────────────────────────────────────┘
```

---

## 5. Agent Interaction Sequences

### 5.1 Patient Books an Appointment

```
Patient: "Book a facial treatment for me next Monday at 10am"
   │
   ▼
Orchestrator → classify: BOOKING_CREATE
   │
   ├──► Identity Agent
   │        get_authenticated_user_profile
   │        list_accessible_clinics
   │        → writes userId, clinicId, role to memory
   │
   ├──► Catalog Agent
   │        get_concerns → find "facial" concern
   │        get_solutions → linked solutions
   │        get_products → linked product
   │        → writes productId to shared context
   │
   ├──► Clinic Ops Agent
   │        get_clinic_detail(clinicId)
   │        → extract available slots for Monday 10am
   │        list_clinic_related_users → get available doctors
   │        → writes slotIds, doctorId to shared context
   │
   └──► Booking Agent
            create_booking({
              patientName, appointmentDate: "next Monday",
              clinicCalendarSlotIds: [from shared context],
              productId: [from shared context],
              clinicUserId: [doctor from shared context],
              bookingChannelSourceRefId, bookingStatusRefId, ...
            })
            → writes bookingId to memory
            → returns confirmation to Orchestrator
   │
   ▼
Orchestrator assembles response → "Your booking is confirmed for Monday..."
```

### 5.2 Staff Views Today's Schedule

```
Staff: "Show me all bookings for today"
   │
   ▼
Orchestrator → classify: BOOKING_LIST
   │
   ├──► Identity Agent (from memory if already authed)
   │
   └──► Booking Agent
            list_bookings({ startDate: today, endDate: today })
            → for each booking of interest:
            get_booking_detail(bookingId)
   │
   ▼
Orchestrator formats schedule → returns to staff
```

### 5.3 Patient Asks About Treatment Options

```
Patient: "What packages do you have for skin care?"
   │
   ▼
Orchestrator → classify: CATALOG_QUERY
   │
   └──► Catalog Agent
            get_concerns → filter skin-related
            get_concern_detail(concernId)
            get_solutions → linked solutions
            get_packages → filter relevant
            get_package_detail(packageId) → pricing + products
   │
   ▼
Orchestrator returns treatment options with pricing
```

---

## 6. Technology Stack Recommendation

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         RECOMMENDED STACK                                   │
│                                                                             │
│  Orchestration Framework  │  LangGraph / CrewAI / AutoGen                 │
│  LLM Backend              │  GPT-4o / Claude 3.5 Sonnet                   │
│  Memory - Short Term      │  In-process (LangChain ConversationBuffer)     │
│  Memory - Mid Term        │  Redis (with TTL, 24h)                         │
│  Memory - Long Term       │  PostgreSQL + pgvector (semantic search)       │
│  MCP Transport            │  JSON-RPC over HTTP                            │
│  API Gateway              │  Next.js API Routes / FastAPI                  │
│  Auth                     │  JWT + x-clinic-id header injection            │
│  Hosting                  │  Vercel (frontend) + AWS/GCP (agents)          │
│  Observability            │  LangSmith / Langfuse (trace all agent calls)  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Security & Access Control Model

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      SECURITY LAYERS                                        │
│                                                                             │
│  Layer 1 — Transport                                                        │
│  • HTTPS only, JWT in Authorization header                                  │
│                                                                             │
│  Layer 2 — Identity Agent Gate                                              │
│  • Every session starts with get_authenticated_user_profile                 │
│  • No downstream tool calls without confirmed identity                      │
│                                                                             │
│  Layer 3 — Clinic Scoping                                                   │
│  • x-clinic-id injected by Context Injector from verified session           │
│  • Booking + Clinic Ops agents refuse calls without valid clinicId          │
│                                                                             │
│  Layer 4 — ABAC Runtime                                                     │
│  • Backend enforces attribute-based access on all clinic-scoped tools       │
│  • list_clinic_related_users, get_booking_detail, all booking mutations     │
│                                                                             │
│  Layer 5 — Mutating Op Guards                                               │
│  • create/update/delete gated behind role check in Booking Agent            │
│  • delete_booking requires explicit human confirmation step                 │
│                                                                             │
│  Roles → Permitted Operations:                                              │
│  ┌──────────────┬─────────────────────────────────────────────────────┐    │
│  │ Role         │ Permitted                                           │    │
│  ├──────────────┼─────────────────────────────────────────────────────┤    │
│  │ patient      │ catalog reads, create own booking, view own booking  │    │
│  │ staff        │ all reads, create/update bookings, list roster       │    │
│  │ doctor       │ all reads, view own schedule, update own bookings    │    │
│  │ admin        │ all tools including delete_booking, get_clinic_detail│    │
│  └──────────────┴─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Build Roadmap

```
Phase 1 — Foundation (Week 1–2)
  ✓ Set up MCP tool layer (18 tools connected)
  ✓ Identity Agent with session memory
  ✓ Basic Orchestrator with intent classification
  ✓ Redis for mid-term memory

Phase 2 — Catalog + Read Flows (Week 3–4)
  ✓ Catalog Agent (all 8 treatment tools)
  ✓ Clinic Ops Agent (clinics + roster)
  ✓ Booking query flows (list + detail)
  ✓ Shared context store

Phase 3 — Booking Mutations (Week 5–6)
  ✓ Booking Agent with create/update flows
  ✓ Cross-agent create_booking sequence
  ✓ Human-in-the-loop gate for delete_booking
  ✓ ABAC role enforcement in Booking Agent

Phase 4 — Memory & Observability (Week 7–8)
  ✓ Long-term memory (pgvector)
  ✓ Conversation log persistence (bookingConversationLog)
  ✓ LangSmith / Langfuse tracing
  ✓ Full end-to-end test scenarios

Phase 5 — Production Hardening (Week 9–10)
  ✓ Rate limiting, error handling, retries
  ✓ Multi-locale support (locale param on list_bookings)
  ✓ Performance testing
  ✓ Client UAT + go-live
```

---

*Prepared for client presentation. Tool source: MCP tools/list (18 tools). Architecture version 1.0.*
