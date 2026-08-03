# WhatsApp QR / Personal Integration

**Torri AI — Technical Overview**  
*Last updated: June 2026*

---

## What It Does

The WhatsApp QR integration lets any Torri AI user link their personal or business WhatsApp number to their chatbot by scanning a QR code — exactly like connecting WhatsApp Web. Once linked, every incoming message to that number is automatically answered by the chatbot's AI agent. No Facebook Developer account, no Business verification, and no Twilio subscription required.

---

## How It Differs from the Existing WhatsApp Integration

| | WhatsApp (Meta Business API) | WhatsApp (QR / Personal) |
|---|---|---|
| Setup | Facebook Developer app + Business verification | Scan a QR code |
| Account type | Verified Business number only | Any personal or business number |
| Requires 3rd-party | Twilio / Meta Cloud API | None |
| Time to connect | Days (approval process) | ~30 seconds |
| Multi-device | Yes | Yes (WhatsApp Linked Devices) |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    USER'S BROWSER                           │
│                                                             │
│   Torri AI Dashboard  (Next.js — Vercel)                   │
│   ┌──────────────────────────────┐                         │
│   │  WhatsappQRModal.tsx         │                         │
│   │  • POST  /session/api  →  start session                │
│   │  • GET   /session/api  →  poll status (every 2.5s)     │
│   │  • DELETE /session/api →  disconnect                   │
│   └──────────────┬───────────────┘                         │
└──────────────────┼──────────────────────────────────────────┘
                   │  HTTPS  (x-wa-secret header)
                   ▼
┌─────────────────────────────────────────────────────────────┐
│          Next.js API Proxy  (Vercel serverless)             │
│                                                             │
│   /chatbot/dashboard/whatsapp-qr/session/api/route.ts       │
│   • Validates chatbot ownership (MongoDB lookup)            │
│   • Forwards request to WhatsApp server with shared secret  │
└──────────────────┬──────────────────────────────────────────┘
                   │  HTTP  (internal, x-wa-secret)
                   ▼
┌─────────────────────────────────────────────────────────────┐
│          whatsapp-server.js  (GCP — Node.js process)        │
│                                                             │
│   Express REST API                                          │
│   ┌────────────────────────────────────────────────────┐   │
│   │  POST   /wa-qr/start/:chatbotId                    │   │
│   │  GET    /wa-qr/status/:chatbotId                   │   │
│   │  DELETE /wa-qr/disconnect/:chatbotId               │   │
│   │  GET    /health                                    │   │
│   └────────────────────────────────────────────────────┘   │
│                                                             │
│   In-memory session registry  (Map: chatbotId → session)   │
│   ┌────────────────────────────────────────────────────┐   │
│   │  Baileys WebSocket  (one per connected chatbot)    │   │
│   │  • Generates QR → PNG data URL via qrcode          │   │
│   │  • Listens for messages.upsert events              │   │
│   │  • Auto-reconnects on transient disconnects (5s)   │   │
│   └────────────────────────────────────────────────────┘   │
└──────────────────┬─────────────────────┬───────────────────┘
                   │                     │
          WebSocket (WSS)         HTTP / HTTPS
                   │                     │
                   ▼                     ▼
┌─────────────────────────┐   ┌────────────────────────────┐
│   WhatsApp Servers       │   │   MongoDB Atlas            │
│   (Meta infrastructure)  │   │                            │
│                          │   │  whatsapp_auth             │
│   • QR handshake         │   │    Baileys session creds   │
│   • Message delivery     │   │    (one doc per chatbot)   │
│   • Presence / receipts  │   │                            │
└─────────────────────────┘   │  whatsapp_qr_sessions      │
                               │    Status, phone number,   │
                               │    QR URL, timestamps      │
                               │                            │
                               │  user-chatbots             │
                               │    Ownership lookup        │
                               └──────────────┬─────────────┘
                                              │
                                              ▼
                               ┌──────────────────────────┐
                               │   AI Pipeline             │
                               │                           │
                               │  1. Pinecone vector DB    │
                               │     (similarity search)   │
                               │  2. OpenAI GPT-4o         │
                               │     (answer generation)   │
                               └──────────────────────────┘
```

---

## Connection Flow (Step by Step)

### 1 — User Opens the Modal

The user clicks **Connect** on the *WhatsApp (QR / Personal)* card in the Integrations tab. The `WhatsappQRModal` component opens and immediately fires a `POST /session/api`.

### 2 — Session Start (fire-and-return)

The Next.js proxy validates chatbot ownership against MongoDB, then forwards the request to the GCP server. The server calls `startSession(chatbotId, userId)` **asynchronously** and returns `{ status: "starting" }` immediately — no Vercel timeout risk.

### 3 — QR Generation

Baileys opens a WebSocket to WhatsApp's servers. WhatsApp sends a QR string. The server converts it to a `data:image/png;base64,…` URL using the `qrcode` package and stores it in the `whatsapp_qr_sessions` collection.

### 4 — Frontend Polling

The modal polls `GET /session/api?chatbotId=…&userId=…` every **2.5 seconds**. As soon as the status is `qr_generated`, the QR image renders in the modal. If the QR rotates before scanning, the image updates live.

### 5 — User Scans the QR

The user opens WhatsApp on their phone → **Linked Devices** → **Link a Device** → scans the code.

### 6 — Post-Pairing Handshake

WhatsApp performs a registration handshake. Baileys saves the encrypted session credentials to MongoDB (`whatsapp_auth`). WhatsApp then restarts the connection with a `515` status code — this is normal. The server tears down the old socket without deleting credentials, then reconnects using the saved creds.

### 7 — Connected

On `connection === "open"`, the server writes `status: "connected"` and the linked phone number to `whatsapp_qr_sessions`. The next poll returns this to the frontend, which shows the ✅ confirmation with the phone number.

### 8 — Incoming Messages

Every inbound WhatsApp message triggers `messages.upsert`. The server:
1. Looks up the `userId` for this `chatbotId` in MongoDB
2. Calls `POST /api/pinecone` on the Next.js app — searches the chatbot's knowledge base using multi-query vector search
3. Sends the retrieved context + user message to OpenAI GPT-4o
4. Replies to the WhatsApp sender via `sock.sendMessage`

---

## Reconnection & Resilience

| Scenario | Behaviour |
|---|---|
| Server restart | On startup, all `chatbotId`s with `status: "connected"` in DB are automatically restored |
| Transient disconnect (network blip, code 515) | Auto-reconnect after 5 seconds — credentials are preserved |
| Logged out from phone | Auth cleared, user must scan QR again |
| Bad protocol version (405) | Auth cleared, treated as fatal — user must scan QR again |
| Single socket crash | Caught by `uncaughtException` / `unhandledRejection` — other sessions unaffected |
| Frontend grace window | Modal tolerates `disconnected` status for 45 seconds during post-pairing reconnect before showing an error |

---

## Security

- All requests from Next.js → GCP server carry an `x-wa-secret` shared secret header. Requests without it return `401 Unauthorized`.
- The Next.js proxy validates chatbot ownership (MongoDB lookup of `chatbotId + userId`) before forwarding any request — one user can never touch another user's session.
- Baileys credentials (encryption keys, session tokens) are stored only in MongoDB Atlas — never on disk or in memory beyond process lifetime.
- The `SERVER_SECRET` and all API keys are injected as environment variables at runtime. They are never committed to the repository.

---

## Files

| File | Purpose |
|---|---|
| `whatsapp-server.js` | Standalone Express + Baileys server (runs on GCP VM) |
| `Dockerfile.whatsapp-server` | Container image — available if Docker deployment is preferred |
| `src/app/(secure)/chatbot/dashboard/whatsapp-qr/session/api/route.ts` | Next.js proxy — ownership validation + upstream forwarding |
| `src/app/(secure)/chatbot/dashboard/_components/Modal/WhatsappQRModal.tsx` | React modal — QR display, polling, connected/error states |
| `src/app/(secure)/chatbot/dashboard/_components/Modal/WhatsappQRModal.scss` | Modal styles |

---

## MongoDB Collections

### `whatsapp_auth`
Stores Baileys session credentials (encryption keys, signal state) per chatbot.

```
{
  chatbotId:  "asst_…",
  key:        "creds" | "app-state-sync-key-…" | "pre-key-…" | …,
  value:      { … }   // Baileys auth object (Buffers stored as BSON Binary)
}
```
Index: `{ chatbotId: 1, key: 1 }` — unique

### `whatsapp_qr_sessions`
Tracks live session status and metadata.

```
{
  chatbotId:          "asst_…",
  userId:             "user_…",
  status:             "qr_generated" | "connected" | "disconnected",
  qrDataUrl:          "data:image/png;base64,…",   // ephemeral, cleared on connect
  phoneNumber:        "15551234567",
  qrGeneratedAt:      ISODate,
  connectedAt:        ISODate,
  disconnectedAt:     ISODate,
  lastDisconnectReason: "…",
  lastActivity:       ISODate,
  updatedAt:          ISODate
}
```
Index: `{ chatbotId: 1 }` — unique

---

## Environment Variables

### Next.js app (Vercel)

| Variable | Description |
|---|---|
| `WHATSAPP_SERVER_URL` | Full URL of the GCP WhatsApp server, e.g. `https://wa.your-domain.com` |
| `WHATSAPP_SERVER_SECRET` | Shared secret — must match `SERVER_SECRET` on the GCP server |

### GCP WhatsApp server

| Variable | Description |
|---|---|
| `MONGO_URI` | MongoDB Atlas connection string |
| `MONGO_DB_NAME` | Database name (optional, defaults to URI db) |
| `PORT` | HTTP port (default `3001`) |
| `SERVER_SECRET` | Shared secret for request authentication |
| `NEXT_PUBLIC_WEBSITE_URL` | Base URL of the Next.js app (used to call `/api/pinecone`) |
| `NEXT_PUBLIC_OPENAI_KEY` | OpenAI API key for AI reply generation |

---

## Deployment

### Recommended: GCP Compute Engine VM (e2-small, 2 GB RAM)

A VM is the right choice for this workload. The WhatsApp server is **stateful** — it holds live Baileys WebSocket sessions in memory. Cloud Run is designed for stateless services and creates two problems for stateful workloads (see *Why not Cloud Run?* below). A plain VM with PM2 avoids both problems entirely.

**Capacity on a 2 GB VM:**

```
2 GB total RAM
- ~400 MB  Node.js process baseline + Express
- ~200 MB  OS + system processes
─────────────────────────────────────────────
~1.4 GB left for sessions

Each Baileys session ≈ 3–5 MB RAM
→ ~300 concurrent connected Torri users comfortably
```

---

### Step 1: SSH into the VM

From your local machine (Windows PowerShell):

```powershell
gcloud compute ssh torri-whatsapp-server --zone=asia-east2-c
```

Or use the browser terminal: GCP Console → Compute Engine → VM Instances → click **SSH** button.

---

### Step 2: Install Node.js 22

In the SSH session:

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
```

Verify: `node --version` should show `v22.x.x`

---

### Step 3: Install PM2

PM2 is the process manager that keeps your server alive after crashes and auto-restarts it on VM reboot.

```bash
sudo npm install -g pm2
```

---

### Step 4: Copy Project Files to the VM

You need: `whatsapp-server.js`, `package.json`, `package-lock.json`, and `src/db.js`.

**Option A — If you have Git set up:**

In the SSH session:

```bash
cd ~
git clone https://github.com/your-org/chatbotAI.git
cd chatbotAI
```

**Option B — If you don't have Git, copy from your local machine:**

From your Windows PowerShell (NOT in the SSH session):

```powershell
$VM = "torri-whatsapp-server"
$ZONE = "asia-east2-c"
$PROJECT = "torriai"

gcloud config set project $PROJECT
gcloud compute scp whatsapp-server.js ${VM}:~/ --zone=$ZONE
gcloud compute scp package.json ${VM}:~/ --zone=$ZONE
gcloud compute scp package-lock.json ${VM}:~/ --zone=$ZONE
gcloud compute scp --recurse src/db.js ${VM}:~/ --zone=$ZONE
```

Then in the SSH session:

```bash
cd ~
mkdir -p src
# Make sure all files are there
ls -la whatsapp-server.js package.json package-lock.json
```

---

### Step 5: Install Dependencies

In the SSH session:

```bash
npm install --omit=dev
```

This installs only production dependencies (no dev tools) to keep node_modules lean.

---

### Step 6: Create `.env.local` with Your Configuration

In the SSH session, create the environment file:

```bash
nano .env.local
```

Paste the following template and fill in your actual values:

```
MONGO_URI=mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/?retryWrites=true&w=majority
MONGO_DB_NAME=luciferos-test
PORT=3001
SERVER_SECRET=your-shared-secret-here
NEXT_PUBLIC_WEBSITE_URL=https://your-vercel-app.vercel.app/
NEXT_PUBLIC_OPENAI_KEY=sk-proj-...
```

**Where to get each value:**

| Variable | Source |
|---|---|
| `MONGO_URI` | MongoDB Atlas → Databases → Connect → copy connection string |
| `MONGO_DB_NAME` | Your database name (e.g. `luciferos-test`) |
| `SERVER_SECRET` | Make up a random string, e.g. `whatsapp-secret-abc123xyz`. Must match `WHATSAPP_SERVER_SECRET` in Vercel. |
| `NEXT_PUBLIC_WEBSITE_URL` | Your Vercel app URL with trailing slash, e.g. `https://torri-ai.vercel.app/` |
| `NEXT_PUBLIC_OPENAI_KEY` | From https://platform.openai.com/api-keys |

Save and exit nano: Press `Ctrl+X`, then `Y`, then `Enter`.

---

### Step 7: Start the Server with PM2

In the SSH session:

```bash
pm2 start whatsapp-server.js --name wa-server
```

Check it started:

```bash
pm2 status
```

You should see `wa-server` with status `online`.

---

### Step 8: Enable Auto-Start on VM Reboot

```bash
pm2 startup
# Read the output carefully — it will print a command like:
# sudo env PATH=$PATH:/usr/bin /usr/local/lib/node_modules/pm2/bin/pm2 startup systemd ...
# Copy and run that exact command (it will ask for sudo password)

pm2 save
```

Now if the VM restarts, PM2 automatically resurrects the server.

---

### Step 9: Verify the Server is Running

In the SSH session:

```bash
curl http://localhost:3001/health
```

Should return: `{"ok":true}`

From your local machine, test the external IP (replace with your actual external IP from GCP):

```powershell
curl http://34.96.204.39:3001/health
```

Should also return: `{"ok":true}`

If you get a connection refused, the server may still be starting. Wait 10 seconds and retry.

---

### Step 10: Configure Vercel Environment Variables

In your Vercel project settings, add two new environment variables:

| Variable | Value |
|---|---|
| `WHATSAPP_SERVER_URL` | `http://YOUR_VM_EXTERNAL_IP:3001` (e.g. `http://34.96.204.39:3001`) |
| `WHATSAPP_SERVER_SECRET` | Must match `SERVER_SECRET` from your VM's `.env.local` |

Get your VM's external IP from GCP Console → Compute Engine → VM Instances → look in the **External IP** column.

After adding these, redeploy Vercel:

```powershell
# From your project folder
git push  # or use Vercel's manual redeploy button
```

---

### Step 11: Test the Full Integration

1. Go to Torri dashboard → Integrations
2. Find **WhatsApp (QR / Personal)** and click **Connect**
3. Watch the VM logs in real time:

```bash
# In your SSH session (or a second SSH tab)
pm2 logs wa-server
```

You should see logs like:

```
[wa-server] ✅ Connected to MongoDB
[wa-server] 🔁 Restoring 0 connected session(s)…
[wa-server] 🚀 WhatsApp QR server listening on port 3001
[wa-server] [asst_f2Eshz3UBjgyYR1VAtjb1iEf] Using WA version 2.2431.XX
[wa-server] [asst_...] status: qr_generated
[wa-server] ✅ [asst_...] Connected as +1234567890
```

Scan the QR code on your phone, and the logs should show the connection succeed.

---

### Useful PM2 Commands

```bash
pm2 status           # See if wa-server is running
pm2 logs wa-server   # Tail live logs (Ctrl+C to exit)
pm2 logs wa-server --lines 50  # Show last 50 lines
pm2 monit            # Live dashboard (CPU, RAM, uptime)
pm2 restart wa-server
pm2 stop wa-server
pm2 delete wa-server
```

---

### When to Upgrade the VM

| Signal | Action |
|---|---|
| `pm2 monit` RAM consistently above 1.5 GB | Upgrade to e2-medium (4 GB RAM, ~$27/month) |
| 500+ active Torri users with WhatsApp | Upgrade to e2-standard-2 (8 GB RAM) |
| 1,000+ active users | Shard into multiple VMs behind a load balancer |

---

### Optional: Put a Domain + HTTPS in Front

The raw IP `http://34.96.204.39:3001` works, but it's not secure and looks unprofessional. To add HTTPS:

1. Point a domain (e.g. `wa.your-domain.com`) to the VM's external IP via DNS
2. SSH into the VM and install Nginx + Certbot:

```bash
sudo apt-get install -y nginx certbot python3-certbot-nginx
sudo certbot certonly -d wa.your-domain.com
```

3. Configure Nginx as a reverse proxy (point `wa.your-domain.com` → `localhost:3001`)
4. Update Vercel: `WHATSAPP_SERVER_URL=https://wa.your-domain.com`

This is optional for now — the raw IP works fine for testing.

---

### Why Not Cloud Run?

Cloud Run has two fundamental problems for this workload:

**Problem 1 — Scales to zero.** Cloud Run shuts the container down after a few minutes of no traffic to save cost. When it wakes back up it is a fresh process with an empty `sessions` Map. Any WhatsApp message that arrives during the cold-start window (~10–30 seconds) is missed.

**Problem 2 — Can spin up multiple instances.** Under load, Cloud Run may start a second container. Now two processes each hold different halves of the session registry. A chatbot's status poll might hit the container that has no record of it, triggering a duplicate Baileys socket for the same WhatsApp number. WhatsApp detects the conflict and disconnects both.

```
Container A:  sessions → { "asst_123": connected ✅ }
Container B:  sessions → { }  ← unaware of asst_123

Incoming message → routes to Container B
→ B starts a new Baileys socket for asst_123
→ WhatsApp sees two clients for the same number
→ kicks both out ❌
```

You can work around both by setting `min-instances=1` and `max-instances=1`, but at that point you are paying Cloud Run prices for a permanently-running single container — more expensive and more complex than a plain VM.

---

## API Reference

All endpoints require the `x-wa-secret` header (handled transparently by the Next.js proxy).

### `POST /wa-qr/start/:chatbotId`
Start or resume a WhatsApp session. Returns immediately.

**Body:** `{ "userId": "string" }`

**Response:**
```json
{ "status": "starting" }
// or if already connected:
{ "status": "connected", "phoneNumber": "15551234567" }
```

### `GET /wa-qr/status/:chatbotId`
Poll session status. Called every 2.5 seconds by the frontend.

**Response:**
```json
{ "status": "qr_generated", "qrDataUrl": "data:image/png;base64,…" }
// or:
{ "status": "connected", "phoneNumber": "15551234567" }
// or:
{ "status": "disconnected" }
```

### `DELETE /wa-qr/disconnect/:chatbotId`
Disconnect the session and clear all stored credentials.

**Response:** `{ "message": "Disconnected" }`

### `GET /health`
Health check. Returns `{ "ok": true }`.

---

## Key Design Decisions

**Why a separate GCP server and not a Vercel serverless function?**  
Baileys maintains a persistent WebSocket connection to WhatsApp. Vercel serverless functions time out after 10–60 seconds and have no persistent state between invocations. A long-running Node.js process on GCP is the correct runtime for this workload.

**Why is `/start` fire-and-return?**  
Fetching the latest WA protocol version, loading auth from MongoDB, and negotiating the WebSocket handshake can take several seconds. Blocking the HTTP response risks a Vercel gateway timeout. Instead, the server starts the session in the background and the frontend polls `/status` for the result.

**Why store QR as a data URL in MongoDB?**  
QR codes rotate every ~20 seconds. Storing the `data:image/png` URL in MongoDB means the frontend can always retrieve the latest QR via a simple status poll — no extra image storage layer needed.

**Why split `teardownSocket` and `stopSession`?**  
During the normal post-pairing reconnect (WhatsApp sends a `515` close), credentials must be preserved. `teardownSocket` closes the socket without touching auth. `stopSession` is only called on user-initiated disconnect and explicitly clears auth, forcing a fresh QR on the next connect.

**Why `fixBuffers`?**  
MongoDB's BSON driver stores `Buffer`/`Uint8Array` values (used by Baileys for cryptographic keys) as `Binary` objects. Reading them back without conversion caused a `"data argument must be of type Buffer"` crash deep inside Node.js crypto during the Noise protocol handshake. `fixBuffers` recursively converts every `Binary` back to a `Buffer` before the data reaches Baileys.
