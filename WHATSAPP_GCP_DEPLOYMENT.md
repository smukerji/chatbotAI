# WhatsApp QR Server — GCP VM Deployment Guide

This guide deploys `whatsapp-server.js` onto a GCP Compute Engine VM (the same
infrastructure your existing torri-whatsapp-server already uses) and wires it
to your Vercel-hosted torri.ai Next.js app.

---

## Architecture Overview

```
┌─────────────────────────────┐        ┌──────────────────────────────────┐
│  Vercel (torri.ai)          │        │  GCP VM (e2-micro or e2-small)   │
│                             │        │                                  │
│  Next.js app                │◄──────►│  whatsapp-server.js (port 3001)  │
│  - Dashboard UI             │  HTTP  │  - Baileys WebSocket to WA       │
│  - /webhook/api             │        │  - Express REST API              │
│  - All other routes         │        │  - PM2 process manager           │
└─────────────────────────────┘        └──────────────────────────────────┘
             │                                        │
             └────────────────┬───────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │  MongoDB Atlas    │
                    │  (shared DB)      │
                    └───────────────────┘
```

The two services share the same MongoDB Atlas instance — that's the only bridge
they need. No direct code coupling between Vercel and the GCP VM.

---

## Part 1 — Prepare the GCP VM

### 1.1 Create the VM (if you don't have one already)

Go to GCP Console → Compute Engine → VM Instances → Create Instance.

Recommended settings:
- **Name:** `torri-whatsapp-server`
- **Region/Zone:** pick one close to your users (e.g. `asia-east1-b` for HK)
- **Machine type:** `e2-small` (1 vCPU, 2 GB RAM) — sufficient for Baileys
- **Boot disk:** Ubuntu 22.04 LTS, 20 GB standard persistent disk
- **Firewall:** check "Allow HTTP traffic" and "Allow HTTPS traffic"

### 1.2 Reserve a static external IP

GCP Console → VPC Network → External IP addresses → Reserve Static Address.
Assign it to your VM. Write it down — you'll need it later.

### 1.3 Open port 3001 in the firewall

GCP Console → VPC Network → Firewall → Create Firewall Rule:
- **Name:** `allow-whatsapp-server`
- **Direction:** Ingress
- **Targets:** All instances in the network (or use a target tag)
- **Source IP ranges:** `0.0.0.0/0`
- **Protocols/ports:** TCP `3001`

> **Tip:** In production you should restrict source IP ranges to only Vercel's
> outbound IPs, or better yet put an Nginx reverse proxy in front and use 443.

---

## Part 2 — Set Up the VM

SSH into your VM from the GCP console or:
```bash
gcloud compute ssh torri-whatsapp-server --zone=YOUR_ZONE
```

### 2.1 Install Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version   # should print v20.x.x
```

### 2.2 Install PM2 (process manager — keeps server alive after crashes/reboots)

```bash
sudo npm install -g pm2
```

### 2.3 Install Git

```bash
sudo apt-get install -y git
```

---

## Part 3 — Deploy the WhatsApp Server

### 3.1 Clone your repo onto the VM

```bash
cd ~
git clone https://github.com/YOUR_ORG/YOUR_REPO.git chatbotAI
cd chatbotAI
```

If the repo is private, use a deploy key or personal access token:
```bash
git clone https://YOUR_TOKEN@github.com/YOUR_ORG/YOUR_REPO.git chatbotAI
```

### 3.2 Install dependencies

The VM only needs the dependencies used by `whatsapp-server.js` — you don't
need to build the Next.js app here.

```bash
cd ~/chatbotAI
npm install --omit=dev
```

### 3.3 Create the environment file

```bash
nano ~/chatbotAI/whatsapp-server.env.local
```

Paste the following, filling in your real values:

```env
# MongoDB — same Atlas cluster as Vercel
MONGO_URI=mongodb+srv://luciferDBUser:YOUR_PASSWORD@serverlessinstance0.vnqkynp.mongodb.net/luciferai-test?retryWrites=true&w=majority

# Port the Express server listens on
PORT=3001

# Shared secret — Vercel sends this in X-WA-Secret header to authenticate calls
# Use a strong random string: openssl rand -hex 32
SERVER_SECRET=REPLACE_WITH_STRONG_RANDOM_SECRET

# Base URL of your Vercel app — used for tool calls (Pinecone, Shopify, etc.)
NEXT_PUBLIC_WEBSITE_URL=https://torri.ai/

# OpenAI key — used for AI replies
NEXT_PUBLIC_OPENAI_KEY=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
NEXT_PUBLIC_OPENAI_PROJ_KEY=proj_u64WrrFVesJjOdbrFazHmv2A
```

Save and exit (`Ctrl+X`, `Y`, `Enter`).

Secure the file so only you can read it:
```bash
chmod 600 ~/chatbotAI/whatsapp-server.env.local
```

### 3.4 Create PM2 ecosystem config

```bash
nano ~/chatbotAI/ecosystem.config.js
```

```js
module.exports = {
  apps: [
    {
      name: "torri-whatsapp-server",
      script: "whatsapp-server.js",
      cwd: "/home/YOUR_VM_USER/chatbotAI",   // ← replace YOUR_VM_USER
      node_args: "--env-file=whatsapp-server.env.local",
      instances: 1,          // must be 1 — Baileys is stateful
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
      },
      error_file: "/home/YOUR_VM_USER/logs/wa-error.log",
      out_file:   "/home/YOUR_VM_USER/logs/wa-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
  ],
};
```

Create the logs directory:
```bash
mkdir -p ~/logs
```

### 3.5 Start the server with PM2

```bash
cd ~/chatbotAI
pm2 start ecosystem.config.js
pm2 save                         # persist across reboots
pm2 startup                      # follow the printed command to enable autostart
```

Check it's running:
```bash
pm2 status
pm2 logs torri-whatsapp-server --lines 50
```

You should see:
```
✅ Connected to MongoDB
🚀 WhatsApp QR server listening on port 3001
```

---

## Part 4 — (Optional but Recommended) Nginx + HTTPS

Running on plain HTTP port 3001 works, but using HTTPS on port 443 is better
for production. Skip this section if you're in a hurry and come back to it.

### 4.1 Install Nginx and Certbot

```bash
sudo apt-get install -y nginx certbot python3-certbot-nginx
```

### 4.2 Point a subdomain at the VM

In your DNS (wherever torri.ai is managed), add an A record:
```
wa.torri.ai  →  YOUR_VM_STATIC_IP
```

### 4.3 Create Nginx config

```bash
sudo nano /etc/nginx/sites-available/wa-torri
```

```nginx
server {
    listen 80;
    server_name wa.torri.ai;

    location / {
        proxy_pass         http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection "upgrade";
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/wa-torri /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 4.4 Get SSL certificate

```bash
sudo certbot --nginx -d wa.torri.ai
```

Follow the prompts. Certbot auto-renews. After this your server is accessible
at `https://wa.torri.ai`.

---

## Part 5 — Update Vercel Environment Variables

Go to **Vercel Dashboard → Your Project → Settings → Environment Variables** and
add/update:

| Variable | Value |
|---|---|
| `WHATSAPP_SERVER_URL` | `https://wa.torri.ai` (or `http://YOUR_VM_IP:3001` without Nginx) |
| `WHATSAPP_SERVER_SECRET` | The same strong secret you put in `SERVER_SECRET` on the VM |

After adding them, **redeploy** the Vercel project so the new env vars take effect:
```bash
vercel --prod
```
or trigger a redeploy from the Vercel dashboard.

---

## Part 6 — Scan the QR Code

1. Open your torri.ai dashboard in the browser
2. Go to the WhatsApp QR integration page
3. Click "Connect" / "Start" — this calls `WHATSAPP_SERVER_URL/wa-qr/start/:chatbotId`
4. A QR code appears — scan it with your phone (WhatsApp → Linked Devices → Link a Device)
5. The server logs should show:
   ```
   ✅ [chatbotId] Connected as 85253922699
   ```
6. Send a WhatsApp message to the number — you should see `[MSG] From ...` in the logs

---

## Part 7 — Keeping the Server Updated

When you push code changes, SSH into the VM and run:

```bash
cd ~/chatbotAI
git pull
npm install --omit=dev   # only if package.json changed
pm2 restart torri-whatsapp-server
pm2 logs torri-whatsapp-server --lines 30
```

---

## Part 8 — Useful PM2 Commands

```bash
pm2 status                                    # see all processes
pm2 logs torri-whatsapp-server                # tail live logs
pm2 logs torri-whatsapp-server --lines 100    # last 100 lines
pm2 restart torri-whatsapp-server             # restart after code change
pm2 stop torri-whatsapp-server                # stop
pm2 delete torri-whatsapp-server              # remove from PM2
pm2 monit                                     # live CPU/memory dashboard
```

---

## Quick Reference — What Each Env Var Does

| Variable | Where set | Purpose |
|---|---|---|
| `MONGO_URI` | VM `.env` + Vercel | Shared MongoDB Atlas connection |
| `PORT` | VM `.env` | Port the Express server binds to (3001) |
| `SERVER_SECRET` | VM `.env` | Shared secret; Vercel sends in `X-WA-Secret` header |
| `NEXT_PUBLIC_WEBSITE_URL` | VM `.env` | Vercel app URL for tool call proxying |
| `NEXT_PUBLIC_OPENAI_KEY` | VM `.env` + Vercel | OpenAI API key for AI replies |
| `WHATSAPP_SERVER_URL` | Vercel only | Points Next.js app at the GCP VM |
| `WHATSAPP_SERVER_SECRET` | Vercel only | Must match `SERVER_SECRET` on VM |

---

## Troubleshooting

**440 Connection Replaced**
Another WhatsApp Web session is active. On your phone: WhatsApp → Settings →
Linked Devices → remove all sessions. Then restart: `pm2 restart torri-whatsapp-server`

**Auth cleared, QR not showing**
The MongoDB `whatsapp_auth` collection was wiped. Open the dashboard and
re-scan the QR.

**"No chatbot found" errors**
The `chatbotId` in `whatsapp_qr_sessions` doesn't match any document in
`user-chatbots`. Re-connect from the dashboard for that chatbot.

**VM out of memory**
Upgrade from `e2-micro` to `e2-small`. Baileys + Node needs ~200-300 MB.

**Changes not taking effect after git pull**
Always run `pm2 restart torri-whatsapp-server` after pulling — PM2 does not
auto-reload on file changes in production mode.
