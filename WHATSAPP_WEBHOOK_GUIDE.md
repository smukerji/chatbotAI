# WhatsApp Webhook Guide for Chatbot AI

## 📋 Table of Contents
1. [What is a Webhook?](#what-is-a-webhook)
2. [How WhatsApp Webhooks Work](#how-whatsapp-webhooks-work)
3. [Your Chatbot Flow](#your-chatbot-flow)
4. [Common Scenarios](#common-scenarios)
5. [Understanding the Logs](#understanding-the-logs)
6. [Troubleshooting](#troubleshooting)
7. [Best Practices](#best-practices)

---

## 🤔 What is a Webhook?

Think of a webhook like a **doorbell for your website**. 

- When someone sends a message on WhatsApp, WhatsApp rings your "doorbell" (sends a webhook)
- Your server answers the door and processes the message
- Your chatbot responds back to the user

**Simple Example:**
```
User sends: "Hello!" on WhatsApp
     ↓
WhatsApp rings your webhook (sends notification)
     ↓
Your server receives the message
     ↓
Your AI chatbot generates a response
     ↓
Response sent back to user on WhatsApp
```

---

## 📱 How WhatsApp Webhooks Work

### 1. **Verification (Initial Setup)**
When you first connect your chatbot to WhatsApp, WhatsApp needs to verify it's really you:

```
WhatsApp: "Hey, are you the real chatbot? Here's a challenge code."
Your Server: "Yes! Here's the challenge code back."
WhatsApp: "Great! You're verified. I'll send you messages now."
```

**In Technical Terms:**
- WhatsApp sends a GET request with `hub.mode`, `hub.challenge`, and `hub.verify_token`
- Your server checks if the token matches your stored token
- If it matches, you send back the `hub.challenge` value
- Now you're connected! ✅

### 2. **Receiving Messages (Daily Operation)**
Every time a user sends a message:

```
User types message → WhatsApp packages it → Sends POST request to your webhook
                                                          ↓
                                        Your server receives and processes it
```

**What's in the Package:**
- **Message ID**: Unique identifier for each message (like a tracking number)
- **User Phone Number**: Who sent the message
- **Business Account Number**: Your WhatsApp Business number
- **Message Content**: The actual text the user typed
- **Message Type**: Text, image, audio, etc. (we only handle text)
- **Timestamps**: When the message was sent

---

## 🤖 Your Chatbot Flow

### Step-by-Step Process

#### **Step 1: Receive Webhook** 📨
```
WhatsApp sends message data → Your webhook receives it
```
**What happens:**
- Server logs: "Received WhatsApp webhook"
- Extracts the message details

#### **Step 2: Validation Checks** ✅
```
Is this a status update? → Ignore it
Is this a test message? → Ignore it
Is this empty? → Ignore it
Is this a duplicate? → Ignore it
```
**Protection Layers:**
1. ✋ **Status Update Filter**: Ignores delivery receipts and read receipts
2. ✋ **Message Type Filter**: Only processes text messages
3. ✋ **Duplicate Detection**: Prevents processing the same message twice
4. ✋ **Circuit Breaker**: Stops processing if too many errors occur

#### **Step 3: Check Subscription** 💳
```
Is the user's subscription active?
     ↓
YES → Continue processing
NO → Send "Subscription expired" message
```

#### **Step 4: Get or Create Conversation Thread** 💬
```
Has this user messaged today?
     ↓
YES → Use existing conversation thread
NO → Create new thread for today
```

**Think of a thread like a conversation history:**
- Each user gets one thread per day
- All messages for that day go into the same thread
- Next day = new thread starts fresh

#### **Step 5: Store User Message** 💾
```
Save user message to database immediately
```
**Why immediately?**
- So you have a record even if something goes wrong later
- Helps with debugging and analytics

#### **Step 6: Check Message Limits** 📊
```
Has user exceeded message limit?
     ↓
YES → Send limit reached message
NO → Continue to AI processing
```

#### **Step 7: AI Processing** 🧠

**Two Modes:**

**Mode A: Assistant API (Your Setup)**
```
1. Get conversation history (context)
2. Check if knowledge base search needed
   ↓ (if yes)
3. Search knowledge base (Pinecone/Vector DB)
4. Get relevant information
   ↓
5. Add message to OpenAI thread
6. Run AI Assistant with instructions
7. Assistant may call tools (functions)
8. Wait for completion (can take 10-60 seconds)
9. Get AI response
```

**Mode B: Chat Completion API (Alternative)**
```
1. Get conversation history
2. Search knowledge base if needed
3. Build prompt with history + context
4. Send to OpenAI Chat API
5. Get response (usually faster)
```

#### **Step 8: Send Response** 📤
```
AI generates response → Format for WhatsApp → Send via WhatsApp API
```

#### **Step 9: Update Database** 💾
```
Save assistant response to database
Update usage statistics (tokens used)
Mark message as completed
```

---

## 🎭 Common Scenarios

### Scenario 1: **Quick Question** ⚡ (5-10 seconds)

```
User: "Hello"
  ↓ [2 seconds]
Bot: "Hi! How can I help you today?"
```

**What Happens:**
- ✅ Webhook received
- ✅ Message processed
- ✅ Simple response generated
- ✅ Response sent
- ✅ Total time: ~5 seconds

**Logs You'll See:**
```
[06:30:00] Received WhatsApp webhook
[06:30:00] Extracted question from WhatsApp
[06:30:00] Starting WhatsApp operation
[06:30:05] WhatsApp message sent successfully
[06:30:05] WhatsApp operation completed in 5000ms
```

---

### Scenario 2: **Knowledge Base Query** 📚 (15-30 seconds)

```
User: "What are your business hours?"
  ↓ [searching knowledge base... 10 seconds]
  ↓ [AI processing with context... 8 seconds]
Bot: "Our business hours are Monday-Friday, 9 AM to 6 PM EST."
```

**What Happens:**
- ✅ Webhook received
- ✅ Detected needs knowledge search
- ✅ Pinecone API called
- ✅ Relevant docs retrieved
- ✅ AI generates contextual response
- ✅ Response sent
- ✅ Total time: ~20 seconds

**Logs You'll See:**
```
[06:30:00] Received WhatsApp webhook
[06:30:00] Starting WhatsApp operation
[06:30:05] Pinecone API call started
[06:30:12] Pinecone API completed
[06:30:15] Running assistant on thread
[06:30:18] Assistant run completed
[06:30:20] WhatsApp message sent successfully
```

---

### Scenario 3: **Tool/Function Call** 🛠️ (30-60 seconds)

```
User: "What can you help me with?"
  ↓ [AI decides to call get_reference function... 5 seconds]
  ↓ [Function executes, searches knowledge base... 25 seconds]
  ↓ [AI processes function result... 10 seconds]
Bot: "I can help you with: 1) Product info, 2) Support tickets..."
```

**What Happens:**
- ✅ Webhook received
- ✅ AI decides it needs to call a function
- ✅ Function executes (e.g., search reference docs)
- ✅ Result returned to AI
- ✅ AI processes result
- ✅ Final response generated
- ✅ Response sent
- ✅ Total time: ~40 seconds

**Logs You'll See:**
```
[06:30:00] Received WhatsApp webhook
[06:30:00] Starting WhatsApp operation
[06:30:05] Running assistant on thread
[06:30:08] Run status: requires_action
[06:30:08] Handling required action
[06:30:08] Processing 1 tool calls
[06:30:08] Processing tool call: get_reference
[06:30:35] Tool outputs submitted
[06:30:45] Run status: completed
[06:30:47] WhatsApp message sent successfully
```

---

### Scenario 4: **WhatsApp Retry (Your Recent Issue)** 🔄

**What Was Happening (Before Fix):**
```
User: "What can you help me with?"
  ↓ [Processing... 10 seconds]
  ↓ [Tool call executing... 15 seconds]
  ↓ [Still processing... 20 seconds]
  ↓ [WhatsApp gets impatient, resends same message]
  ↓
Second Request Arrives (DUPLICATE)
  → Tries to add message to thread
  → ERROR: "Can't add message while run is active"
  → Adds message to database AGAIN (duplicate entry)
  → Tries to run assistant
  → ERROR: "Thread already has active run"
  → Sends user: "I'm experiencing technical difficulties" ❌
  ↓ [First request continues...]
  ↓ [First request completes... 40 seconds]
Bot: [Correct response] ✅

RESULT: User gets TWO messages (error + correct answer) 😕
DATABASE: Has duplicate entries 😕
```

**What Happens Now (After Fix):**
```
User: "What can you help me with?"
  ↓ [Processing... 10 seconds]
  ↓ [Tool call executing... 15 seconds]
  ↓ [Still processing... 20 seconds]
  ↓ [WhatsApp gets impatient, resends same message]
  ↓
Second Request Arrives (DUPLICATE)
  → Duplicate detected by messageKey check ✅
  → OR tries to add message to thread
  → ERROR: "Can't add message while run is active"
  → 🆕 Code detects this is a duplicate
  → 🆕 Exits gracefully, no DB update
  → Returns 200 to WhatsApp (I got it!) ✅
  ↓ [First request continues...]
  ↓ [First request completes... 40 seconds]
Bot: [Correct response] ✅

RESULT: User gets ONE message (correct answer) ✅
DATABASE: One entry ✅
```

**Why Does WhatsApp Retry?**
- WhatsApp expects a response within ~20 seconds
- If your server doesn't reply fast enough, WhatsApp thinks the message was lost
- WhatsApp automatically resends to ensure delivery
- **This is normal behavior!** Our code now handles it gracefully

---

## 📊 Understanding the Logs

### Log Format
```
[2025-10-09T06:33:48.372Z] Message description { additional data }
```
- **Timestamp**: When the event happened (UTC time)
- **Message**: What happened in plain English
- **Data**: Additional technical details

---

### Key Log Messages

#### ✅ **Good Messages (Everything Working)**

**Message Received:**
```
[timestamp] Received WhatsApp webhook {
  "hasEntry": true,
  "entryLength": 1
}
```
→ A new message just arrived

**Duplicate Ignored:**
```
[timestamp] Message already being processed, ignoring duplicate {
  "messageKey": "246482015216040:918160739392:wamid..."
}
```
→ Smart! We're not processing the same message twice

**Thread Created/Found:**
```
[timestamp] Phone 918160739392 already has conversation today
[timestamp] Using existing thread: thread_abc123
```
→ Found user's conversation for today

**AI Processing:**
```
[timestamp] Running assistant asst_xyz on thread thread_abc123
[timestamp] Run status check: completed
```
→ AI is thinking and finished successfully

**Response Sent:**
```
[timestamp] WhatsApp message sent successfully to +918160739392
[timestamp] WhatsApp operation completed in 15000ms
```
→ Message delivered! Took 15 seconds total

---

#### ⚠️ **Warning Messages (Expected, Handled)**

**Status Update (Ignored):**
```
[timestamp] Received status update, ignoring
```
→ This is just WhatsApp telling us the message was delivered. We don't need to process it.

**Active Run Detected (Duplicate Handled):**
```
[timestamp] Active run detected - this is a duplicate/retry request from WhatsApp
```
→ WhatsApp tried to resend a message we're already processing. We're ignoring it safely.

**Duplicate Message:**
```
[timestamp] Duplicate message detected, ignoring {
  "timeSinceProcessed": "1250ms"
}
```
→ We already processed this message 1.25 seconds ago

---

#### ❌ **Error Messages (Need Attention)**

**Failed to Connect to DB:**
```
[timestamp] ERROR: Failed to connect to MongoDB
```
→ **Problem:** Database is down or credentials wrong
→ **Action:** Check MongoDB connection string

**Subscription Expired:**
```
[timestamp] Subscription expired, sending notification
```
→ **Problem:** User's plan ended
→ **Action:** User needs to renew subscription (automatic message sent)

**OpenAI API Error:**
```
[timestamp] ERROR: Failed to run assistant {
  "error": "Invalid API key"
}
```
→ **Problem:** OpenAI credentials are wrong
→ **Action:** Check NEXT_PUBLIC_OPENAI_KEY environment variable

**Circuit Breaker Opened:**
```
[timestamp] Circuit breaker OPENED for user: 246482015216040:918160739392
```
→ **Problem:** Too many errors for this user (5+ failures)
→ **Action:** System is protecting itself, will auto-reset in 10 minutes

---

### Understanding Time Measurements

**What's Normal:**
- Quick response (simple question): 2-10 seconds ✅
- Knowledge base search: 10-25 seconds ✅
- Tool/function call: 20-60 seconds ✅
- Complex multi-tool calls: 40-90 seconds ⚠️ (WhatsApp may retry)

**What's Too Slow:**
- Anything over 90 seconds ❌
- If you see this consistently, optimize your:
  - Database queries
  - Vector search (Pinecone)
  - AI model selection (GPT-4 is slower than GPT-3.5)

---

## 🔧 Troubleshooting

### Problem 1: **Users Not Getting Responses**

**Symptoms:**
- Logs show "Received WhatsApp webhook" but nothing after
- No error messages in logs

**Possible Causes & Solutions:**

1. **Subscription Check Failing**
   ```
   Check logs for: "Subscription expired"
   Solution: Verify user subscription dates in database
   ```

2. **Chatbot Disabled**
   ```
   Check logs for: "Chatbot disabled, exiting"
   Solution: Enable chatbot in settings (isEnabled: true)
   ```

3. **Invalid WhatsApp Token**
   ```
   Check logs for: "401 Unauthorized" or "Invalid token"
   Solution: Update whatsAppAccessToken in database
   ```

---

### Problem 2: **Duplicate Messages in Database**

**Symptoms:**
- Same user message appears twice in database
- Logs show "Added user message" twice for same message

**Solution Applied:**
- ✅ Code now detects active runs and exits early
- Check for new log: "Active run detected - this is a duplicate/retry request"
- If still seeing duplicates, verify the fix is deployed

---

### Problem 3: **"Technical Difficulties" Messages to Users**

**Symptoms:**
- Users receive error message during normal operation
- Logs show: "Thread already has an active run"

**Solution Applied:**
- ✅ Code now catches this error and exits gracefully
- Check for new log: "Thread already has active run - duplicate/retry request"
- User should only get the correct response, no error

---

### Problem 4: **Very Slow Responses**

**Symptoms:**
- Responses take over 60 seconds
- WhatsApp retries frequently

**Diagnostic Steps:**

1. **Check Pinecone Response Time:**
   ```
   Look for: "Pinecone API completed in XXXXms"
   If over 15 seconds: Optimize your vector index
   ```

2. **Check AI Model:**
   ```
   Look for: "model": "gpt-4" vs "gpt-3.5-turbo"
   GPT-4: Slower but smarter
   GPT-3.5: Faster but less capable
   ```

3. **Check Tool Calls:**
   ```
   Look for: "Processing X tool calls"
   Multiple tool calls = longer processing time
   Optimize your tool/function implementations
   ```

**Solutions:**
- Use GPT-3.5-turbo for simple queries
- Optimize Pinecone queries (reduce top_k, improve indexing)
- Cache common queries
- Simplify tool/function logic

---

### Problem 5: **Circuit Breaker Blocking Users**

**Symptoms:**
- Logs show: "Circuit breaker OPEN for user"
- User can't get responses for 10 minutes

**Why It Happens:**
- Protection mechanism after 5+ consecutive failures
- Prevents system overload

**Solution:**
- Check what's causing the failures in logs
- Common causes:
  - Invalid API keys
  - Database connection issues
  - Malformed requests
- Fix the root cause
- Circuit breaker will auto-reset after 10 minutes

---

## ✅ Best Practices

### 1. **Monitor Your Logs Daily**
- Check for patterns of errors
- Look for slow response times
- Identify problematic users or queries

### 2. **Set Up Alerts**
Create alerts for:
- ❌ Multiple errors in short time (5+ in 5 minutes)
- ⏱️ Response times over 60 seconds
- 💾 Database connection failures
- 🔑 API authentication errors

### 3. **Optimize for Speed**
- Use faster AI models for simple queries
- Cache frequently asked questions
- Optimize database queries
- Monitor Pinecone performance

### 4. **Handle Errors Gracefully**
- ✅ Always return HTTP 200 to WhatsApp (even on errors)
- ✅ Send friendly error messages to users
- ✅ Log detailed error information for debugging
- ✅ Don't expose technical details to users

### 5. **Test Regularly**
- Test with various message types
- Test with slow/complex queries
- Test during high traffic
- Test error scenarios

### 6. **Keep Backups**
- Regular database backups
- Backup conversation histories
- Document your configuration

### 7. **Security**
- 🔒 Verify webhook tokens
- 🔒 Validate all inputs
- 🔒 Use HTTPS only
- 🔒 Rotate API keys regularly
- 🔒 Monitor for suspicious activity

---

## 🎓 Key Concepts Explained

### What is a "Thread"?
A **thread** is like a conversation notebook:
- Each user-day combination gets one thread
- All messages for that user on that day go in the same thread
- The AI can see the whole conversation in the thread
- Next day = new thread (fresh start)

**Example:**
```
Monday, Oct 9:
  Thread ID: thread_abc123
  - User: "Hello"
  - Bot: "Hi! How can I help?"
  - User: "What's your address?"
  - Bot: "123 Main St..."

Tuesday, Oct 10:
  Thread ID: thread_xyz789 (new thread!)
  - User: "Hello"
  - Bot: "Hi! How can I help?"
```

---

### What is a "Run"?
A **run** is the AI thinking process:
- You submit a question to the thread
- You start a "run" (tells AI to process the thread)
- AI reads the thread, thinks, and generates a response
- Run completes when AI is done

**Statuses:**
- `queued`: Waiting in line
- `in_progress`: AI is thinking
- `requires_action`: AI needs to call a tool/function
- `completed`: Done! ✅
- `failed`: Something went wrong ❌

---

### What is "Duplicate Detection"?
**Protection layers to prevent processing the same message twice:**

1. **Layer 1: Processed Messages Map**
   - Stores messages we've already completed
   - Checked first: "Did we already finish this?"

2. **Layer 2: Processing Messages Set**
   - Stores messages we're currently working on
   - Checked second: "Are we currently processing this?"

3. **Layer 3: User Lock**
   - One user = one request at a time
   - Prevents simultaneous processing for same user

4. **Layer 4 & 5: Active Run Detection** (🆕 New)
   - Detects when OpenAI says "already processing"
   - Exits gracefully without errors

---

### What is "Circuit Breaker"?
Think of it like a fuse in your home:
- If too many errors happen (5+ failures)
- The circuit breaker "trips" (opens)
- Blocks that user for 10 minutes
- Protects your system from overload
- Auto-resets after time period

---

## 📞 Quick Reference

### Webhook URL Format
```
https://yourdomain.com/chatbot/dashboard/webhook/api
```

### Environment Variables Needed
```bash
NEXT_PUBLIC_OPENAI_KEY=sk-...
NEXT_PUBLIC_OPENAI_PROJ_KEY=proj_...
NEXT_PUBLIC_OPENAI_ORG_KEY=org-...
MONGODB_URI=mongodb+srv://...
```

### WhatsApp Settings Required
- ✅ Webhook URL configured in WhatsApp
- ✅ Verification token stored in database
- ✅ Access token for sending messages
- ✅ Phone number ID (business account)

### Database Collections Used
- `whatsappbot_details`: WhatsApp configuration
- `user-chatbots`: Chatbot settings
- `chatbot-settings`: AI model settings
- `whatsapp-chat-history`: Conversation history
- `users`: User subscription info

---

## 🎉 Success Checklist

Your webhook is working properly when:

- ✅ Users receive responses within 30 seconds
- ✅ No duplicate messages in database
- ✅ No error messages sent to users during normal operation
- ✅ Logs show clear flow from webhook to response
- ✅ WhatsApp retries are handled gracefully
- ✅ Circuit breaker only triggers on real issues
- ✅ Subscription checks work correctly
- ✅ AI responses are relevant and contextual

---

## 📚 Additional Resources

### Understanding OpenAI Assistant API
- [Official OpenAI Assistants Guide](https://platform.openai.com/docs/assistants/overview)
- [Thread and Message Objects](https://platform.openai.com/docs/api-reference/messages)

### Understanding WhatsApp Business API
- [WhatsApp Webhook Guide](https://developers.facebook.com/docs/whatsapp/webhooks)
- [WhatsApp Cloud API Docs](https://developers.facebook.com/docs/whatsapp/cloud-api)

### MongoDB Best Practices
- [Connection Pooling](https://www.mongodb.com/docs/drivers/node/current/fundamentals/connection/)
- [Indexing for Performance](https://www.mongodb.com/docs/manual/indexes/)

---

## 💡 Tips for Non-Technical Users

**Think of your webhook like a restaurant:**

- **Webhook** = The restaurant's phone line
- **WhatsApp** = Customers calling to order
- **Your Server** = The kitchen receiving orders
- **AI Assistant** = The chef cooking the meal
- **Database** = Recipe book and order history
- **Response** = Delivering the food

**When orders (messages) come in:**
1. 📞 Phone rings (webhook receives message)
2. 📋 Order taken and written down (message logged)
3. 👨‍🍳 Chef checks recipe book (searches knowledge base)
4. 🍳 Chef cooks (AI processes)
5. 📦 Food packaged and delivered (response sent)

**Why duplicates happen:**
- Customer calls: "Did you get my order?"
- Kitchen says: "Yes! Still cooking, don't worry!"
- Now we handle these calls gracefully ✅

---

## 🆘 Getting Help

If you're stuck:

1. **Check the logs** - They tell you what's happening
2. **Look for error patterns** - One error might be random, many means a problem
3. **Test with simple messages** - Does "Hello" work? Start there.
4. **Check your credentials** - 90% of issues are expired/wrong API keys
5. **Review this guide** - The answer might be here!

---

**Last Updated**: October 9, 2025
**Version**: 2.0 (With duplicate handling fix)

---

Made with ❤️ for your Chatbot AI platform
